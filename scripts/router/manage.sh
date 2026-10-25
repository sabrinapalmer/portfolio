#!/bin/bash
# BrinaMaps route server manager. The server fetches this file from GitHub every hour and runs it, so changes here
# reach the server without logging in. It keeps one Valhalla router per region and swaps in new routing data when
# GitHub publishes it, at most ONE region per run and at low priority, so live routes are never starved.
#   west      California + Mexico   port 8002   releases router-west-*  (older router-2026... builds count as west)
#   texas     Texas                 port 8003   releases router-texas-*
#   illinois  Illinois              port 8004   releases router-illinois-*
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
