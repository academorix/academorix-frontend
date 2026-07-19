#!/usr/bin/env bash
# Fan-out module-side generator against every blueprint under modules/*.
# One-shot generator invocation per (tier, name). Continues on failure and
# reports at the end.
set -uo pipefail

cd "$(dirname "$0")/.."

# Discover all modules via `<tier>/blueprints/<name>` layout.
MODULES=()
for module_json in modules/*/blueprints/*/module.json; do
  # e.g. modules/platform/blueprints/forms/module.json → platform + forms
  path="$(dirname "$module_json")"
  name="$(basename "$path")"
  tier_dir="$(dirname "$(dirname "$path")")"
  tier="$(basename "$tier_dir")"
  MODULES+=("${tier}:${name}")
done

echo "Discovered ${#MODULES[@]} modules."
echo

FAILED=()
SUCCEEDED=()

for entry in "${MODULES[@]}"; do
  tier="${entry%%:*}"
  name="${entry##*:}"
  if python3 modules/shared/blueprints/foundation/scripts/generate-module.py "$tier" "$name" --force >/dev/null 2>&1 ; then
    SUCCEEDED+=("${tier}/${name}")
  else
    FAILED+=("${tier}/${name}")
  fi
done

echo "==== Summary ===="
echo "Succeeded: ${#SUCCEEDED[@]}"
echo "Failed:    ${#FAILED[@]}"
if (( ${#FAILED[@]} > 0 )); then
  echo
  echo "Failed modules:"
  printf '  %s\n' "${FAILED[@]}"
  exit 1
fi
