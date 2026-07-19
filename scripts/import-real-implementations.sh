#!/usr/bin/env bash
# Import the 26 real Laravel implementations from `modules/<tier>/<name>/` into
# `backend-packages/<tier>/<name>/`. For modules that had a generated skeleton
# in the destination, the skeleton is replaced entirely by the real code.
#
# `modules/<tier>/blueprints/<name>/` (the JSON spec) is untouched — it
# remains as the source of truth for regeneration.
set -euo pipefail
cd "$(dirname "$0")/.."

MODS=(
  "access/invitations"
  "billing/entitlements"
  "billing/subscription"
  "compliance/compliance"
  "notifications/newsletter"
  "notifications/notifications"
  "notifications/notifications-in-app"
  "notifications/notifications-mail"
  "notifications/notifications-push"
  "notifications/notifications-sms"
  "platform/application"
  "platform/branding"
  "platform/domains"
  "platform/integrations"
  "platform/settings"
  "platform/storage"
  "platform/tenancy"
  "platform/webhook"
  "products/geofencing"
  "shared/activity"
  "shared/audit"
  "shared/geography"
  "shared/localization"
  "shared/search"
  "shared/transfer"
  "shared/versioning"
)

for tp in "${MODS[@]}"; do
  src="modules/$tp"
  dst="backend-packages/$tp"
  if [ ! -d "$src" ]; then
    echo "SKIP $tp — no source at $src"
    continue
  fi

  # Replace the destination entirely with the source.
  if [ -d "$dst" ]; then
    rm -rf "$dst"
  fi
  mkdir -p "$(dirname "$dst")"
  mv "$src" "$dst"
  echo "moved  modules/$tp  ->  backend-packages/$tp"
done

echo
echo "Done."
