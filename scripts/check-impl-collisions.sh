#!/usr/bin/env bash
# List every module that has a real Laravel implementation under
# modules/<tier>/<name>/ and check whether backend-packages/<tier>/<name>/
# already has a generated skeleton (COLLISION) or is FREE.
set -uo pipefail
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

echo "Real-impl → backend-packages/ import plan"
echo "-----------------------------------------"
for tp in "${MODS[@]}"; do
  src="modules/$tp"
  dst="backend-packages/$tp"
  src_size=$(find "$src" -name "*.php" 2>/dev/null | wc -l | tr -d ' ')
  if [ -d "$dst" ]; then
    dst_size=$(find "$dst" -name "*.php" 2>/dev/null | wc -l | tr -d ' ')
    printf "  %-42s  src=%-4s  dst=%-4s  COLLISION (overwrite skeleton)\n" "$tp" "$src_size" "$dst_size"
  else
    printf "  %-42s  src=%-4s  dst=--    NEW\n" "$tp" "$src_size"
  fi
done
