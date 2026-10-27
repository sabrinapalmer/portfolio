#!/usr/bin/env python3
"""BrinaMaps place search, on the route server next to the routers (Python standard library only).

Serves the monthly place file (built by scripts/places/build_places.py, published as a GitHub release, swapped in by
manage.sh) and keeps the "Add hours" reports. Listens on 127.0.0.1:8010; Caddy puts it at https://<host>/places/
behind the same X-Router-Key as the routers, and the website reaches it through /api/places and /api/report.

  GET  /search?q=&lat=&lon=&r=150&lim=15     places whose name has every word, exact name first, then nearest
  GET  /near?cats=amenity:cafe,shop&lat=&lon=&r=5&lim=20   nearest places of some kinds
  GET  /box?w=&s=&e=&n=&lim=6000              every place in a box (map squares kept on the phone for offline search)
  POST /corridor {pts:[[lat,lon]...], cats:[], r:800, lim:30}   places of some kinds along a route, in driving order
  GET  /health                                 is the place file loaded, how big, when built
  POST /report {place_id,name,lat,lon,hours,note,sender}  -> {id}    (at most 10 an hour per sender)
  POST /report-note {id, sender, osm}          the OpenStreetMap note made for a report
"""
import json, math, os, re, sqlite3, threading, time, unicodedata
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

DATA = os.environ.get('PLACES_DB', '/srv/places/current.db')       # a link to the newest place file
REPORTS = os.environ.get('PLACES_REPORTS', '/srv/places/reports.db')
PORT = int(os.environ.get('PLACES_PORT', '8010'))
COLS = ['id', 'name', 'kind', 'cat', 'lat', 'lon', 'addr', 'city', 'region', 'cc', 'phone', 'website', 'hours', 'facts', 'wikidata', 'wikipedia']
SEL = ', '.join('p.' + c for c in COLS) + ', p.norm'
local = threading.local()
report_lock = threading.Lock()


def fold(t):   # the same folding the place file was built with: no accents, lower case, words split on anything else
    t = unicodedata.normalize('NFD', (t or '').replace("'", '')).encode('ascii', 'ignore').decode().lower()   # Portillo's -> portillos
    return re.sub(r'[^a-z0-9]+', ' ', t).strip()


class Pool:
    """Open read-only connections, reused across requests (each request runs on a new thread, and a fresh
    connection would start with an empty cache). Connections to an old place file are dropped after a swap."""
    def __init__(self):
        self.lock, self.free = threading.Lock(), []

    def get(self):
        try:
            key = os.stat(DATA).st_ino
        except OSError:
            return None
        with self.lock:
            while self.free:
                k, c = self.free.pop()
                if k == key:
                    return k, c
                c.close()
        c = sqlite3.connect('file:' + os.path.realpath(DATA) + '?mode=ro&immutable=1', uri=True, check_same_thread=False)
        c.execute('PRAGMA mmap_size = 8000000000')
        c.execute('PRAGMA cache_size = -64000')
        return key, c

    def put(self, kc):
        with self.lock:
            if len(self.free) < 16:
                self.free.append(kc)
                return
        kc[1].close()


pool = Pool()


def db():
    """This request's connection (taken from the pool by the handler)"""
    if getattr(local, 'conn', None) is None:
        kc = pool.get()
        if not kc:
            return None
        local.kc, local.conn = kc, kc[1]
    return local.conn


def done():
    if getattr(local, 'conn', None) is not None:
        pool.put(local.kc)
        local.conn = local.kc = None


def dist(a_lat, a_lon, b_lat, b_lon):   # metres
    r = math.pi / 180
    x = (b_lon - a_lon) * r * math.cos((a_lat + b_lat) / 2 * r)
    return 6371000 * math.hypot(x, (b_lat - a_lat) * r)


def box(lat, lon, km):
    dlat = km / 111.0
    dlon = km / 111.0 / max(math.cos(math.radians(lat)), 0.2)
    return lat - dlat, lat + dlat, lon - dlon, lon + dlon


# Some source records lost the backslash of escaped accents ("Vxeda Rxe1pida" for "Vía Rápida"). Only strings that
# have a code with a digit (xe1 á, xe9 é, xf3 ó, xf1 ñ, ...) are repaired, so English words like "fixed" stay as they are.
SURE = re.compile(r'(?<=[A-Za-z])x(?:e[19]|f[13]|c[19]|d[13])')
ANY = re.compile(r'(?<=[A-Za-z])x(e1|e9|ed|f3|fa|f1|fc|c1|c9|cd|d3|da|d1|dc)')   # the accented letters of Spanish


def fix_text(v):
    if isinstance(v, str) and SURE.search(v):
        return ANY.sub(lambda m: chr(int(m.group(1), 16)), v)
    return v


def row(r, d=None):
    o = {k: fix_text(v) for k, v in zip(COLS, r) if v is not None}
    if d is not None:
        o['d'] = round(d)
    return o


def cells(lat, lon, km):
    """The half-degree squares (see build_places.cell) that a box of km around a point touches"""
    s, n, w, e = box(lat, lon, km)
    la = range(max(0, int((s + 90) * 2)), min(359, int((n + 90) * 2)) + 1)
    lo = range(max(0, int((w + 180) * 2)), min(719, int((e + 180) * 2)) + 1)
    return ['c%03d%03d' % (i, j) for i in la for j in lo]


def search(q, lat, lon, km, lim):
    """Every word of the query in the name, accents and case ignored; the exact name first, then names that start
    with it, then the rest, nearest first in each. Looks within 40 km first and only further when that finds too few."""
    nq = fold(q)
    words = [w for w in nq.split(' ') if w]
    long_words = [w for w in words if len(w) >= 3]   # the name index works on 3-letter pieces
    if not long_words:
        if len(nq) < 3:
            return []
        long_words = [nq]
    hits = {}
    for r_km in sorted({min(km, 40), km}):
        sq = cells(lat, lon, r_km)
        if len(sq) > 400:
            continue
        expr = ' AND '.join('norm : "%s"' % w for w in long_words) + ' AND cell : (' + ' OR '.join('"%s"' % c for c in sq) + ')'
        s, n, w, e = box(lat, lon, r_km)
        for r in db().execute('SELECT ' + SEL + ' FROM places p WHERE p.rid IN (SELECT rowid FROM names WHERE names MATCH ? LIMIT 50000) '
                              'AND p.lat BETWEEN ? AND ? AND p.lon BETWEEN ? AND ?', (expr, s, n, w, e)):
            norm = r[-1]
            if r[0] not in hits and all(x in norm for x in words):
                hits[r[0]] = ((norm != nq), (not norm.startswith(nq)), dist(lat, lon, r[4], r[5]), r)
        if len(hits) >= lim:
            break
    out = sorted(hits.values(), key=lambda h: h[:3])[:lim]
    return [row(h[3][:-1], h[2]) for h in out]


def cat_sql(cats):
    full = [c for c in cats if ':' in c]
    tops = [c for c in cats if ':' not in c]
    parts, args = [], []
    if full:
        parts.append('p.cat IN (%s)' % ','.join('?' * len(full)))
        args += full
    for t in tops:   # a category with no value ("shop") means every kind of it
        parts.append('p.cat LIKE ?')
        args.append(t + ':%')
    return '(' + ' OR '.join(parts) + ')', args


def near(cats, lat, lon, km, lim):
    where, args = cat_sql(cats)
    found = []
    for r_km in sorted({min(km, x) for x in (2, 6, 15, km)}):   # widen until enough are found: small boxes are quick
        s, n, w, e = box(lat, lon, r_km)
        found = db().execute('SELECT ' + SEL + ' FROM pos JOIN places p ON p.rid = pos.rid WHERE pos.minlat >= ? AND pos.maxlat <= ? '
                             'AND pos.minlon >= ? AND pos.maxlon <= ? AND ' + where, [s, n, w, e] + args).fetchall()
        if len(found) >= lim:
            break
    out = sorted(((dist(lat, lon, r[4], r[5]), r) for r in found), key=lambda x: x[0])[:lim]
    return [row(r[:-1], d) for d, r in out]


def in_box(w, s, e, n, lim):
    rows = db().execute('SELECT ' + SEL + ' FROM pos JOIN places p ON p.rid = pos.rid WHERE pos.minlat >= ? AND pos.maxlat <= ? '
                        'AND pos.minlon >= ? AND pos.maxlon <= ? ORDER BY p.conf DESC LIMIT ?', (s, n, w, e, lim)).fetchall()
    return [row(r[:-1]) for r in rows]


def seg_dist(lat, lon, a, b):
    """Metres from a point to the segment a-b, and how far along a-b the closest point is (0..1)"""
    kx = 111320 * math.cos(math.radians(lat))
    ax, ay, bx, by, px, py = a[1] * kx, a[0] * 110540, b[1] * kx, b[0] * 110540, lon * kx, lat * 110540
    dx, dy = bx - ax, by - ay
    t = 0 if dx == dy == 0 else max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy)), t


def corridor(pts, cats, r_m, lim):
    """Places of some kinds within r_m of a route, ordered by how far along the route they are"""
    where, args = cat_sql(cats)
    along = [0.0]
    for i in range(1, len(pts)):
        along.append(along[-1] + dist(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]))
    best = {}
    step = max(1, len(pts) // 300)   # the route in pieces; each piece asks for its own small box
    for i in range(0, len(pts) - 1, step):
        seg = pts[i:i + step + 1]
        la = [p[0] for p in seg]
        lo = [p[1] for p in seg]
        pad_lat = r_m / 111000.0
        pad_lon = r_m / 111000.0 / max(math.cos(math.radians(la[0])), 0.2)
        for r in db().execute('SELECT ' + SEL + ' FROM pos JOIN places p ON p.rid = pos.rid WHERE pos.minlat >= ? AND pos.maxlat <= ? '
                              'AND pos.minlon >= ? AND pos.maxlon <= ? AND ' + where,
                              [min(la) - pad_lat, max(la) + pad_lat, min(lo) - pad_lon, max(lo) + pad_lon] + args):
            for k in range(len(seg) - 1):
                d, t = seg_dist(r[4], r[5], seg[k], seg[k + 1])
                if d <= r_m and (r[0] not in best or d < best[r[0]][1]):
                    j = i + k
                    best[r[0]] = (along[j] + t * (along[j + 1] - along[j]), d, r)
    out = sorted(best.values(), key=lambda x: x[0])
    if len(out) > lim:   # spread over the route rather than the first few miles
        k = len(out) / lim
        out = [out[int(i * k)] for i in range(lim)]
    res = []
    for a, d, r in out:
        o = row(r[:-1], d)
        o['along'] = round(a)
        res.append(o)
    return res


def reports():
    c = sqlite3.connect(REPORTS, timeout=10)
    c.execute('CREATE TABLE IF NOT EXISTS reports (id INTEGER PRIMARY KEY, at REAL, place_id TEXT, name TEXT, lat REAL, lon REAL, hours TEXT, note TEXT, sender TEXT, osm TEXT)')
    return c


def add_report(b):
    clean = lambda v, n: re.sub(r'\s+', ' ', re.sub(r'[\x00-\x1f\x7f]', ' ', str(v or ''))).strip()[:n]
    name, hours, sender = clean(b.get('name'), 160), clean(b.get('hours'), 300), clean(b.get('sender'), 64)
    lat, lon = float(b.get('lat')), float(b.get('lon'))
    if not name or len(hours) < 3 or not sender or not (-90 <= lat <= 90 and -180 <= lon <= 180):
        return 400, {'error': 'bad request'}
    with report_lock:
        c = reports()
        n = c.execute('SELECT count(*) FROM reports WHERE sender = ? AND at > ?', (sender, time.time() - 3600)).fetchone()[0]
        if n >= 10:
            return 429, {'error': 'too many reports'}
        cur = c.execute('INSERT INTO reports (at, place_id, name, lat, lon, hours, note, sender, osm) VALUES (?,?,?,?,?,?,?,?,?)',
                        (time.time(), clean(b.get('place_id'), 80), name, lat, lon, hours, clean(b.get('note'), 400), sender, 'pending'))
        c.commit()
        rid = cur.lastrowid
        c.close()
    return 200, {'id': rid}


def set_note(b):
    with report_lock:
        c = reports()
        c.execute('UPDATE reports SET osm = ? WHERE id = ? AND sender = ?', (str(b.get('osm') or 'failed')[:40], int(b.get('id') or 0), str(b.get('sender') or '')[:64]))
        c.commit()
        c.close()
    return 200, {'ok': True}


def problems_db():
    c = sqlite3.connect(REPORTS, timeout=10)
    c.execute('CREATE TABLE IF NOT EXISTS problems (at REAL, app TEXT, v TEXT, k TEXT, m TEXT)')
    return c


def add_problems(b):
    """Problem reports from the app (script errors, failed searches or routes): kept 30 days so bugs on phones can be
    found and fixed. No location, search text or anything about the person is in them."""
    clean = lambda v, n: re.sub(r'\s+', ' ', re.sub(r'[\x00-\x1f\x7f]', ' ', str(v or ''))).strip()[:n]
    app, v = clean(b.get('app'), 8), clean(b.get('v'), 20)
    rows = [(time.time(), app, v, clean(i.get('k'), 20), clean(i.get('m'), 300)) for i in (b.get('items') or [])[:20] if isinstance(i, dict)]
    if not rows:
        return 400, {'error': 'no items'}
    with report_lock:
        c = problems_db()
        c.executemany('INSERT INTO problems VALUES (?,?,?,?,?)', rows)
        c.execute('DELETE FROM problems WHERE at < ?', (time.time() - 30 * 86400,))
        c.commit()
        c.close()
    return 200, {'ok': True}


def list_problems(days):
    c = problems_db()
    out = [{'k': k, 'm': m, 'app': a, 'v': v, 'n': n, 'last': round(last)} for k, m, a, v, n, last in c.execute(
        'SELECT k, m, app, v, count(*), max(at) FROM problems WHERE at > ? GROUP BY k, m, app, v ORDER BY count(*) DESC LIMIT 200', (time.time() - days * 86400,))]
    c.close()
    return 200, {'days': days, 'problems': out}


def health():
    c = db()
    if not c:
        return 503, {'ok': False, 'error': 'no place file'}
    t = time.time()
    meta = dict(c.execute('SELECT k, v FROM meta').fetchall())
    n = c.execute('SELECT max(rid) FROM places').fetchone()[0]
    c.execute('SELECT rowid FROM names WHERE names MATCH ? LIMIT 1', ('norm : "starbucks"',)).fetchone()
    return 200, {'ok': True, 'places': n, 'built': meta.get('built'), 'ms': round((time.time() - t) * 1000)}


class H(BaseHTTPRequestHandler):
    def send(self, code, obj):
        body = json.dumps(obj, separators=(',', ':')).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *a):   # quiet: no request log on the server
        pass

    def do_GET(self):
        try:
            self.get()
        finally:
            done()

    def do_POST(self):
        try:
            self.post()
        finally:
            done()

    def get(self):
        u = urlparse(self.path)
        q = {k: v[0] for k, v in parse_qs(u.query).items()}
        f = lambda k, lo, hi, dflt=None: min(hi, max(lo, float(q[k]))) if k in q else dflt
        try:
            if u.path == '/health':
                return self.send(*health())
            if u.path == '/problems':
                return self.send(*list_problems(f('days', 0.1, 30, 7)))
            if not db():
                return self.send(503, {'error': 'no place file'})
            if u.path == '/search':
                return self.send(200, search(q.get('q', '')[:80], f('lat', -90, 90), f('lon', -180, 180), f('r', 1, 300, 150), int(f('lim', 1, 30, 15))))
            if u.path == '/near':
                cats = [c for c in q.get('cats', '').split(',') if re.fullmatch(r'[a-z_]+(:[a-z0-9_]+)?', c)][:8]
                if not cats:
                    return self.send(400, {'error': 'no categories'})
                return self.send(200, near(cats, f('lat', -90, 90), f('lon', -180, 180), f('r', 0.5, 60, 5), int(f('lim', 1, 40, 20))))
            if u.path == '/box':
                return self.send(200, in_box(f('w', -180, 180), f('s', -90, 90), f('e', -180, 180), f('n', -90, 90), int(f('lim', 1, 8000, 6000))))
            self.send(404, {'error': 'unknown endpoint'})
        except (KeyError, TypeError, ValueError):
            self.send(400, {'error': 'bad request'})
        except sqlite3.Error as e:
            self.send(500, {'error': 'place file: ' + str(e)[:120]})

    def post(self):
        u = urlparse(self.path)
        try:
            n = int(self.headers.get('Content-Length') or 0)
            if n > 200000:
                return self.send(413, {'error': 'too large'})
            b = json.loads(self.rfile.read(n) or b'{}')
            if u.path == '/corridor':
                pts = [[float(p[0]), float(p[1])] for p in b.get('pts', [])][:3000]
                cats = [c for c in b.get('cats', []) if isinstance(c, str) and re.fullmatch(r'[a-z_]+(:[a-z0-9_]+)?', c)][:8]
                if len(pts) < 2 or not cats or not db():
                    return self.send(400, {'error': 'bad request'})
                return self.send(200, corridor(pts, cats, min(5000, max(100, float(b.get('r', 800)))), min(60, max(1, int(b.get('lim', 30))))))
            if u.path == '/report':
                return self.send(*add_report(b))
            if u.path == '/report-note':
                return self.send(*set_note(b))
            if u.path == '/problem':
                return self.send(*add_problems(b))
            self.send(404, {'error': 'unknown endpoint'})
        except (KeyError, TypeError, ValueError, json.JSONDecodeError):
            self.send(400, {'error': 'bad request'})
        except sqlite3.Error as e:
            self.send(500, {'error': 'place file: ' + str(e)[:120]})


if __name__ == '__main__':
    os.makedirs(os.path.dirname(REPORTS), exist_ok=True)
    ThreadingHTTPServer.daemon_threads = True
    ThreadingHTTPServer(('127.0.0.1', PORT), H).serve_forever()
