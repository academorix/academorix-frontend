"""Assemble the final apps/laravel-template/composer.json for the API app.

Reads the require + repositories skeleton emitted by build-composer-api.py
and merges it with the base Laravel + Octane + Horizon + Sanctum shape.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path("/Users/akouta/Projects/academorix-frontend")
SKELETON = ROOT / ".kiro/reports/composer-api-require.json"
TARGET = ROOT / "apps/laravel-template/composer.json"


def main() -> int:
    if not SKELETON.exists():
        print(f"missing {SKELETON}; run build-composer-api.py first", file=sys.stderr)
        return 1

    skeleton = json.loads(SKELETON.read_text())

    # Base Laravel deps + all backend packages.
    require: dict[str, str] = {
        "php": "^8.3",
        "laravel/framework": "^13.8",
        "laravel/tinker": "^3.0",
        "laravel/octane": "^2.10",
        "laravel/horizon": "^5.34",
        "laravel/sanctum": "^5.0",
    }
    require.update(skeleton["require"])

    composer = {
        "$schema": "https://getcomposer.org/schema.json",
        "name": "stackra/api",
        "type": "project",
        "description": "Stackra headless tenant API — Laravel Octane runtime for the ~90 backend packages.",
        "keywords": ["stackra", "api", "laravel", "octane"],
        "license": "proprietary",
        "require": require,
        "require-dev": {
            "fakerphp/faker": "^1.23",
            "laravel/boost": "^2.2",
            "laravel/pail": "^1.2",
            "laravel/pint": "^1.27",
            "larastan/larastan": "^3.0",
            "mockery/mockery": "^1.6",
            "nunomaduro/collision": "^8.6",
            "pestphp/pest": "^4.7",
            "pestphp/pest-plugin-laravel": "^4.1",
            "phpstan/phpstan": "^2.0",
        },
        "autoload": {
            "psr-4": {
                "Academorix\\Api\\": "src/",
                "Database\\Factories\\": "database/factories/",
                "Database\\Seeders\\": "database/seeders/",
            },
        },
        "autoload-dev": {
            "psr-4": {
                "Tests\\": "tests/",
            },
        },
        "scripts": {
            "post-autoload-dump": [
                "Illuminate\\Foundation\\ComposerScripts::postAutoloadDump",
                "@php artisan package:discover --ansi",
            ],
            "post-root-package-install": [
                "@php -r \"file_exists('.env') || copy('.env.example', '.env');\"",
            ],
            "post-create-project-cmd": [
                "@php artisan key:generate --ansi",
            ],
            "dev": [
                "Composer\\Config::disableProcessTimeout",
                "doppler run -- npx concurrently -c '#93c5fd,#c4b5fd,#fb7185' 'php artisan serve' 'php artisan queue:listen --tries=1 --timeout=0' 'php artisan pail --timeout=0' --names=server,queue,logs --kill-others",
            ],
            "test": [
                "@php artisan config:clear --ansi",
                "doppler run -- php artisan test",
            ],
            "test:coverage": [
                "@php artisan config:clear --ansi",
                "doppler run -- php artisan test --coverage --min=80",
            ],
            "analyse": "./vendor/bin/phpstan analyse --memory-limit=2G",
            "lint": "./vendor/bin/pint --test",
            "format": "./vendor/bin/pint",
        },
        "extra": {
            "laravel": {
                "dont-discover": [],
            },
        },
        "config": {
            "optimize-autoloader": True,
            "preferred-install": "dist",
            "sort-packages": True,
            "allow-plugins": {
                "pestphp/pest-plugin": True,
                "php-http/discovery": True,
                "olvlvl/composer-attribute-collector": True,
            },
        },
        "minimum-stability": "dev",
        "prefer-stable": True,
        "repositories": skeleton["repositories"],
    }

    TARGET.write_text(json.dumps(composer, indent=2) + "\n")
    print(f"Wrote {TARGET}")
    print(f"  {len(require)} require entries")
    print(f"  {len(skeleton['repositories'])} path repositories")
    return 0


if __name__ == "__main__":
    sys.exit(main())
