<?php

/**
 * @file ComposerPathRepoWirer.php
 * @module Academorix\Cli\Composer
 * @description Composer path-repository wiring service. Walks every
 *   composer.json in the workspace, builds a canonical `name -> path`
 *   map, and wires a `type: path` repositories entry for every `@dev`
 *   dep whose target resolves in the workspace. Composer then resolves
 *   `@dev` constraints against local path repositories at install time.
 *
 *   Direct port of `scripts/wire-composer-path-repos.py`. The Python
 *   script is retired in favour of the `composer:sync` CLI command
 *   that wraps this service.
 */

declare(strict_types=1);

namespace Academorix\Cli\Composer;

use Illuminate\Filesystem\Filesystem;
use Symfony\Component\Finder\Finder;

/**
 * Idempotent + side-effect-free-in-dry-run wiring service.
 */
final class ComposerPathRepoWirer
{
    /**
     * Directory names to skip anywhere in the walk.
     */
    private const SKIP_DIR_NAMES = ['node_modules', 'vendor'];

    /**
     * Composer `@dev` constraint patterns we care about. Matches
     * literal `@dev` and `dev-<branch>@dev` shapes.
     */
    private const DEV_CONSTRAINT_RE = '/^(@dev|dev-[^@]*(@dev)?)$/';

    public function __construct(
        private readonly Filesystem $filesystem,
    ) {}

    /**
     * Full wire pass. Discovers packages, walks each again, and either
     * writes the updated composer.json (when `$dryRun === false`) or
     * only tallies the changes (when `$dryRun === true`).
     */
    public function run(string $workspaceRoot, bool $dryRun, bool $verbose): WirerReport
    {
        $index = $this->discoverPackages($workspaceRoot);
        $report = new WirerReport;

        foreach ($this->sortedByName($index) as $pkg) {
            $this->process($pkg, $index, $report, $dryRun, $verbose);
        }

        return $report;
    }

    /**
     * Build the `name -> PackageInfo` map for the workspace.
     *
     * @return array<string, PackageInfo>
     */
    public function discoverPackages(string $workspaceRoot): array
    {
        $index = [];
        $finder = new Finder;
        $finder->files()
            ->in($workspaceRoot)
            ->name('composer.json')
            ->exclude(self::SKIP_DIR_NAMES)
            ->ignoreDotFiles(false);

        foreach ($finder as $file) {
            $path = $file->getRealPath() ?: $file->getPathname();
            if ($this->isSkipped($path, $workspaceRoot)) {
                continue;
            }
            $data = $this->readJson($path);
            if ($data === null) {
                continue;
            }
            $name = $data['name'] ?? null;
            if (! is_string($name) || ! str_contains($name, '/')) {
                continue;
            }
            $pkg = new PackageInfo(
                name: $name,
                path: $path,
                dir: (string) dirname($path),
            );
            if (isset($index[$name]) && $index[$name]->dir !== $pkg->dir) {
                fwrite(STDERR, sprintf(
                    "warning: duplicate package name %s at %s and %s\n",
                    $name,
                    $this->relative($index[$name]->dir, $workspaceRoot),
                    $this->relative($pkg->dir, $workspaceRoot),
                ));
            } elseif (! isset($index[$name])) {
                $index[$name] = $pkg;
            }
        }

        return $index;
    }

    /**
     * @return list<string>
     */
    public function collectDevDeps(array $data): array
    {
        $out = [];
        foreach (['require', 'require-dev'] as $block) {
            $deps = $data[$block] ?? null;
            if (! is_array($deps)) {
                continue;
            }
            foreach ($deps as $name => $constraint) {
                if (! is_string($name) || ! str_contains($name, '/')) {
                    continue;
                }
                if (is_string($constraint) && preg_match(self::DEV_CONSTRAINT_RE, $constraint) === 1) {
                    $out[] = $name;
                }
            }
        }

        return $out;
    }

    /**
     * @param  array<string, PackageInfo>  $index
     * @param  list<string>  &$unresolved
     * @return list<array<string, mixed>>
     */
    public function buildDesiredRepos(PackageInfo $package, array $devDeps, array $index, array &$unresolved): array
    {
        sort($devDeps);
        $entries = [];
        $seen = [];
        foreach ($devDeps as $dep) {
            $target = $index[$dep] ?? null;
            if ($target === null) {
                $unresolved[] = sprintf('%s -> %s', $package->name, $dep);

                continue;
            }
            $url = $this->relative($target->dir, $package->dir);
            if ($url === '.' || $url === '') {
                continue;
            }
            if (isset($seen[$url])) {
                continue;
            }
            $seen[$url] = true;
            $entries[] = [
                'type' => 'path',
                'url' => $url,
                'options' => ['symlink' => true],
            ];
        }

        return $entries;
    }

    /**
     * Merge the desired path repos into an existing `repositories`
     * value, preserving every non-path entry (VCS, packagist, artifact,
     * composer) verbatim.
     *
     * @param  list<array<string, mixed>>  $desired
     * @return array{repos: list<mixed>, changed: bool}
     */
    public function mergeRepositories(mixed $existing, array $desired): array
    {
        $preserved = [];
        if (is_array($existing)) {
            foreach ($existing as $entry) {
                if (is_array($entry) && ($entry['type'] ?? null) !== 'path') {
                    $preserved[] = $entry;
                }
            }
        }
        $new = array_values(array_merge($preserved, $desired));

        if (is_array($existing) && $existing === $new) {
            return ['repos' => $new, 'changed' => false];
        }
        if (! is_array($existing) && $new === []) {
            return ['repos' => $new, 'changed' => false];
        }

        return ['repos' => $new, 'changed' => true];
    }

    /**
     * Suggest the closest package name in the workspace for an
     * unresolvable target. Used by the command to surface
     * `did you mean?` hints.
     *
     * @param  array<int, string>  $candidates
     */
    public function closestName(string $target, array $candidates, float $cutoff = 0.65): ?string
    {
        $tail = static fn (string $n): string => str_contains($n, '/') ? explode('/', $n, 2)[1] : $n;
        $tt = $tail($target);
        $best = null;
        $bestRatio = 0.0;
        foreach ($candidates as $c) {
            $pct = 0;
            similar_text($tt, $tail($c), $pct);
            $ratio = $pct / 100.0;
            if ($ratio > $bestRatio) {
                $bestRatio = $ratio;
                $best = $c;
            }
        }

        return $bestRatio >= $cutoff ? $best : null;
    }

    // ── Internals ─────────────────────────────────────────────────────

    /**
     * @param  array<string, PackageInfo>  $index
     */
    private function process(PackageInfo $pkg, array $index, WirerReport $report, bool $dryRun, bool $verbose): void
    {
        $original = $this->filesystem->get($pkg->path);
        $data = $this->safeJsonDecode($original);
        if (! is_array($data)) {
            return;
        }

        $devDeps = $this->collectDevDeps($data);
        $desired = $this->buildDesiredRepos($pkg, $devDeps, $index, $report->unresolved);
        $existing = $data['repositories'] ?? null;
        $merge = $this->mergeRepositories($existing, $desired);

        if (! $merge['changed']) {
            $report->skipped++;

            return;
        }

        if ($merge['repos'] === []) {
            unset($data['repositories']);
        } else {
            $data['repositories'] = $merge['repos'];
        }

        $existingCount = is_array($existing) ? count($existing) : 0;
        $nonPathCount = 0;
        foreach ($merge['repos'] as $entry) {
            if (is_array($entry) && ($entry['type'] ?? null) !== 'path') {
                $nonPathCount++;
            }
        }
        $report->changes[] = sprintf(
            '  fix  %s: %d -> %d repo entries (%d path, %d non-path)',
            $pkg->name,
            $existingCount,
            count($merge['repos']),
            count($desired),
            $nonPathCount,
        );

        if (! $dryRun) {
            $this->writeJsonPreserving($pkg->path, $data, $original);
        }
        $report->touched++;
    }

    private function safeJsonDecode(string $body): mixed
    {
        try {
            return json_decode($body, associative: true, flags: JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return null;
        }
    }

    private function readJson(string $path): ?array
    {
        $raw = $this->filesystem->get($path);
        $decoded = $this->safeJsonDecode($raw);

        return is_array($decoded) ? $decoded : null;
    }

    /**
     * Preserve indent + trailing newline shape from the original.
     */
    private function writeJsonPreserving(string $path, array $data, string $original): void
    {
        $indent = $this->sniffIndent($original);
        $body = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if ($body === false) {
            return;
        }
        // json_encode always emits 4-space indent; normalise to the
        // sniffed indent so we don't churn every file.
        if ($indent !== 4) {
            $body = preg_replace_callback(
                '/^(    +)/m',
                function (array $m) use ($indent): string {
                    $depth = intdiv(strlen($m[1]), 4);

                    return str_repeat(str_repeat(' ', $indent), $depth);
                },
                $body,
            ) ?? $body;
        }
        if (str_ends_with($original, "\n")) {
            $body .= "\n";
        }
        $this->filesystem->put($path, $body);
    }

    private function sniffIndent(string $text): int
    {
        foreach (explode("\n", $text) as $line) {
            $stripped = ltrim($line, ' ');
            $leading = strlen($line) - strlen($stripped);
            if ($leading > 0 && $stripped !== '') {
                return $leading;
            }
        }

        return 2;
    }

    private function relative(string $target, string $from): string
    {
        $target = rtrim($target, '/');
        $from = rtrim($from, '/');
        if ($target === $from) {
            return '.';
        }

        $targetParts = explode('/', ltrim($target, '/'));
        $fromParts = explode('/', ltrim($from, '/'));

        $commonLen = 0;
        $max = min(count($targetParts), count($fromParts));
        while ($commonLen < $max && $targetParts[$commonLen] === $fromParts[$commonLen]) {
            $commonLen++;
        }

        $up = str_repeat('../', count($fromParts) - $commonLen);
        $down = implode('/', array_slice($targetParts, $commonLen));

        $result = $up.$down;

        return rtrim($result, '/') ?: '.';
    }

    /**
     * @param  array<string, PackageInfo>  $index
     * @return list<PackageInfo>
     */
    private function sortedByName(array $index): array
    {
        $keys = array_keys($index);
        sort($keys);
        $out = [];
        foreach ($keys as $k) {
            $out[] = $index[$k];
        }

        return $out;
    }

    private function isSkipped(string $path, string $workspaceRoot): bool
    {
        // Never touch the CLI's own vendor tree.
        $rel = ltrim(str_replace($workspaceRoot, '', $path), '/');
        if (str_starts_with($rel, 'tools/cli/vendor/')) {
            return true;
        }
        foreach (self::SKIP_DIR_NAMES as $skip) {
            if (str_contains($path, '/'.$skip.'/')) {
                return true;
            }
        }

        return false;
    }
}
