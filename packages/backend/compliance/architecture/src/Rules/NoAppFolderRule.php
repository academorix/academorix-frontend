<?php

/**
 * @file packages/architecture/src/Rules/NoAppFolderRule.php
 *
 * @description
 * Path rule: forbids the Laravel-default `app/` directory at
 * the root of any Academorix app.
 *
 * ## Why
 *
 * Academorix apps use `src/` as their source root — the same
 * convention every package in the monorepo follows. Wiring is
 * done in `bootstrap/app.php` via:
 *
 *     $app->useAppPath($app->basePath('src'));
 *
 * A stray `app/` directory means the app is still on the stock
 * Laravel layout. The autoload path becomes ambiguous (two
 * roots for `App\` namespace), attribute-based discovery starts
 * missing classes, and the codebase drifts from the rest of the
 * monorepo. Better to fail hard, once, at CI.
 *
 * ## Where it looks
 *
 * Same shape as {@see NoResourcesFolderRule}: walk each
 * candidate app root under the scan root, then check every
 * configured `forbidden_directories` name as a direct
 * subdirectory of that app root.
 *
 * ## Config
 *
 * `config('architecture.rules.no_app_folder')`:
 *
 *   - `severity`              — `error` by default.
 *   - `forbidden_directories` — list of directory basenames
 *                               forbidden at the app root
 *                               (e.g. `['app']`).
 */

declare(strict_types=1);

namespace Academorix\Architecture\Rules;

use Academorix\Architecture\Violations\Violation;

/**
 * Enforce "use src/, never app/, as the source root".
 *
 * @final
 */
final class NoAppFolderRule extends AbstractPathRule
{
    /**
     * Stable dotted identifier.
     */
    public function id(): string
    {
        return 'architecture.no_app_folder';
    }

    /**
     * One-line description surfaced by the reporter.
     */
    public function description(): string
    {
        return 'Academorix apps use src/ as the source root — a Laravel-style app/ directory is forbidden.';
    }

    /**
     * Walk each candidate app root and flag every forbidden
     * subdirectory found.
     *
     * @param  string          $root  Absolute scan-root path.
     * @return list<Violation>        One violation per hit; `[]` when clean.
     */
    public function check(string $root): array
    {
        // Load and coerce the forbidden basename list.
        /** @var list<string> $forbiddenDirectories */
        $forbiddenDirectories = array_values(array_filter(
            (array) ($this->config['forbidden_directories'] ?? []),
            is_string(...),
        ));

        if ($forbiddenDirectories === []) {
            return [];
        }

        $violations = [];

        // Iterate app roots and each forbidden basename as a
        // direct child of the app root.
        foreach ($this->candidateAppRoots($root) as $appRoot) {
            foreach ($forbiddenDirectories as $basename) {
                $fullPath = $appRoot . DIRECTORY_SEPARATOR . $basename;

                if (! is_dir($fullPath)) {
                    continue;
                }

                $violations[] = $this->violation(
                    filePath: $fullPath,
                    offender: $basename,
                    message: sprintf(
                        'Forbidden directory "%s" exists in %s — Academorix apps use src/ as the source root.',
                        $basename,
                        $appRoot,
                    ),
                    hint: 'Use `src/` as the source root. Configure it via `$app->useAppPath($app->basePath(\'src\'))` in bootstrap/app.php.',
                );
            }
        }

        return $violations;
    }

    /**
     * Yield every candidate "app root" under the scan root.
     * Same pattern as {@see NoResourcesFolderRule::candidateAppRoots()}.
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
