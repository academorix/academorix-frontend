<?php

/**
 * @file packages/architecture/src/Rules/EnumUsesStackraEnumTraitRule.php
 *
 * @description
 * Source rule: every PHP enum in the monorepo must `use Enum;`
 * from `Stackra\Enum\Enum` so it inherits the framework's
 * enum helpers (Callable cases, Nameable, Valuable, Optionable,
 * Metable, Comparable, Translatable).
 *
 * ## Why
 *
 * The framework's enum trait bundles the seven helpers we depend
 * on across the codebase — every consumer that reaches for
 * `MyEnum::names()` / `->label()` / `->description()` requires
 * the trait. Without it, downstream code silently falls back to
 * ad-hoc `array_map(...)` boilerplate or crashes at runtime.
 *
 * ## What it catches
 *
 * For files whose {@see SourceFile::$classKeyword} is `'enum'`,
 * either of these two conditions fails the rule:
 *
 *   1. No `use Stackra\Enum\Enum;` in the file's `use` block.
 *   2. No `use Enum;` inside the enum body.
 *
 * The `dev-tools/migrations/bin/stackra-migrate enums` script
 * is the paired remedy — running it fixes every violation this
 * rule surfaces.
 *
 * ## Exceptions
 *
 * The `packages/framework/enum/` package defines the trait; it
 * can't `use` itself. The layer resolver's `test_path_prefixes`
 * exempt test-fixture enums automatically. Any other
 * intentionally-excluded enum should carry a
 * `@architecture-allow enum-uses-stackra-enum-trait` docblock
 * comment (handled by the base rule's `severity: off` config).
 *
 * ## Paired migrator
 *
 * `dev-tools/migrations/src/EnumMigrator.php` is idempotent and
 * mutates enums to satisfy this rule automatically.
 */

declare(strict_types=1);

namespace Stackra\Architecture\Rules;

use Stackra\Architecture\Support\SourceFile;
use Stackra\Architecture\Violations\Severity;
use Stackra\Architecture\Violations\Violation;

/**
 * Enforce `use Enum;` (the Stackra trait) on every enum.
 *
 * @final
 */
final class EnumUsesStackraEnumTraitRule extends AbstractRule
{
    private const string ENUM_TRAIT_FQCN = 'Stackra\\Enum\\Enum';

    public function id(): string
    {
        return 'architecture.enum_uses_stackra_enum_trait';
    }

    public function description(): string
    {
        return 'Every enum must import `Stackra\\Enum\\Enum` and `use Enum;` in its body — the framework enum trait bundles the required helpers.';
    }

    protected function defaultSeverity(): Severity
    {
        return Severity::Error;
    }

    /**
     * Check the enum for both the import + body-use statement.
     *
     * @return list<Violation>
     */
    public function check(SourceFile $file): array
    {
        if ($file->classKeyword !== 'enum') {
            return [];
        }

        // The framework's own enum package defines the trait —
        // it obviously can't `use` itself.
        if ($file->classFqcn !== null && str_starts_with($file->classFqcn, 'Stackra\\Enum\\')) {
            return [];
        }

        $hasImport = false;
        foreach ($file->useStatements as $use) {
            if ($use->fqcn === self::ENUM_TRAIT_FQCN) {
                $hasImport = true;
                break;
            }
        }

        // Detect `use Enum;` inside the body — cheap regex on the
        // stripped content (comment-free) so docblock samples
        // don't false-match.
        $hasBodyUse = \preg_match(
            '/\benum\s+\w+[^{]*\{[^}]*\buse\s+Enum\s*;/',
            $file->strippedContent,
        ) === 1;

        if ($hasImport && $hasBodyUse) {
            return [];
        }

        $missing = [];
        if (! $hasImport) {
            $missing[] = 'use Stackra\\Enum\\Enum;';
        }
        if (! $hasBodyUse) {
            $missing[] = 'use Enum; (inside the enum body)';
        }

        return [
            $this->violation(
                file: $file,
                offender: $file->classFqcn ?? ($file->className ?? '<unknown>'),
                message: \sprintf(
                    'Enum "%s" is missing: %s',
                    $file->classFqcn ?? $file->className ?? '<unknown>',
                    \implode(' + ', $missing),
                ),
                line: null,
                hint: 'Run `php dev-tools/migrations/bin/stackra-migrate enums --apply` to fix every violation of this rule automatically.',
            ),
        ];
    }
}
