#!/bin/sh
# Replace __API_TARGET__ placeholder with the actual API URL.
# Default: http://api:3000 (Docker Compose service name).
# On Railway set API_TARGET to the API service's internal URL, e.g.:
#   API_TARGET=http://odin-api:3000
API_TARGET="${API_TARGET:-http://api:3000}"
sed -i "s|__API_TARGET__|${API_TARGET}|g" /etc/nginx/conf.d/default.conf

echo "Proxying API requests to ${API_TARGET}"
exec nginx -g "daemon off;"