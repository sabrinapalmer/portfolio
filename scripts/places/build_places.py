"""Builds BrinaMaps' own place list and loads it into the app's database (Supabase).

Two open sources, merged:
  - Overture Maps places: wide coverage of businesses, with phone, website and brand
  - OpenStreetMap: opening hours, cuisine, accessibility and Wikipedia links, plus places Overture lacks
A place found in both keeps Overture's coverage fields and gains OpenStreetMap's details.

Run by .github/workflows/places.yml. Settings come from the environment:
  REGIONS        "west,south,east,north;..." boxes to cover
  OSM_EXTRACTS   space-separated Geofabrik .osm.pbf URLs covering those boxes
  MIN_CONF       lowest Overture confidence kept (0..1)
  MAX_ROWS       most places loaded (the free database tier holds about a million)
  SUPABASE_URL, SUPABASE_KEY (publishable key), IMPORT_TOKEN (the load token)
"""
import json, os, re, subprocess, sys, time, unicodedata, urllib.request, xml.etree.ElementTree as ET
from collections import defaultdict

import duckdb

REGIONS = [tuple(float(v) for v in r.split(',')) for r in os.environ['REGIONS'].split(';') if r.strip()]
OSM_EXTRACTS = os.environ.get('OSM_EXTRACTS', '').split()
MIN_CONF = float(os.environ.get('MIN_CONF', '0.6'))
MAX_ROWS = int(os.environ.get('MAX_ROWS', '1000000'))
SB_URL, SB_KEY, TOKEN = os.environ['SUPABASE_URL'].rstrip('/'), os.environ['SUPABASE_KEY'], os.environ.get('IMPORT_TOKEN', '')
DRY = os.environ.get('DRY_RUN') == '1' or not TOKEN   # without the load token (secret not set yet) it only builds and reports


def log(*a):
    print(time.strftime('%H:%M:%S'), *a, flush=True)


def notice(*a):   # shown on the run's summary page (and readable through GitHub's API), unlike plain log lines
    log(*a)
    print('::notice::' + ' '.join(str(x) for x in a).replace('\n', ' ')[:900], flush=True)


def inside(lon, lat):
    return any(w <= lon <= e and s <= lat <= n for w, s, e, n in REGIONS)


def fold(t):
    t = unicodedata.normalize('NFD', t or '').encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', ' ', t).strip()


STOP = {'the', 'de', 'la', 'el', 'los', 'las', 'y', 'and', 'of', 'restaurant', 'restaurante', 'cafe', 'store', 'tienda', 'inc', 'llc', 'sa', 'cv'}


def same_name(a, b):
    fa, fb = fold(a), fold(b)
    if not fa or not fb:
        return False
    if fa == fb or fa.startswith(fb) or fb.startswith(fa):
        return True
    ta, tb = set(fa.split()) - STOP, set(fb.split()) - STOP
    if not ta or not tb:
        return False
    return len(ta & tb) / min(len(ta), len(tb)) >= 0.6


# ---------- categories: one key per kind of place, in OpenStreetMap's "key:value" form (the app searches by these)
RULES = [
    (('coffee', 'cafe', 'coffee_shop', 'tea_room', 'tea_house'), 'amenity:cafe', 'Cafe'),
    (('fast_food', 'fast_food_restaurant', 'burger', 'hot_dog'), 'amenity:fast_food', 'Fast food'),
    (('bar', 'pub', 'brewery', 'winery', 'cocktail_bar', 'sports_bar', 'wine_bar', 'nightclub', 'cantina'), 'amenity:bar', 'Bar'),
    (('restaurant', 'diner', 'taqueria', 'food_truck', 'eatery', 'steakhouse', 'pizzeria', 'seafood_restaurant'), 'amenity:restaurant', 'Restaurant'),
    (('gas_station', 'fuel', 'petrol_station'), 'amenity:fuel', 'Gas station'),
    (('ev_charging_station', 'charging_station'), 'amenity:charging_station', 'EV charging'),
    (('supermarket', 'grocery_store', 'grocery'), 'shop:supermarket', 'Supermarket'),
    (('convenience_store', 'convenience'), 'shop:convenience', 'Convenience store'),
    (('pharmacy', 'drugstore', 'chemist'), 'amenity:pharmacy', 'Pharmacy'),
    (('atm',), 'amenity:atm', 'ATM'),
    (('bank', 'credit_union'), 'amenity:bank', 'Bank'),
    (('hospital', 'emergency_room'), 'amenity:hospital', 'Hospital'),
    (('clinic', 'urgent_care', 'urgent_care_clinic', 'medical_center', 'doctor', 'doctors'), 'amenity:clinic', 'Clinic'),
    (('park', 'playground', 'state_park', 'national_park', 'dog_park'), 'leisure:park', 'Park'),
    (('motel',), 'tourism:motel', 'Motel'),
    (('hotel', 'resort', 'inn', 'bed_and_breakfast', 'guest_house', 'hostel'), 'tourism:hotel', 'Hotel'),
    (('parking', 'parking_lot', 'parking_garage'), 'amenity:parking', 'Parking'),
    (('bakery', 'panaderia'), 'shop:bakery', 'Bakery'),
    (('hardware_store', 'home_improvement_store', 'doityourself', 'hardware'), 'shop:hardware', 'Hardware store'),
    (('campground', 'campsite', 'camp_site', 'rv_park', 'caravan_site'), 'tourism:camp_site', 'Campground'),
    (('post_office',), 'amenity:post_office', 'Post office'),
    (('library',), 'amenity:library', 'Library'),
    (('toilets', 'public_toilet', 'restroom'), 'amenity:toilets', 'Restrooms'),
    (('ice_cream', 'ice_cream_shop', 'paleteria'), 'amenity:ice_cream', 'Ice cream'),
]


def pretty(v):
    v = (v or '').replace('_', ' ').strip()
    return v[:1].upper() + v[1:] if v else ''


def category(word):
    w = (word or '').lower()
    parts = set(w.split('_'))
    for keys, cat, kind in RULES:
        if w in keys or any(k in parts for k in keys if '_' not in k):
            return cat, kind
    if any(x in parts for x in ('store', 'shop', 'boutique', 'market', 'mall', 'retail', 'outlet')):
        return 'shop:' + w, pretty(w)
    return ('other:' + w, pretty(w)) if w else ('other:place', 'Place')


YES = re.compile(r'^(yes|wlan|free|designated|only)$', re.I)


def facts(tags):
    f = [pretty(c.strip()) for c in re.split(r'[;,]', tags.get('cuisine', '')) if c.strip()][:2]
    for k, word in (('takeaway', 'Takeout'), ('delivery', 'Delivery'), ('outdoor_seating', 'Outdoor seating'), ('internet_access', 'Wi-Fi'), ('wheelchair', 'Wheelchair accessible')):
        if YES.match(tags.get(k, '')):
            f.append(word)
    return ' · '.join(f[:4]) or None


# ---------- Overture
def overture_release():
    with urllib.request.urlopen('https://overturemaps-us-west-2.s3.us-west-2.amazonaws.com/?list-type=2&prefix=release/&delimiter=/', timeout=60) as r:
        xml = r.read()
    ns = {'s3': 'http://s3.amazonaws.com/doc/2006-03-01/'}
    rel = sorted(p.text.split('/')[1] for p in ET.fromstring(xml).findall('.//s3:CommonPrefixes/s3:Prefix', ns))
    rel = [r for r in rel if re.match(r'^\d{4}-\d{2}-\d{2}', r)]
    return rel[-1]


def load_overture(release):
    con = duckdb.connect()
    for ext in ('httpfs', 'spatial'):
        con.execute(f'INSTALL {ext}; LOAD {ext};')
    con.execute("SET s3_region='us-west-2';")
    where = ' OR '.join(f'(bbox.xmin BETWEEN {w} AND {e} AND bbox.ymin BETWEEN {s} AND {n})' for w, s, e, n in REGIONS)
    q = f"""
      SELECT id, names.primary AS name, basic_category AS basic, taxonomy.primary AS tax,
             websites[1] AS website, phones[1] AS phone, brand.names.primary AS brand, brand.wikidata AS brand_wd,
             addresses[1].freeform AS addr, addresses[1].locality AS city, addresses[1].region AS region, addresses[1].country AS cc,
             confidence AS conf, ST_X(geometry) AS lon, ST_Y(geometry) AS lat
      FROM read_parquet('s3://overturemaps-us-west-2/release/{release}/theme=places/type=place/*', hive_partitioning=1)
      WHERE ({where}) AND names.primary IS NOT NULL AND coalesce(confidence, 0) >= {MIN_CONF}
        AND coalesce(operating_status, 'open') = 'open'
    """
    log('reading Overture', release)
    rows = con.execute(q).fetchall()
    cols = [d[0] for d in con.description]
    out = []
    for r in rows:
        d = dict(zip(cols, r))
        cat, kind = category(d['basic'] or d['tax'])
        out.append({'id': 'ov:' + d['id'], 'name': d['name'], 'cat': cat, 'kind': kind, 'lat': round(d['lat'], 6), 'lon': round(d['lon'], 6),
                    'addr': d['addr'], 'city': d['city'], 'region': d['region'], 'cc': (d['cc'] or '').lower() or None,
                    'phone': d['phone'], 'website': d['website'], 'brand': d['brand'], 'src': 'overture', 'conf': round(d['conf'] or 0, 3)})
    notice('Overture places kept:', len(out))
    return out


# ---------- OpenStreetMap
POI_KEYS = ('amenity', 'shop', 'tourism', 'leisure', 'place')
PLACE_KINDS = {'city': 'City', 'town': 'Town', 'village': 'Village', 'hamlet': 'Place', 'suburb': 'Neighbourhood', 'neighbourhood': 'Neighbourhood', 'quarter': 'Neighbourhood', 'locality': 'Place'}


def load_osm():
    pois = []
    for url in OSM_EXTRACTS:
        name = url.rsplit('/', 1)[-1]
        log('downloading', name)
        subprocess.run(['curl', '-sSfL', '-o', name, url], check=True)
        subprocess.run(['osmium', 'tags-filter', name, *[f'nwr/{k}' for k in POI_KEYS], '-o', 'pois.pbf', '--overwrite'], check=True)
        subprocess.run(['osmium', 'export', 'pois.pbf', '-f', 'geojsonseq', '-o', 'pois.geojsonseq', '--overwrite', '--add-unique-id=type_id',
                        '--geometry-types=point,polygon'], check=True)
        os.remove(name)
        n = 0
        with open('pois.geojsonseq') as fh:
            for line in fh:
                line = line.lstrip('\x1e').strip()
                if not line:
                    continue
                f = json.loads(line)
                t = f.get('properties') or {}
                if not t.get('name') or not any(k in t for k in POI_KEYS):
                    continue
                g = f.get('geometry') or {}
                if g.get('type') == 'Point':
                    lon, lat = g['coordinates']
                else:
                    ring = (g.get('coordinates') or [[[]]])[0]
                    if g.get('type') == 'MultiPolygon':
                        ring = ring[0]
                    if not ring:
                        continue
                    lon, lat = sum(c[0] for c in ring) / len(ring), sum(c[1] for c in ring) / len(ring)
                if not inside(lon, lat):
                    continue
                key = next(k for k in POI_KEYS if k in t)
                val = t[key]
                if key == 'place':
                    if val not in PLACE_KINDS:
                        continue
                    cat, kind = 'place:' + val, PLACE_KINDS[val]
                else:
                    cat, kind = category(val)
                if cat.startswith('other:') and key != 'place':
                    cat, kind = f'{key}:{val}', pretty(val)
                street = ' '.join(x for x in (t.get('addr:housenumber'), t.get('addr:street')) if x)
                pois.append({'id': 'osm:' + str(f.get('id') or ''), 'name': t['name'], 'cat': cat, 'kind': kind, 'lat': round(lat, 6), 'lon': round(lon, 6),
                             'addr': street or None, 'city': t.get('addr:city'), 'phone': t.get('phone') or t.get('contact:phone'),
                             'website': t.get('website') or t.get('contact:website'), 'hours': t.get('opening_hours'), 'facts': facts(t),
                             'wikidata': t.get('wikidata'), 'wikipedia': ('en:' + t['wikipedia:en']) if t.get('wikipedia:en') else t.get('wikipedia'),
                             'brand': t.get('brand'), 'src': 'osm', 'conf': 0.99 if key == 'place' else 0.8})
                n += 1
        notice(name, 'points of interest:', n)
    return pois


def merge(ov, osm):
    """OpenStreetMap details go onto the matching Overture place (same name, under 80 m apart); the rest are added."""
    cell = lambda lat, lon: (int(lat * 1000), int(lon * 1000))   # ~100 m squares
    grid = defaultdict(list)
    for p in ov:
        grid[cell(p['lat'], p['lon'])].append(p)
    matched = added = 0
    out = list(ov)
    for o in osm:
        ci, cj = cell(o['lat'], o['lon'])
        best = None
        for di in (-1, 0, 1):
            for dj in (-1, 0, 1):
                for p in grid.get((ci + di, cj + dj), ()):
                    dlat, dlon = (p['lat'] - o['lat']) * 111000, (p['lon'] - o['lon']) * 111000 * 0.85
                    if dlat * dlat + dlon * dlon < 6400 and same_name(p['name'], o['name']):
                        best = p
                        break
        if best:
            for k in ('hours', 'facts', 'wikidata', 'wikipedia'):
                if o.get(k) and not best.get(k):
                    best[k] = o[k]
            for k in ('phone', 'website', 'addr', 'city'):
                if o.get(k) and not best.get(k):
                    best[k] = o[k]
            if best['cat'].startswith('other:') and not o['cat'].startswith('other:'):
                best['cat'], best['kind'] = o['cat'], o['kind']
            matched += 1
        else:
            out.append(o)
            added += 1
    notice('OpenStreetMap: matched', matched, 'added', added)
    return out


def trim(v, n):
    return v[:n] if isinstance(v, str) else v


def upload(rows, run_id):
    rows.sort(key=lambda p: -(p.get('conf') or 0))
    if len(rows) > MAX_ROWS:
        notice('keeping the', MAX_ROWS, 'most confident of', len(rows))
        rows = rows[:MAX_ROWS]
    lens = {'name': 160, 'addr': 200, 'city': 80, 'region': 80, 'phone': 40, 'website': 200, 'hours': 300, 'facts': 160, 'wikidata': 20, 'wikipedia': 160, 'brand': 80, 'kind': 60, 'cat': 80}
    rows = [{k: trim(v, lens.get(k, 400)) for k, v in r.items() if v not in (None, '')} for r in rows]
    if DRY:
        from collections import Counter
        notice('dry run: would load', len(rows), '| with hours:', sum(1 for r in rows if r.get('hours')), '| with phone:', sum(1 for r in rows if r.get('phone')),
            '| with website:', sum(1 for r in rows if r.get('website')), '| from OSM only:', sum(1 for r in rows if r.get('src') == 'osm'))
        notice('top categories:', Counter(r.get('cat') for r in rows).most_common(25))
        notice('approx size MB:', round(sum(len(json.dumps(r)) for r in rows) / 1e6))
        return
    total, size = 0, 500   # small batches stay under the database's per-request time limit
    for i in range(0, len(rows), size):
        body = json.dumps({'token': TOKEN, 'run_id': run_id, 'rows': rows[i:i + size]}).encode()
        for attempt in range(5):
            try:
                req = urllib.request.Request(SB_URL + '/rest/v1/rpc/import_places', data=body, method='POST',
                                             headers={'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Content-Type': 'application/json'})
                with urllib.request.urlopen(req, timeout=120) as r:
                    total += int(r.read())
                break
            except Exception as e:
                log('batch', i, 'failed:', e, '- retrying')
                time.sleep(5 * (attempt + 1))
        else:
            sys.exit('loading failed')
        if (i // size) % 100 == 0:
            log('loaded', total, 'of', len(rows))
    req = urllib.request.Request(SB_URL + '/rest/v1/rpc/import_finish', data=json.dumps({'token': TOKEN, 'run_id': run_id, 'min_rows': max(1000, len(rows) // 2)}).encode(),
                                 method='POST', headers={'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=300) as r:
        notice('finished:', r.read().decode())


if __name__ == '__main__':
    release = overture_release()
    places = merge(load_overture(release), load_osm())
    upload(places, release + '/' + time.strftime('%Y%m%d'))
