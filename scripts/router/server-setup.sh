#!/bin/bash
# BrinaMaps route server: paste this whole file as "User data" / "Initialization script" when creating an Ubuntu 24.04
# server (4 GB RAM or more; 8 GB is comfortable with three regions). It installs Docker and Caddy, then every hour
# fetches scripts/router/manage.sh from GitHub and runs it. That script runs one Valhalla router per region
# (California + Mexico, Texas, Illinois), swaps in new monthly routing data one region at a time, and serves HTTPS at
# <server-ip-with-dashes>.sslip.io. Only requests carrying the key below are answered. Log: /var/log/router-update.log
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

IP=$(curl -s https://api.ipify.org)
cat > /etc/brinamaps-router.env <<EOF
ROUTER_KEY='$ROUTER_KEY'
REPO='$REPO'
HOST='${IP//./-}.sslip.io'
EOF
chmod 600 /etc/brinamaps-router.env

# Hourly: fetch the manager from GitHub (only used if it downloads completely and parses), then run it
cat > /usr/local/bin/router-manage <<'EOF'
#!/bin/bash
source /etc/brinamaps-router.env
tmp=$(mktemp)
if curl -sfL "https://raw.githubusercontent.com/$REPO/master/scripts/router/manage.sh" -o "$tmp" && bash -n "$tmp"; then install -m 755 "$tmp" /usr/local/bin/router-manage.sh; fi
rm -f "$tmp"
flock -n /run/router-manage.lock /usr/local/bin/router-manage.sh
EOF
chmod +x /usr/local/bin/router-manage
echo '23 * * * * root /usr/local/bin/router-manage' > /etc/cron.d/router-manage
/usr/local/bin/router-manage || true
