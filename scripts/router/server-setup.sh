#!/bin/bash
# BrinaMaps route server: paste this whole file as "Cloud config / User data" when creating an Ubuntu 24.04 server.
# It installs Docker and Caddy, downloads the routing data that GitHub builds each month (California and Mexico),
# starts Valhalla, and serves it over HTTPS at <server-ip-with-dashes>.sslip.io. Only requests carrying the key below
# are answered (the BrinaMaps website's server sends it); everything else gets 403.
# A daily check picks up new routing data when GitHub publishes it. Log: /var/log/router-update.log
set -euo pipefail
ROUTER_KEY='__ROUTER_KEY__'
REPO='sabrinapalmer/portfolio'

export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get install -y -q docker.io zstd curl jq ufw debian-keyring debian-archive-keyring apt-transport-https gnupg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
apt-get update -q && apt-get install -y -q caddy
systemctl enable --now docker

ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable

# The data updater: newest "router-" release on GitHub, swapped in only when it differs from the one running
cat > /usr/local/bin/router-update <<EOF
#!/bin/bash
set -euo pipefail
exec >>/var/log/router-update.log 2>&1
echo "== \$(date -u) checking for new routing data"
rel=\$(curl -sf "https://api.github.com/repos/$REPO/releases?per_page=30" | jq -c '[.[] | select(.tag_name | startswith("router-"))] | sort_by(.tag_name) | last')
tag=\$(echo "\$rel" | jq -r .tag_name)
[ -z "\$tag" ] || [ "\$tag" = null ] && { echo "no routing data published yet"; exit 0; }
[ "\$tag" = "\$(cat /srv/router-tag 2>/dev/null || true)" ] && { echo "already on \$tag"; exit 0; }
rm -rf /srv/valhalla-new && mkdir -p /srv/valhalla-new && cd /srv/valhalla-new
echo "\$rel" | jq -r '.assets[].browser_download_url' | sort | while read -r u; do curl -sSfL "\$u" -o "\$(basename "\$u")"; done
cat router.part.* | zstd -dc | tar -xf - && rm -f router.part.*
docker rm -f valhalla >/dev/null 2>&1 || true
rm -rf /srv/valhalla && mv /srv/valhalla-new /srv/valhalla
docker run -d --restart unless-stopped --name valhalla -p 127.0.0.1:8002:8002 -v /srv/valhalla:/custom_files \\
  -e use_tiles_ignore_pbf=True -e serve_tiles=True -e force_rebuild=False -e build_admins=False -e build_time_zones=False -e build_elevation=False \\
  ghcr.io/valhalla/valhalla-scripted:latest
echo "\$tag" > /srv/router-tag
echo "now serving \$tag"
EOF
chmod +x /usr/local/bin/router-update
echo '23 * * * * root /usr/local/bin/router-update' > /etc/cron.d/router-update

# HTTPS on a free name made from the server's address (1.2.3.4 -> 1-2-3-4.sslip.io); requests need the key
IP=$(curl -s https://api.ipify.org)
HOST="${IP//./-}.sslip.io"
cat > /etc/caddy/Caddyfile <<EOF
$HOST {
  @allowed header X-Router-Key $ROUTER_KEY
  handle @allowed {
    reverse_proxy 127.0.0.1:8002
  }
  respond "not allowed" 403
}
EOF
systemctl restart caddy
echo "https://$HOST" > /srv/router-url
/usr/local/bin/router-update || true
