import json
import sys

target = sys.argv[1] if len(sys.argv) > 1 else "apps/laravel-template/composer.json"
c = json.loads(open(target).read())
print("composer.json summary:")
print("  name:              " + str(c.get("name", "<none>")))
print("  require entries:   " + str(len(c.get("require", {}))))
print("  require-dev:       " + str(len(c.get("require-dev", {}))))
print("  path repositories: " + str(len(c.get("repositories", []))))
