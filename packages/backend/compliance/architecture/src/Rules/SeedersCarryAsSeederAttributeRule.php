<?php

/**
 * @file packages/architecture/src/Rules/SeedersCarryAsSeederAttributeRule.php
 *
 * @description
 * Source rule: every concrete class in a
 * `**\/database/seeders/**\/*.php` path (except the root
 * `DatabaseSeeder`) must carry `#[AsSeeder]` from
 * `Stackra\ServiceProvider\Attributes\AsSeeder`.
 *
 * ## Why (ADR 0011)
 *
 * `#[AsSeeder]` is the discovery marker consumed by the shared
 * `DatabaseSeeder` base. Without it, a seeder is invisible to
 * the auto-dispatch pass and the domain module has to be added
 * to the root seeder's `call(...)` list manually.
 *
 * ## What it catches
 *
 * A file whose path contains `/database/seeders/` AND declares a
 * concrete class AND doesn't carry `#[AsSeeder]`.
 *
 * ## Exceptions
 *
 *   - The root `DatabaseSeeder.php` per app (the dispatcher).
 *   - Abstract classes (base seeder classes).
 *
 * ## Paired migrator
 *
 * `dev-tools/migrations/src/SeedersAsAttributeMigrator.php`
 * satisfies this rule automatically.
 */

declare(strict_types=1);

namespace Stackra\Architecture\Rules;

use Stackra\Architecture\Support\SourceFile;
use Stackra\Architecture\Violations\Severity;
use Stackra\Architecture\Violations\Violation;

/**
 * Enforce `#[AsSeeder]` on every leaf seeder.
 *
 * @final
 */
final class SeedersCarryAsSeederAttributeRule extends AbstractRule
{
    public function id(): string
    {
        return 'architecture.seeders_carry_as_seeder_attribute';
    }

    public function description(): string
    {
        return 'Every leaf seeder must carry `#[AsSeeder]` from `stackra/service-provider` for automatic dispatch discovery.';
    }

    protected function defaultSeverity(): Severity
    {
        return Severity::Error;
    }

    /**
     * @return list<Violation>
     */
    public function check(SourceFile $file): array
    {
        if (! str_contains($file->path, '/database/seeders/')) {
            return [];
        }

        if (\basename($file->path) === 'DatabaseSeeder.php') {
            return [];
        }

        if ($file->classKeyword !== 'class' || $file->className === null) {
            return [];
        }

        if ($file->hasClassModifier('abstract')) {
            return [];
        }

        if ($file->hasClassAttribute('AsSeeder')) {
            return [];
        }

        return [
            $this->violation(
                file: $file,
                offender: $file->classFqcn ?? $file->className,
                message: \sprintf(
                    'Seeder "%s" is missing `#[AsSeeder]`.',
                    $file->classFqcn ?? $file->className,
                ),
                line: null,
                hint: 'Run `php dev-tools/migrations/bin/stackra-migrate seeders --apply` to fix every violation of this rule automatically.',
            ),
        ];
    }
}
