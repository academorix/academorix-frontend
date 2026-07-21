<?php

/**
 * @file packages/architecture/src/Rules/NoJsonResourceRule.php
 *
 * @description
 * Source rule: forbids the use of Laravel's `JsonResource` and
 * `ResourceCollection` anywhere in the codebase. Stackra uses
 * `spatie/laravel-data` OUTPUT DTOs for API serialisation — one
 * class per response shape, one shape per boundary. Data classes
 * are typed, transformable, and PHPStan-friendly; JsonResource
 * is a magic-array pattern that hides the wire shape at compile
 * time. See `data-first.md` steering.
 *
 * ## What it catches
 *
 *   1. `use Illuminate\Http\Resources\Json\JsonResource;`
 *   2. `use Illuminate\Http\Resources\Json\ResourceCollection;`
 *   3. `class Foo extends JsonResource`
 *   4. `class Foo extends ResourceCollection`
 *
 * Each import triggers its own violation; the `extends` clause
 * (when it resolves to a forbidden base) triggers an additional
 * one. Both `use` and `extends` are inspected so the rule
 * survives inline FQCN references too.
 *
 * ## Layer scope
 *
 * Applies EVERYWHERE — this is a codebase-wide ban, not a
 * per-layer restriction. Controllers, services, tests alike.
 *
 * ## Config
 *
 * `config('architecture.rules.no_json_resource')`:
 *
 *   - `severity`          — `error` by default.
 *   - `forbidden_bases`   — list of FQCNs whose import /
 *                           extension triggers the rule.
 */

declare(strict_types=1);

namespace Stackra\Architecture\Rules;

use Stackra\Architecture\Support\SourceFile;
use Stackra\Architecture\Violations\Severity;
use Stackra\Architecture\Violations\Violation;

/**
 * Ban Laravel's JsonResource / ResourceCollection.
 *
 * @final
 */
final class NoJsonResourceRule extends AbstractRule
{
    /**
     * Stable dotted identifier — used as the rule's config key
     * and printed in every violation payload. MUST NOT change
     * once shipped.
     */
    public function id(): string
    {
        return 'architecture.no_json_resource';
    }

    /**
     * One-line human explanation used by the CLI reporter.
     */
    public function description(): string
    {
        return 'JsonResource / ResourceCollection are banned. Use spatie/laravel-data output DTOs instead.';
    }

    /**
     * Errors block CI — a JsonResource in the tree defeats the
     * data-first typing story, so we fail hard by default.
     */
    protected function defaultSeverity(): Severity
    {
        return Severity::Error;
    }

    /**
     * Walk `use` statements and the `extends` clause and emit a
     * violation for every reference to a forbidden base class.
     *
     * @param  SourceFile     $file  Parsed source file the scanner just built.
     * @return list<Violation>       Every offending reference; `[]` when clean.
     */
    public function check(SourceFile $file): array
    {
        // Load the configured list of forbidden FQCNs once. When
        // the list is empty the rule is a no-op — treat that as
        // "the rule is turned off" rather than throwing.
        $forbidden = $this->listOfStrings($this->config['forbidden_bases'] ?? []);
        if ($forbidden === []) {
            return [];
        }

        $violations = [];

        // 1) Every `use` statement is a candidate — importing a
        //    forbidden class is already a smell even if it's not
        //    used in an `extends` clause (indicates awareness).
        foreach ($file->useStatements as $use) {
            if (! \in_array($use->fqcn, $forbidden, true)) {
                continue;
            }

            $violations[] = $this->violation(
                file: $file,
                offender: $use->fqcn,
                message: \sprintf(
                    'Forbidden import: "%s". Use spatie/laravel-data output DTOs for API serialisation.',
                    $use->fqcn,
                ),
                line: $use->line,
                hint: 'Rewrite as a spatie/laravel-data output DTO. See steering: data-first.md.',
            );
        }

        // 2) `extends X` — subclass detection. Resolve the parent
        //    reference through the file's imports so short-name
        //    extends like `extends JsonResource` still match the
        //    full FQCN in `forbidden_bases`.
        if ($file->extends !== null) {
            $resolved = $this->resolveExtends($file);
            if (\in_array($resolved, $forbidden, true)) {
                $violations[] = $this->violation(
                    file: $file,
                    offender: $resolved,
                    message: \sprintf(
                        'Class "%s" extends banned base "%s". Use spatie/laravel-data output DTOs.',
                        $file->classFqcn ?? $file->path,
                        $resolved,
                    ),
                    line: null,
                    hint: 'Rewrite as a spatie/laravel-data output DTO. See steering: data-first.md.',
                );
            }
        }

        return $violations;
    }

    /**
     * Expand the `extends` clause to a full FQCN using the file's
     * `use` statements. Handles three cases:
     *
     *   1. Already fully qualified (`extends \Some\Ns\Class`) —
     *      strip the leading backslash and return.
     *   2. Short name imported via `use` — look it up in the
     *      file's import table and return the imported FQCN.
     *   3. Neither — return the raw name (likely a same-namespace
     *      reference that we can't attribute without more work).
     */
    private function resolveExtends(SourceFile $file): string
    {
        $extends = $file->extends;
        if ($extends === null) {
            return '';
        }

        // Case 1 — fully-qualified reference. Nothing to resolve.
        if (\str_contains($extends, '\\')) {
            return \ltrim($extends, '\\');
        }

        // Case 2 — short name; consult the file's use statements.
        $resolved = $file->resolveShortName($extends);

        // Case 3 — fall back to the raw name if no import matches.
        return $resolved ?? $extends;
    }
}
