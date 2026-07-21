<?php

/**
 * @file packages/architecture/src/Rules/NoRoutesFolderRule.php
 *
 * @description
 * Path rule: forbids the existence of `routes/api.php`,
 * `routes/web.php`, and `routes/channels.php` in any app.
 *
 * ## Why
 *
 * Every URL in Stackra is declared via attributes on the
 * controller (`#[AsController]` + `#[Get]` / `#[Post]` / etc.).
 * A route file is either legacy code that hasn't been migrated
 * yet OR a shortcut that will drift out of sync with what the
 * Routing package's discovery layer sees.
 *
 * ## Where it looks
 *
 * The rule walks every scan root once, checks whether any of
 * the `forbidden_files` (config) exists directly under the
 * scan root OR under an `apps/*` subdirectory of the scan root.
 * Both paths are checked so the rule fires against workspaces
 * rooted at either `/apps` (single-app repo) or the monorepo
 * root (`/apps/*`).
 *
 * ## Config
 *
 * `config('architecture.rules.no_routes_folder')`:
 *
 *   - `severity`         — `error` by default.
 *   - `forbidden_files`  — list of relative paths under an app root
 *                          that are forbidden. Defaults:
 *                          `routes/api.php`, `routes/web.php`,
 *                          `routes/channels.php`.
 */

declare(strict_types=1);

namespace Stackra\Architecture\Rules;

use Stackra\Architecture\Violations\Violation;

/**
 * Enforce "no route files anywhere".
 *
 * @final
 */
final class NoRoutesFolderRule extends AbstractPathRule
{
    public function id(): string
    {
        return 'architecture.no_routes_folder';
    }

    public function description(): string
    {
        return 'Routes are declared on controllers via #[AsController] + #[Get] / #[Post] / ... — never in routes/*.php.';
    }

    /**
     * @return list<Violation>
     */
    public function check(string $root): array
    {
        /** @var list<string> $forbiddenFiles */
        $forbiddenFiles = array_values(array_filter(
            (array) ($this->config['forbidden_files'] ?? []),
            is_string(...),
        ));

        if ($forbiddenFiles === []) {
            return [];
        }

        $violations = [];

        // Walk each direct child of the scan root that looks like
        // an app (has a composer.json). For a scan root that IS
        // one app, treat the root itself as the "app root". Both
        // usage patterns are supported.
        foreach ($this->candidateAppRoots($root) as $appRoot) {
            foreach ($forbiddenFiles as $relative) {
                $fullPath = $appRoot . DIRECTORY_SEPARATOR . $relative;

                if (! file_exists($fullPath)) {
                    continue;
                }

                $violations[] = $this->violation(
                    filePath: $fullPath,
                    offender: $relative,
                    message: sprintf(
                        'Forbidden route file "%s" exists in %s. Every URL is declared via controller attributes.',
                        $relative,
                        $appRoot,
                    ),
                    hint: 'Move each route into a controller decorated with #[AsController] + the matching HTTP-verb attribute.',
                );
            }
        }

        return $violations;
    }

    /**
     * Yield every candidate "app root" under the scan root:
     *
     *   - If the root itself contains a `composer.json`, treat it
     *     as one app.
     *   - Otherwise iterate its direct children and treat each
     *     child that contains a `composer.json` as an app.
     *
     * This makes the rule work in both single-app repos (scan
     * root === app root) and monorepos (scan root === /apps).
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
