<?php

/**
 * @file packages/architecture/src/Rules/NoRouteServiceProviderRule.php
 *
 * @description
 * Path rule: forbids the existence of any `RouteServiceProvider.php`
 * (or other configured filenames) anywhere under the scan root.
 *
 * ## Why
 *
 * Academorix routing is handled entirely by the `Routing`
 * package: controllers carry `#[AsController]` + verb attributes
 * (`#[Get]`, `#[Post]`, …) and the package's discovery pass
 * registers every URL at boot. There is no `routes/*.php`, no
 * `Route::` facade, and — critically — no `RouteServiceProvider`.
 *
 * A `RouteServiceProvider` on disk is a duplicate registration
 * path that WILL drift: the file typically calls `Route::` /
 * `$this->routes(...)` under the hood, which then re-registers
 * some subset of URLs and diverges from what the discovery
 * layer sees. Ban the file entirely.
 *
 * ## What it does
 *
 * Recursively scans `$root` (using Symfony Finder — already a
 * package dependency) for any file whose basename matches a
 * configured `forbidden_file_names` entry. Skips vendor /
 * node_modules / .git so we don't fire on framework provider
 * files that legitimately exist under `vendor/`.
 *
 * ## Config
 *
 * `config('architecture.rules.no_route_service_provider')`:
 *
 *   - `severity`            — `error` by default.
 *   - `forbidden_file_names`— list of file basenames (e.g.
 *                             `['RouteServiceProvider.php']`).
 */

declare(strict_types=1);

namespace Academorix\Architecture\Rules;

use Academorix\Architecture\Violations\Violation;
use Symfony\Component\Finder\Finder;

/**
 * Enforce "no RouteServiceProvider anywhere".
 *
 * @final
 */
final class NoRouteServiceProviderRule extends AbstractPathRule
{
    /**
     * Directories skipped by the recursive scan. Vendor code
     * legitimately ships its own providers; node_modules and
     * .git obviously don't belong in a PHP scan.
     */
    private const array EXCLUDED_DIRECTORIES = [
        'vendor',
        'node_modules',
        '.git',
        'storage',
        'bootstrap/cache',
    ];

    /**
     * Stable dotted identifier.
     */
    public function id(): string
    {
        return 'architecture.no_route_service_provider';
    }

    /**
     * One-line description surfaced by the reporter.
     */
    public function description(): string
    {
        return 'RouteServiceProvider is forbidden — Academorix Routing discovers controllers via #[AsController].';
    }

    /**
     * Recursively scan `$root` and emit one violation per file
     * whose basename matches any configured `forbidden_file_names`.
     *
     * @param  string          $root  Absolute scan-root path.
     * @return list<Violation>        Zero or more violations.
     */
    public function check(string $root): array
    {
        // Load and coerce the forbidden basename list.
        /** @var list<string> $forbiddenNames */
        $forbiddenNames = array_values(array_filter(
            (array) ($this->config['forbidden_file_names'] ?? []),
            is_string(...),
        ));

        if ($forbiddenNames === []) {
            return [];
        }

        // The scan root has to exist — if a caller misconfigures
        // `paths`, Finder throws. Guard first for a cleaner
        // "rule is a no-op" outcome.
        if (! is_dir($root)) {
            return [];
        }

        // Configure Symfony Finder for a recursive file walk.
        // `name()` uses glob semantics, so we pass the exact
        // basename for each forbidden entry.
        $finder = (new Finder())
            ->files()
            ->in($root)
            ->exclude(self::EXCLUDED_DIRECTORIES)
            ->ignoreDotFiles(false)
            ->ignoreVCS(true);

        foreach ($forbiddenNames as $name) {
            $finder->name($name);
        }

        $violations = [];

        // Each hit is one violation; the file path itself is the
        // offender and we cannot attribute a specific line.
        foreach ($finder as $file) {
            $violations[] = $this->violation(
                filePath: $file->getPathname(),
                offender: $file->getFilename(),
                message: sprintf(
                    'Forbidden file "%s" exists at %s — Academorix does not use a RouteServiceProvider.',
                    $file->getFilename(),
                    $file->getPathname(),
                ),
                hint: 'Routing is handled by the Academorix Routing package via #[AsController] discovery. No RouteServiceProvider needed.',
            );
        }

        return $violations;
    }
}
