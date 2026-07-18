<?php

/**
 * @file packages/architecture/src/Rules/NoResourcesFolderRule.php
 *
 * @description
 * Path rule: forbids the existence of view-asset directories
 * (e.g. `resources/`) inside any Academorix app.
 *
 * ## Why
 *
 * Every Academorix backend app is headless — it emits JSON to a
 * separate frontend and never renders Blade / CSS / JS itself.
 * A `resources/` directory on an app root is either a leftover
 * from a Laravel `laravel new` skeleton or an early-stage
 * shortcut that will grow to hide UI concerns inside a service
 * layer. Both cases are caught here so the mistake is loud
 * during CI rather than quietly shipped.
 *
 * ## Where it looks
 *
 * The rule walks each scan root once and enumerates candidate
 * "app roots" the same way {@see NoRoutesFolderRule} does:
 * mono-repo layouts (`scan root === /apps/`, each child app
 * has a `composer.json`) and single-app layouts (scan root
 * itself IS the app root). For each app root, every configured
 * `forbidden_directories` name is checked as a direct child.
 * Only direct children are checked — nested `resources/`
 * folders (e.g. `src/Foo/resources/`) are permitted because
 * they usually belong to a legitimate sub-package.
 *
 * ## Config
 *
 * `config('architecture.rules.no_resources_folder')`:
 *
 *   - `severity`              — `error` by default.
 *   - `forbidden_directories` — list of directory basenames
 *                               forbidden at any app root
 *                               (e.g. `resources`, `public/assets`).
 */

declare(strict_types=1);

namespace Academorix\Architecture\Rules;

use Academorix\Architecture\Violations\Violation;

/**
 * Enforce "no view-asset directories inside a headless app".
 *
 * @final
 */
final class NoResourcesFolderRule extends AbstractPathRule
{
    /**
     * Stable dotted identifier used as the config key and printed
     * in every violation payload.
     */
    public function id(): string
    {
        return 'architecture.no_resources_folder';
    }

    /**
     * One-line description surfaced by the CLI reporter above
     * each violation group.
     */
    public function description(): string
    {
        return 'Academorix apps are headless — no resources/ (or equivalent view-asset) directory allowed at the app root.';
    }

    /**
     * Walk each candidate app root under `$root` and flag every
     * forbidden directory that exists as a direct subdirectory.
     *
     * @param  string          $root  Absolute scan-root path.
     * @return list<Violation>        One violation per forbidden hit; `[]` when clean.
     */
    public function check(string $root): array
    {
        // Load the configured basename list. When empty the rule
        // is effectively off — treat as "not configured".
        /** @var list<string> $forbiddenDirectories */
        $forbiddenDirectories = array_values(array_filter(
            (array) ($this->config['forbidden_directories'] ?? []),
            is_string(...),
        ));

        if ($forbiddenDirectories === []) {
            return [];
        }

        $violations = [];

        // Walk each candidate app root and check for each
        // forbidden basename as a direct subdirectory. This
        // supports both mono-repo (`$root === /apps`) and
        // single-app (`$root` itself is an app) layouts.
        foreach ($this->candidateAppRoots($root) as $appRoot) {
            foreach ($forbiddenDirectories as $basename) {
                $fullPath = $appRoot . DIRECTORY_SEPARATOR . $basename;

                // Only flag when the entry exists AND is a
                // directory — a stray file with the same name
                // (extremely rare) is out of scope.
                if (! is_dir($fullPath)) {
                    continue;
                }

                $violations[] = $this->violation(
                    filePath: $fullPath,
                    offender: $basename,
                    message: sprintf(
                        'Forbidden directory "%s" exists in %s — Academorix apps are headless.',
                        $basename,
                        $appRoot,
                    ),
                    hint: 'Every Academorix app is headless. Move view assets to a separate frontend.',
                );
            }
        }

        return $violations;
    }

    /**
     * Yield every candidate "app root" under `$root`:
     *
     *   - If the root itself contains a `composer.json`, treat
     *     it as one app.
     *   - Otherwise iterate its direct children and treat each
     *     child that contains a `composer.json` as an app.
     *
     * Identical semantics to {@see NoRoutesFolderRule::candidateAppRoots()}
     * — kept here (rather than pushed into `AbstractPathRule`)
     * so each rule stays self-contained and easy to reason
     * about in isolation.
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
