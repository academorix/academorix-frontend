<?php

/**
 * @file packages/architecture/src/Rules/MigrationHasDownRule.php
 *
 * @description
 * Path rule: every migration file must define a
 * `public function down(...)` method so operational rollback
 * remains possible.
 *
 * ## Why
 *
 * A migration without a `down()` is a one-way ticket. Rolling
 * back a bad deploy becomes a manual DBA task, `migrate:reset`
 * / `migrate:refresh` fail, and local test suites that depend
 * on tearing down a database between runs stop working. The
 * cost of writing a `down()` at authoring time is a fraction of
 * the cost of NOT having one during an incident.
 *
 * ## What it does
 *
 * For each candidate app root under `$root`, walk each relative
 * path in `migration_directories`. If the directory exists,
 * iterate every `.php` file DIRECTLY under it (migrations are
 * flat by convention — subdirectories are legitimate for other
 * things like `dumps/`, so we don't recurse). For each file,
 * regex-scan for a `public function down` declaration. Missing
 * → violation.
 *
 * The regex is intentionally lenient: it accepts optional
 * `static`, arbitrary whitespace, and both `public` and `final
 * public` combinations. False negatives (a migration hidden
 * behind an unusual formatting choice) are worth trading for
 * zero false positives on well-formed code.
 *
 * ## Config
 *
 * `config('architecture.rules.migration_has_down')`:
 *
 *   - `severity`              — `error` by default.
 *   - `migration_directories` — list of relative directory paths
 *                               under the app root (e.g.
 *                               `['database/migrations']`).
 */

declare(strict_types=1);

namespace Stackra\Architecture\Rules;

use Stackra\Architecture\Violations\Violation;

/**
 * Enforce "every migration defines a `down()` method".
 *
 * @final
 */
final class MigrationHasDownRule extends AbstractPathRule
{
    /**
     * Regex matching a `public function down` declaration on
     * one line. Accepts optional `final` and `static` modifiers
     * with arbitrary whitespace. The trailing `(` guarantees
     * we've found a method (not a property or use statement).
     */
    private const string DOWN_METHOD_REGEX =
        '/^\s*(?:final\s+)?public\s+(?:static\s+)?function\s+down\s*\(/m';

    /**
     * Stable dotted identifier.
     */
    public function id(): string
    {
        return 'architecture.migration_has_down';
    }

    /**
     * One-line description surfaced by the reporter.
     */
    public function description(): string
    {
        return 'Every migration must declare public function down() so rollback stays available.';
    }

    /**
     * For each configured migration directory that exists under
     * each candidate app root, flag every `.php` file that lacks
     * a `down()` method declaration.
     *
     * @param  string          $root  Absolute scan-root path.
     * @return list<Violation>        Zero or more violations.
     */
    public function check(string $root): array
    {
        // Load and coerce the migration-directory list.
        /** @var list<string> $migrationDirectories */
        $migrationDirectories = array_values(array_filter(
            (array) ($this->config['migration_directories'] ?? []),
            is_string(...),
        ));

        if ($migrationDirectories === []) {
            return [];
        }

        $violations = [];

        // Walk each candidate app root and each configured
        // migration directory relative to it.
        foreach ($this->candidateAppRoots($root) as $appRoot) {
            foreach ($migrationDirectories as $relative) {
                $migrationDir = $appRoot . DIRECTORY_SEPARATOR . $relative;

                if (! is_dir($migrationDir)) {
                    continue;
                }

                // Migrations are FLAT by Laravel convention —
                // we intentionally do not recurse. Direct
                // children only.
                $entries = @scandir($migrationDir);
                if ($entries === false) {
                    continue;
                }

                foreach ($entries as $entry) {
                    if ($entry === '.' || $entry === '..') {
                        continue;
                    }

                    // Skip anything not a `.php` file. Yaml /
                    // seed dumps living next to migrations are
                    // out of scope.
                    if (! str_ends_with($entry, '.php')) {
                        continue;
                    }

                    $filePath = $migrationDir . DIRECTORY_SEPARATOR . $entry;
                    if (! is_file($filePath)) {
                        continue;
                    }

                    $contents = @file_get_contents($filePath);
                    if ($contents === false) {
                        continue;
                    }

                    // The migration passes when the down()
                    // declaration is present anywhere in the
                    // file — comments have not been stripped
                    // here, but a commented-out `public
                    // function down(` is a false negative
                    // we tolerate (extremely rare).
                    if (preg_match(self::DOWN_METHOD_REGEX, $contents) === 1) {
                        continue;
                    }

                    $violations[] = $this->violation(
                        filePath: $filePath,
                        offender: $entry,
                        message: sprintf(
                            'Migration "%s" does not declare a public function down() — rollback is impossible.',
                            $entry,
                        ),
                        hint: 'Add a public function down() method that inverts the up() operation. Migrations must be reversible.',
                    );
                }
            }
        }

        return $violations;
    }

    /**
     * Yield every candidate "app root" under the scan root.
     * Same pattern as {@see NoRoutesFolderRule::candidateAppRoots()}.
     *
     * @return \Generator<int, string>
     */
    private function candidateAppRoots(string $root): \Generator
    {
        if (file_exists($root . '/composer.json')) {
            yield $root;

            return;
        }

        $entries = @scandir($root);
        if ($entries === false) {
            return;
        }

        foreach ($entries as $entry) {
            if ($entry === '.' || $entry === '..') {
                continue;
            }

            $candidate = $root . DIRECTORY_SEPARATOR . $entry;
            if (is_dir($candidate) && file_exists($candidate . '/composer.json')) {
                yield $candidate;
            }
        }
    }
}
