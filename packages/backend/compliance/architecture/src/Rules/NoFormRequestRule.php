<?php

/**
 * @file packages/architecture/src/Rules/NoFormRequestRule.php
 *
 * @description
 * Source rule: forbids the use of Laravel's `FormRequest` anywhere
 * in the codebase. Stackra uses `spatie/laravel-data` input DTOs
 * for validation + transport typing — one class per shape, one
 * shape per boundary. See `data-first.md` steering.
 *
 * ## What it catches
 *
 *   1. `use Illuminate\Foundation\Http\FormRequest;` — the import.
 *   2. `class Foo extends FormRequest` — direct extension.
 *
 * Both trigger a violation. The rule's `forbidden_bases` config is
 * an EXPANDABLE list so future forbidden bases (e.g. a custom
 * request base class) can be added without a code change.
 *
 * ## Layer scope
 *
 * Applies EVERYWHERE — this is a codebase-wide ban, not a
 * per-layer restriction. Tests, controllers, services alike.
 * `#[AllowsDirectModelAccess]` does NOT waive this rule — the
 * FormRequest ban is stricter than the model-access rule.
 *
 * ## Config
 *
 * `config('architecture.rules.no_form_request')`:
 *
 *   - `severity`          — `error` by default.
 *   - `forbidden_bases`   — list of FQCNs whose import / extension
 *                           trigger the rule.
 */

declare(strict_types=1);

namespace Stackra\Architecture\Rules;

use Stackra\Architecture\Support\SourceFile;
use Stackra\Architecture\Violations\Severity;
use Stackra\Architecture\Violations\Violation;

/**
 * Ban Laravel's FormRequest.
 *
 * @final
 */
final class NoFormRequestRule extends AbstractRule
{
    public function id(): string
    {
        return 'architecture.no_form_request';
    }

    public function description(): string
    {
        return 'FormRequest is banned. Use spatie/laravel-data input DTOs instead.';
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
        $forbidden = $this->listOfStrings($this->config['forbidden_bases'] ?? []);
        if ($forbidden === []) {
            return [];
        }

        $violations = [];

        // 1) `use` statements — direct import.
        foreach ($file->useStatements as $use) {
            if (! in_array($use->fqcn, $forbidden, true)) {
                continue;
            }

            $violations[] = $this->violation(
                file: $file,
                offender: $use->fqcn,
                message: sprintf(
                    'Forbidden import: "%s". Use spatie/laravel-data input DTOs for request validation.',
                    $use->fqcn,
                ),
                line: $use->line,
                hint: 'Replace the FormRequest subclass with a spatie/laravel-data Data DTO. See steering: data-first.md.',
            );
        }

        // 2) `extends X` clause — subclass detection. Cross-check
        //    against the file's use statements to resolve short-name
        //    references to their FQCN.
        if ($file->extends !== null) {
            $resolved = $this->resolveExtends($file);
            if (in_array($resolved, $forbidden, true)) {
                $violations[] = $this->violation(
                    file: $file,
                    offender: $resolved,
                    message: sprintf(
                        'Class "%s" extends banned base "%s". Use spatie/laravel-data input DTOs.',
                        $file->classFqcn ?? $file->path,
                        $resolved,
                    ),
                    line: null,
                    hint: 'Rewrite as a Data DTO — see the LoginData example in steering: data-first.md.',
                );
            }
        }

        return $violations;
    }

    /**
     * Resolve the `extends` clause to a full FQCN using the file's
     * imports. If `extends FormRequest` and the file has
     * `use Illuminate\Foundation\Http\FormRequest;`, this returns
     * the full FQCN. Falls back to the raw name if no import
     * matches (which means the parent is either in the same
     * namespace or references the global one).
     */
    private function resolveExtends(SourceFile $file): string
    {
        $extends = $file->extends;
        if ($extends === null) {
            return '';
        }

        // Already fully qualified.
        if (str_contains($extends, '\\')) {
            return ltrim($extends, '\\');
        }

        // Look up the short name in the use statements.
        $resolved = $file->resolveShortName($extends);

        return $resolved ?? $extends;
    }
}
