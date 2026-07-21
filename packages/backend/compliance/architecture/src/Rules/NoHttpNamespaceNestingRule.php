<?php

/**
 * @file packages/architecture/src/Rules/NoHttpNamespaceNestingRule.php
 *
 * @description
 * Source rule: forbids `\Http\` (and any other configured
 * segment) inside class namespaces. Stackra packages use
 * FLAT per-package namespaces:
 *
 *     Stackra\Users\Controllers\LoginController
 *
 * NOT
 *
 *     Stackra\Users\Http\Controllers\LoginController
 *
 * ## Why
 *
 * The `Http` sub-namespace is a Laravel-app convention that
 * doesn't map to the package layout Stackra uses. Every
 * package is a domain — Users, Billing, Auth — and the
 * transport (Controllers, Middleware) is one folder under the
 * domain, not a nested `Http` bucket.
 *
 * ## What it catches
 *
 * A file whose {@see SourceFile::$namespace} contains any of
 * the configured `forbidden_segments` substrings triggers a
 * SINGLE violation. Emitting multiple violations for a class
 * whose namespace nests `Http` twice is noisy without helping
 * — one is enough.
 *
 * ## Config
 *
 * `config('architecture.rules.no_http_namespace_nesting')`:
 *
 *   - `severity`            — `warning` by default.
 *   - `forbidden_segments`  — list of namespace substrings
 *                             (default: `\Http\`).
 */

declare(strict_types=1);

namespace Stackra\Architecture\Rules;

use Stackra\Architecture\Support\SourceFile;
use Stackra\Architecture\Violations\Severity;
use Stackra\Architecture\Violations\Violation;

/**
 * Ban `\Http\` (and friends) inside class namespaces.
 *
 * @final
 */
final class NoHttpNamespaceNestingRule extends AbstractRule
{
    /**
     * Stable dotted identifier.
     */
    public function id(): string
    {
        return 'architecture.no_http_namespace_nesting';
    }

    /**
     * One-line description surfaced by the reporter.
     */
    public function description(): string
    {
        return 'Use flat namespaces — Stackra\\<Package>\\Controllers, not Stackra\\<Package>\\Http\\Controllers.';
    }

    /**
     * Warning — this is a naming-convention rule; enforce
     * gently.
     */
    protected function defaultSeverity(): Severity
    {
        return Severity::Warning;
    }

    /**
     * Emit one violation when the file's namespace contains any
     * configured forbidden segment.
     *
     * @param  SourceFile     $file  Parsed source file.
     * @return list<Violation>       Empty when clean; one entry when nesting is detected.
     */
    public function check(SourceFile $file): array
    {
        // No namespace — nothing to check.
        if ($file->namespace === null) {
            return [];
        }

        $forbiddenSegments = $this->listOfStrings($this->config['forbidden_segments'] ?? []);
        if ($forbiddenSegments === []) {
            return [];
        }

        // Walk segments in order; the FIRST match wins so the
        // violation message names the specific segment that
        // tripped the rule.
        foreach ($forbiddenSegments as $segment) {
            if (! \str_contains($file->namespace, $segment)) {
                continue;
            }

            return [
                $this->violation(
                    file: $file,
                    offender: $file->namespace,
                    message: \sprintf(
                        'Namespace "%s" contains forbidden segment "%s" — use a flat per-package namespace.',
                        $file->namespace,
                        $segment,
                    ),
                    line: null,
                    hint: 'Use flat namespaces — Stackra\\<Package>\\Controllers, not Stackra\\<Package>\\Http\\Controllers.',
                ),
            ];
        }

        return [];
    }
}
