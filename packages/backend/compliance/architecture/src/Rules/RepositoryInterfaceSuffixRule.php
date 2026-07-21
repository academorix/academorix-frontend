<?php

/**
 * @file packages/architecture/src/Rules/RepositoryInterfaceSuffixRule.php
 *
 * @description
 * Path rule: every file under a `Contracts/` directory whose
 * name matches the "repository" pattern must end in `Interface`.
 *
 * ## Why
 *
 * The Magento 2 / Laravel convention Stackra follows names
 * every repository contract `<Model>RepositoryInterface`.
 * The `Interface` suffix is what:
 *
 *   - Communicates "this is a contract" at the point of import.
 *     `use App\Contracts\UserRepository` reads like a concrete
 *     class; `use App\Contracts\UserRepositoryInterface` cannot
 *     be misread.
 *   - Frees the same-namespace short name for the concrete
 *     implementation. `App\Repositories\UserRepository` and
 *     `App\Contracts\UserRepositoryInterface` never collide.
 *   - Anchors #[Bind] wiring — the concrete class binds against
 *     an FQCN whose short name is deterministic.
 *
 * A file under `Contracts/` named `UserRepository.php` (no
 * `Interface`) violates all three properties. Fail loud.
 *
 * ## What it does
 *
 * Recursively find every directory named `contracts_directory`
 * ("Contracts" by default) under either a candidate app root
 * OR under `packages/{name}/src/` (workspace-level). Inside
 * each hit, iterate every `.php` file. If the filename
 * (without `.php`) matches `repository_pattern` (regex) AND
 * does NOT already end in `Interface`, emit a violation.
 *
 * The `packages/{name}/src/` sweep supports the monorepo
 * layout: shared repositories declared in the architecture
 * package live in `packages/foo/src/Contracts/`, and the same
 * naming
 * convention applies.
 *
 * ## Config
 *
 * `config('architecture.rules.repository_interface_suffix')`:
 *
 *   - `severity`            — `warning` by default (rename churn
 *                             is high — warn first, error later
 *                             once existing offenders are fixed).
 *   - `contracts_directory` — single string, directory basename
 *                             to scan (e.g. `Contracts`).
 *   - `repository_pattern`  — regex identifying repository
 *                             names (e.g. `/Repository$/`).
 */

declare(strict_types=1);

namespace Stackra\Architecture\Rules;

use Stackra\Architecture\Violations\Severity;
use Stackra\Architecture\Violations\Violation;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

/**
 * Enforce "repository contracts end in Interface".
 *
 * @final
 */
final class RepositoryInterfaceSuffixRule extends AbstractPathRule
{
    /**
     * Directories skipped when recursively walking for
     * `Contracts/` folders. Vendor code has its own conventions.
     */
    private const array EXCLUDED_DIRECTORIES = [
        'vendor',
        'node_modules',
        '.git',
        'storage',
        'bootstrap',
    ];

    /**
     * Stable dotted identifier.
     */
    public function id(): string
    {
        return 'architecture.repository_interface_suffix';
    }

    /**
     * One-line description surfaced by the reporter.
     */
    public function description(): string
    {
        return 'Repository contracts under Contracts/ must be named <Name>RepositoryInterface.';
    }

    /**
     * Rename churn is high — warn first, error later once
     * existing offenders are fixed.
     */
    protected function defaultSeverity(): Severity
    {
        return Severity::Warning;
    }

    /**
     * Walk candidate app roots + `packages/{name}/src/`
     * directories for `Contracts/` folders and flag every
     * repository file whose name is missing the `Interface`
     * suffix.
     *
     * @param  string          $root  Absolute scan-root path.
     * @return list<Violation>        Zero or more violations.
     */
    public function check(string $root): array
    {
        // Read config with strict typing. Missing / malformed
        // config → rule no-ops.
        $contractsDir = $this->config['contracts_directory'] ?? null;
        if (! is_string($contractsDir) || $contractsDir === '') {
            return [];
        }

        $repositoryPattern = $this->config['repository_pattern'] ?? null;
        if (! is_string($repositoryPattern) || $repositoryPattern === '') {
            return [];
        }

        $violations = [];

        // Collect every directory under which we should look
        // for `Contracts/` folders — both candidate app roots
        // AND (if present) the monorepo's `packages/*/src/`.
        $searchRoots = [];
        foreach ($this->candidateAppRoots($root) as $appRoot) {
            $searchRoots[] = $appRoot;
        }
        foreach ($this->packageSourceRoots($root) as $packageSrc) {
            $searchRoots[] = $packageSrc;
        }

        foreach ($searchRoots as $searchRoot) {
            foreach ($this->findContractsDirectories($searchRoot, $contractsDir) as $contractsPath) {
                foreach ($this->scanContractsDirectory($contractsPath, $repositoryPattern) as $violation) {
                    $violations[] = $violation;
                }
            }
        }

        return $violations;
    }

    /**
     * Iterate every `.php` file inside a `Contracts/` directory
     * (recursively — the folder can be organised by domain) and
     * yield a violation for each filename that matches the
     * repository pattern but lacks the `Interface` suffix.
     *
     * @return \Generator<int, Violation>
     */
    private function scanContractsDirectory(string $contractsPath, string $repositoryPattern): \Generator
    {
        $iterator = $this->createRecursiveIterator($contractsPath);
        if ($iterator === null) {
            return;
        }

        foreach ($iterator as $entry) {
            /** @var \SplFileInfo $entry */
            if (! $entry->isFile()) {
                continue;
            }
            if ($entry->getExtension() !== 'php') {
                continue;
            }

            // Filename WITHOUT the `.php` extension is what the
            // regex is compared against. E.g. `UserRepository`,
            // `OrderRepositoryInterface`.
            $basenameNoExt = $entry->getBasename('.' . $entry->getExtension());

            // Does the filename look like a repository? Silence
            // preg errors — a bad regex from config should
            // no-op, not crash.
            $matches = @preg_match($repositoryPattern, $basenameNoExt);
            if ($matches !== 1) {
                continue;
            }

            // Already ends in `Interface` → correct convention,
            // skip.
            if (str_ends_with($basenameNoExt, 'Interface')) {
                continue;
            }

            yield $this->violation(
                filePath: $entry->getPathname(),
                offender: $basenameNoExt,
                message: sprintf(
                    'Repository contract "%s" under Contracts/ is missing the "Interface" suffix — expected "%sInterface".',
                    $basenameNoExt,
                    $basenameNoExt,
                ),
                hint: 'Repository contracts must be named `<Name>RepositoryInterface`. Follow Magento 2 / Laravel convention.',
            );
        }
    }

    /**
     * Recursively find every directory named `$contractsDir`
     * (case-sensitive) under `$searchRoot`. Yields absolute
     * paths.
     *
     * @return \Generator<int, string>
     */
    private function findContractsDirectories(string $searchRoot, string $contractsDir): \Generator
    {
        $iterator = $this->createRecursiveIterator($searchRoot);
        if ($iterator === null) {
            return;
        }

        foreach ($iterator as $entry) {
            /** @var \SplFileInfo $entry */
            if (! $entry->isDir()) {
                continue;
            }

            if ($entry->getFilename() === $contractsDir) {
                yield $entry->getPathname();
            }
        }
    }

    /**
     * Build a recursive iterator that skips the excluded
     * directory names (`vendor`, `node_modules`, `.git`, …).
     * Returns `null` when `$path` is not a readable directory.
     */
    private function createRecursiveIterator(string $path): ?RecursiveIteratorIterator
    {
        if (! is_dir($path)) {
            return null;
        }

        try {
            $directoryIterator = new RecursiveDirectoryIterator(
                $path,
                RecursiveDirectoryIterator::SKIP_DOTS,
            );

            // Filter out excluded directory names BEFORE the
            // recursive walk descends into them — cheaper than
            // filtering the outer iterator.
            $filter = new \RecursiveCallbackFilterIterator(
                $directoryIterator,
                function (\SplFileInfo $current): bool {
                    if ($current->isDir() && \in_array($current->getFilename(), self::EXCLUDED_DIRECTORIES, true)) {
                        return false;
                    }

                    return true;
                },
            );

            return new RecursiveIteratorIterator(
                $filter,
                RecursiveIteratorIterator::SELF_FIRST,
            );
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Yield `packages/{name}/src/` directories, i.e. every
     * direct child of `<workspace>/packages/` that has a
     * `src/` folder. `<workspace>` is derived by walking one
     * directory up from `$root`, which matches the monorepo
     * layout where `paths` is configured as `base_path('apps')`.
     *
     * Falls back to yielding nothing when there is no sibling
     * `packages/` directory — the rule then only covers
     * candidate app roots.
     *
     * @return \Generator<int, string>
     */
    private function packageSourceRoots(string $root): \Generator
    {
        // Try the parent-of-root first (matches `paths = apps/`
        // with `packages/` next to it), then `$root` itself
        // (single-app layout where `packages/` lives inside).
        $candidates = [
            \dirname($root) . DIRECTORY_SEPARATOR . 'packages',
            $root . DIRECTORY_SEPARATOR . 'packages',
        ];

        foreach ($candidates as $packagesDir) {
            if (! is_dir($packagesDir)) {
                continue;
            }

            $entries = @scandir($packagesDir);
            if ($entries === false) {
                continue;
            }

            foreach ($entries as $entry) {
                if ($entry === '.' || $entry === '..') {
                    continue;
                }

                $srcDir = $packagesDir . DIRECTORY_SEPARATOR . $entry . DIRECTORY_SEPARATOR . 'src';
                if (is_dir($srcDir)) {
                    yield $srcDir;
                }
            }
        }
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
