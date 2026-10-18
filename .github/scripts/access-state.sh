#!/usr/bin/env bash
# Prints whether Cloudflare Access guards a URL, asked without credentials:
#   guarded  Access answered: a redirect to the team's cloudflareaccess.com login
#   blocked  401 or 403, which may be Access or another Cloudflare block; not proof
#   open     anything else answered, for example the site itself
#   no-dns   the host does not resolve, or nothing answered
# Used by deploy-site.yml before and after deploying the private preview (#62).
set -euo pipefail
url="$1"
out=$(curl -s -o /dev/null --max-time 15 -w '%{http_code} %{redirect_url}' "$url" || true)
code="${out%% *}"
location="${out#* }"
case "$code" in
  000 | "") echo "no-dns" ;;
  301 | 302 | 303 | 307)
    if [[ "$location" == https://*.cloudflareaccess.com/* ]]; then echo "guarded"; else echo "open"; fi
    ;;
  401 | 403) echo "blocked" ;;
  *) echo "open" ;;
esac
