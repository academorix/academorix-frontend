#!/usr/bin/env bash
# Fan-out SDK generation for the 25 new modules.
# One-shot generator invocation per (tier, name). Exit non-zero on any failure.
set -euo pipefail

TIERS=(
  # tier:name
  "platform:ai"
  "platform:realtime"
  "platform:credentials"
  "platform:safeguarding"
  "platform:reception"
  "platform:admin-console"
  "platform:reporting"
  "platform:public-site"
  "identity:people"
  "shared:attributes"
  "sports:progress"
  "sports:medical"
  "sports:performance"
  "sports:development"
  "sports:competition"
  "sports:formations"
  "sports:drills"
  "sports:private-sessions"
  "sports:awards"
  "sports:registrations"
  "finance:expenses"
  "finance:digital-passes"
  "notifications:messaging"
  "notifications:announcements"
  # growth/crm-leads — removed per ADR 0024 (absorbed into sports/registrations).
  "shared:offline-sync"
)

FAILED=()
SUCCEEDED=()

for entry in "${TIERS[@]}"; do
  tier="${entry%%:*}"
  name="${entry##*:}"
  echo "→ generating sdk for ${tier}/${name}"
  if python3 modules/shared/blueprints/foundation/scripts/generate-sdk.py "$tier" "$name" --force 2>&1 | tail -3 ; then
    SUCCEEDED+=("${tier}/${name}")
  else
    FAILED+=("${tier}/${name}")
  fi
done

echo
echo "==== Summary ===="
echo "Succeeded: ${#SUCCEEDED[@]}"
echo "Failed:    ${#FAILED[@]}"
if (( ${#FAILED[@]} > 0 )); then
  echo
  echo "Failed modules:"
  printf '  %s\n' "${FAILED[@]}"
  exit 1
fi
