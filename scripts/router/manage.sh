#!/bin/bash
# BrinaMaps route server manager. The server fetches this file from GitHub every hour and runs it, so changes here
# reach the server without logging in. It keeps one Valhalla router per region and swaps in new routing data when
# GitHub publishes it, at most ONE region per run and at low priority, so live routes are never starved.
#   west      California + Mexico   port 8002   releases router-west-*  (older router-2026... builds count as west)
#   texas     Texas                 port 8003   releases router-texas-*
#   illinois  Illinois              port 8004   releases router-illinois-*
# It also runs the place server (search, nearby, along-the-route, hours reports) on port 8010, served at /places/,
# and swaps in a new place file (releases places-*) when one is published.
set -euo pipefail
source /etc/brinamaps-router.env          # ROUTER_KEY, REPO, HOST
exec >>/var/log/router-update.log 2>&1
echo "== $(date -u) router manager"

REGIONS="west:8002 texas:8003 illinois:8004"

# HTTPS front: key required; /<region>/... goes to that region's router (anything else to west)
caddy_conf() {
  echo "$HOST {"
  echo "  @allowed header X-Router-Key $ROUTER_KEY"
  echo "  handle @allowed {"
  echo "    handle_path /places/* {"; echo "      reverse_proxy 127.0.0.1:8010"; echo "    }"
  for r in $REGIONS; do echo "    handle_path /${r%%:*}/* {"; echo "      reverse_proxy 127.0.0.1:${r##*:}"; echo "    }"; done
  echo "    reverse_proxy 127.0.0.1:8002"
  echo "  }"
  echo "  respond \"not allowed\" 403"
  echo "}"
}
if ! cmp -s <(caddy_conf) /etc/caddy/Caddyfile; then caddy_conf > /etc/caddy/Caddyfile; systemctl reload caddy || systemctl restart caddy; echo "caddy config updated"; fi

releases=$(curl -sf "https://api.github.com/repos/$REPO/releases?per_page=50") || { echo "github unreachable"; exit 0; }

# Older single-region installs kept data in /srv/valhalla: move it to the west slot once
if [ -d /srv/valhalla ] && [ ! -d /srv/router/west ]; then mkdir -p /srv/router && mv /srv/valhalla /srv/router/west && cp /srv/router-tag /srv/router/west.tag 2>/dev/null || true; fi

start() {   # region port
  docker rm -f "valhalla-$1" >/dev/null 2>&1 || true
  docker rm -f valhalla >/dev/null 2>&1 || true   # the old single-region container, if any
  docker run -d --restart unless-stopped --name "valhalla-$1" --cpu-shares 512 -p "127.0.0.1:$2:8002" -v "/srv/router/$1:/custom_files" \
    -e use_tiles_ignore_pbf=True -e serve_tiles=True -e force_rebuild=False -e build_admins=False -e build_time_zones=False -e build_elevation=False \
    -e server_threads=2 ghcr.io/valhalla/valhalla-scripted:latest >/dev/null
  echo "started $1 on port $2"
}

# Place server: the program comes from GitHub master; it restarts when it changes
mkdir -p /srv/places
if curl -sfL "https://raw.githubusercontent.com/$REPO/master/scripts/router/places_server.py" -o /srv/places/server.py.new && python3 -m py_compile /srv/places/server.py.new; then
  if ! cmp -s /srv/places/server.py.new /usr/local/bin/places_server.py; then
    mv /srv/places/server.py.new /usr/local/bin/places_server.py; echo "place server updated"
    systemctl restart brinamaps-places 2>/dev/null || true
  else rm -f /srv/places/server.py.new; fi
fi
unit='[Unit]
Description=BrinaMaps place server
After=network.target
[Service]
ExecStart=/usr/bin/python3 /usr/local/bin/places_server.py
Environment=PLACES_DB=/srv/places/current.db PLACES_REPORTS=/srv/places/reports.db PLACES_PORT=8010
Restart=always
RestartSec=3
Nice=5
[Install]
WantedBy=multi-user.target'
if ! cmp -s <(echo "$unit") /etc/systemd/system/brinamaps-places.service; then
  echo "$unit" > /etc/systemd/system/brinamaps-places.service; systemctl daemon-reload; systemctl enable --now brinamaps-places; systemctl restart brinamaps-places; echo "place service installed"
fi
systemctl is-active -q brinamaps-places || systemctl start brinamaps-places || true

# Place file: newest places-* release, unpacked next to the old one, then the link is switched (the server notices)
rel=$(echo "$releases" | jq -c '[.[] | select(.tag_name | startswith("places-"))] | sort_by(.published_at) | last')
tag=$(echo "$rel" | jq -r '.tag_name // empty')
if [ -n "$tag" ] && [ "$tag" != "$(cat /srv/places/tag 2>/dev/null || true)" ]; then
  echo "places: new file $tag"
  rm -rf /srv/places/dl && mkdir -p /srv/places/dl
  if (cd /srv/places/dl && echo "$rel" | jq -r '.assets[].browser_download_url' | sort | while read -r u; do nice -n 15 ionice -c3 curl -sSfL --limit-rate 40M "$u" -o "$(basename "$u")"; done \
      && cat places.part.* | nice -n 15 ionice -c3 zstd -dc --long=27 > "/srv/places/$tag.db") \
      && python3 -c "import sqlite3,sys; c=sqlite3.connect('file:'+sys.argv[1]+'?mode=ro',uri=True); assert c.execute('select count(*) from names where names match \'norm : starbucks\'').fetchone()[0]>0" "/srv/places/$tag.db"; then
    old=$(readlink /srv/places/current.db 2>/dev/null || true)
    ln -sfn "/srv/places/$tag.db" /srv/places/current.db.new && mv -T /srv/places/current.db.new /srv/places/current.db
    echo "$tag" > /srv/places/tag
    [ -n "$old" ] && [ "$old" != "/srv/places/$tag.db" ] && (sleep 120; rm -f "$old") &
    echo "places: now serving $tag"
  else
    echo "places: $tag failed to download or check"; rm -f "/srv/places/$tag.db"
  fi
  rm -rf /srv/places/dl
fi

for r in $REGIONS; do
  region=${r%%:*}; port=${r##*:}
  if [ "$region" = west ]; then filter='startswith("router-west-") or test("^router-[0-9]")'; else filter="startswith(\"router-$region-\")"; fi
  rel=$(echo "$releases" | jq -c "[.[] | select(.tag_name | $filter)] | sort_by(.published_at) | last")
  tag=$(echo "$rel" | jq -r '.tag_name // empty')
  [ -z "$tag" ] && { echo "$region: no data published yet"; continue; }
  # A region that has data but whose router is not running gets started (after a reboot docker does this itself)
  if [ "$tag" = "$(cat /srv/router/$region.tag 2>/dev/null || true)" ]; then
    docker ps --format '{{.Names}}' | grep -qx "valhalla-$region" || start "$region" "$port"
    continue
  fi
  echo "$region: new data $tag"
  rm -rf "/srv/router/$region.new" && mkdir -p "/srv/router/$region.new" && cd "/srv/router/$region.new"
  echo "$rel" | jq -r '.assets[].browser_download_url' | sort | while read -r u; do nice -n 15 ionice -c3 curl -sSfL --limit-rate 40M "$u" -o "$(basename "$u")"; done
  cat router.part.* | nice -n 15 ionice -c3 zstd -dc | nice -n 15 ionice -c3 tar -xf - && rm -f router.part.*
  cd /srv/router
  docker rm -f "valhalla-$region" >/dev/null 2>&1 || true
  rm -rf "/srv/router/$region" && mv "/srv/router/$region.new" "/srv/router/$region"
  start "$region" "$port"
  echo "$tag" > "/srv/router/$region.tag"
  echo "$region: now serving $tag"
  break   # one region per run: the next one waits for the next hour
done
