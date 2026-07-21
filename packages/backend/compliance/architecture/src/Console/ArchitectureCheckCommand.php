<?php

/**
 * @file packages/architecture/src/Console/ArchitectureCheckCommand.php
 *
 * @description
 * Artisan command: `stackra:architecture:check`.
 *
 * Runs the {@see CodebaseScanner} over the configured paths and
 * pretty-prints every {@see Violation}. Exits non-zero when at
 * least one `Error`-severity violation was found.
 *
 * ## Options
 *
 *   - `--path=<dir>` (repeatable) — override the configured paths.
 *     Useful for `git diff` integrations that want to scan only
 *     the changed subtree.
 *
 *   - `--json` — emit newline-delimited JSON instead of the
 *     pretty output. Feed straight into a CI annotation
 *     collector.
 *
 *   - `--warnings-as-errors` — flip every violation to `Error`
 *     severity for the current run. Handy when you want to
 *     bootstrap a strict-mode migration.
 *
 * ## CI integration
 *
 * Add this to CI:
 *
 *     php artisan stackra:architecture:check
 *
 * When violations are found, the command prints them and exits
 * with code 1. When the codebase is clean, exit code 0. That's
 * the whole surface CI needs.
 */

declare(strict_types=1);

namespace Stackra\Architecture\Console;

use Stackra\Architecture\Contracts\ArchitectureRule;
use Stackra\Architecture\Contracts\PathRule;
use Stackra\Architecture\Scanner\CodebaseScanner;
use Stackra\Architecture\Support\SourceFileParser;
use Stackra\Architecture\Violations\Severity;
use Stackra\Architecture\Violations\Violation;
use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Throwable;

#[AsCommand(
    name: 'stackra:architecture:check',
    description: 'Verify architectural layering rules across the configured source paths.',
)]
final class ArchitectureCheckCommand extends BaseCommand
{
    /**
     * Signature — `signature` short-forms mirror the docblock
     * options. Kept in sync with the class docblock.
     */
    protected $signature = 'stackra:architecture:check
        {--path=* : Override the scan paths (absolute or workspace-relative)}
        {--json : Emit newline-delimited JSON instead of the pretty report}
        {--warnings-as-errors : Treat every violation as an error for this run}';

    /**
     * Command entry point. Dependencies are method-injected — the
     * console kernel resolves each type-hinted parameter from the
     * container when it invokes ``handle()`` via {@see \Illuminate\Container\Container::call()}.
     * See laravel.com/docs/artisan#dependency-injection.
     *
     * Method injection over constructor injection because:
     *
     *   * Commands are instantiated eagerly by the console kernel to
     *     discover their names. Constructor DI resolves every service
     *     even for ``php artisan list`` — wasteful when the command
     *     never runs.
     *   * Method DI defers resolution to the run itself.
     *   * Tests pass mocks straight into ``handle()`` instead of
     *     rebuilding the container.
     *
     * Returns POSIX exit code:
     *   - 0 → clean run.
     *   - 1 → at least one Error-severity violation.
     *   - 2 → operator error (unusable configuration).
     *
     * @param  iterable<ArchitectureRule>  $sourceRules  Source-scan rules from the tagged binding.
     * @param  iterable<PathRule>          $pathRules    Path-scan rules from the tagged binding.
     * @param  SourceFileParser            $parser       Shared parser instance.
     */
    public function handle(
        iterable $sourceRules,
        iterable $pathRules,
        SourceFileParser $parser,
    ): int {
        $this->omni->titleBar('Architecture Check', 'sky');

        $paths = $this->resolveScanPaths();
        if ($paths === []) {
            $this->omni->error('No scan paths configured. Set `architecture.paths` in config.');

            return 2;
        }

        $excludes = (array) config('architecture.excludes', ['vendor', 'node_modules', 'storage', '.git']);

        $scanner = new CodebaseScanner(
            parser: $parser,
            sourceRules: iterator_to_array($this->normaliseSourceRules($sourceRules)),
            pathRules: iterator_to_array($this->normalisePathRules($pathRules)),
            paths: $paths,
            excludes: array_values(array_filter($excludes, is_string(...))),
        );

        try {
            $violations = $this->omni->task(
                \sprintf('Scanning %d path(s)', \count($paths)),
                static fn (): array => [
                    'state' => 'success',
                    'message' => 'scanned',
                    'violations' => $scanner->scan(),
                ],
            );
        } catch (Throwable $throwable) {
            $this->omni->error('Scan aborted: ' . $throwable->getMessage());

            return 2;
        }

        // The task returned a TaskResult wrapping the violations —
        // unwrap it. `task()` returns `false` only on abort; the
        // catch above already handles the exception path.
        /** @var list<Violation> $violations */
        $violations = $violations === false ? [] : ($violations->data['violations'] ?? []);

        if ($this->option('warnings-as-errors')) {
            $violations = $this->escalateAll($violations);
        }

        $this->option('json')
            ? $this->emitJson($violations)
            : $this->emitPretty($violations);

        $failed = CodebaseScanner::hasFailures($violations);
        $this->showDuration();

        return $failed ? 1 : 0;
    }

    // -----------------------------------------------------------------
    // Setup helpers.
    // -----------------------------------------------------------------

    /**
     * Union of `--path` CLI overrides + config paths, normalised
     * to absolute paths. Duplicates are dropped.
     *
     * @return list<string>
     */
    private function resolveScanPaths(): array
    {
        /** @var list<string> $cli */
        $cli = array_values(array_filter((array) $this->option('path'), is_string(...)));

        $fromConfig = (array) config('architecture.paths', []);
        /** @var list<string> $configured */
        $configured = array_values(array_filter($fromConfig, is_string(...)));

        $all = $cli !== [] ? $cli : $configured;

        $absolute = [];
        $seen = [];
        foreach ($all as $entry) {
            $real = realpath($entry);
            if ($real === false || isset($seen[$real])) {
                continue;
            }

            $seen[$real] = true;
            $absolute[] = $real;
        }

        return $absolute;
    }

    /**
     * The container may hand us tagged iterables in any order.
     * Sort by `id()` so the reporter's grouping is stable across
     * runs.
     *
     * @param  iterable<ArchitectureRule>  $rules
     *
     * @return \Generator<int, ArchitectureRule>
     */
    private function normaliseSourceRules(iterable $rules): \Generator
    {
        /** @var list<ArchitectureRule> $collected */
        $collected = [];
        foreach ($rules as $rule) {
            $collected[] = $rule;
        }

        usort($collected, static fn (ArchitectureRule $a, ArchitectureRule $b): int
            => strcmp($a->id(), $b->id()));

        foreach ($collected as $rule) {
            yield $rule;
        }
    }

    /**
     * Same as {@see normaliseSourceRules()} for the path-rule
     * iterable. Kept separate so the concrete rule type is preserved
     * for static analysers.
     *
     * @param  iterable<PathRule>  $rules
     *
     * @return \Generator<int, PathRule>
     */
    private function normalisePathRules(iterable $rules): \Generator
    {
        /** @var list<PathRule> $collected */
        $collected = [];
        foreach ($rules as $rule) {
            $collected[] = $rule;
        }

        usort($collected, static fn (PathRule $a, PathRule $b): int
            => strcmp($a->id(), $b->id()));

        foreach ($collected as $rule) {
            yield $rule;
        }
    }

    /**
     * Rebuild every violation with `Severity::Error` when
     * `--warnings-as-errors` is set. Doesn't mutate — creates
     * fresh {@see Violation} records so the escalated flag is
     * scoped to this run.
     *
     * @param  list<Violation>  $violations
     *
     * @return list<Violation>
     */
    private function escalateAll(array $violations): array
    {
        $escalated = [];
        foreach ($violations as $violation) {
            $escalated[] = new Violation(
                ruleId: $violation->ruleId,
                severity: Severity::Error,
                filePath: $violation->filePath,
                offender: $violation->offender,
                message: $violation->message,
                line: $violation->line,
                hint: $violation->hint,
            );
        }

        return $escalated;
    }

    // -----------------------------------------------------------------
    // Output helpers.
    // -----------------------------------------------------------------

    /**
     * Newline-delimited JSON, one violation per line. Deliberately
     * NOT a JSON array — CI parsers can stream this without
     * buffering the full report.
     *
     * NOTE: this method intentionally uses ``$this->line()`` (raw
     * Symfony output) instead of ``$this->omni->render()``. The JSON
     * emitter is a machine-readable transport; wrapping each line in
     * OmniTerm's HTML/ANSI formatting would break every downstream
     * parser (jq, GitHub annotations, etc.).
     *
     * @param  list<Violation>  $violations
     */
    private function emitJson(array $violations): void
    {
        foreach ($violations as $violation) {
            $json = json_encode($violation->toArray(), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            if ($json !== false) {
                $this->line($json);
            }
        }
    }

    /**
     * Human-readable output — grouped by rule id, rendered through
     * OmniTerm so the output stays visually consistent with every
     * other Stackra command.
     *
     * @param  list<Violation>  $violations
     */
    private function emitPretty(array $violations): void
    {
        if ($violations === []) {
            $this->omni->success('Architecture check passed. No violations found.');

            return;
        }

        // Group by rule id — the reporter's stable primary key.
        /** @var array<string, list<Violation>> $byRule */
        $byRule = [];
        foreach ($violations as $violation) {
            $byRule[$violation->ruleId][] = $violation;
        }
        ksort($byRule);

        $errorCount = 0;
        $warningCount = 0;

        foreach ($byRule as $ruleId => $ruleViolations) {
            $this->omni->newLine();
            $this->omni->divider(
                \sprintf('%s — %d violation(s)', $ruleId, \count($ruleViolations)),
                'text-fuchsia-400',
            );

            foreach ($ruleViolations as $violation) {
                $severityMarker = $violation->severity === Severity::Error
                    ? '<span class="text-red-500 font-bold">ERROR</span>'
                    : '<span class="text-amber-400">WARNING</span>';

                $location = $violation->line !== null
                    ? \sprintf('%s:%d', $this->workspaceRelative($violation->filePath), $violation->line)
                    : $this->workspaceRelative($violation->filePath);

                $this->omni->render(\sprintf(
                    '<div class="ml-1"> • %s  <span class="text-white">%s</span></div>',
                    $severityMarker,
                    htmlspecialchars($location, ENT_QUOTES),
                ));
                $this->omni->render(\sprintf(
                    '<div class="ml-4 text-white">%s</div>',
                    htmlspecialchars($violation->message, ENT_QUOTES),
                ));
                $this->omni->render(\sprintf(
                    '<div class="ml-4 text-zinc-500">offender: <span class="text-zinc-300">%s</span></div>',
                    htmlspecialchars($violation->offender, ENT_QUOTES),
                ));

                if ($violation->hint !== null) {
                    $this->omni->render(\sprintf(
                        '<div class="ml-4 text-cyan-400">hint: %s</div>',
                        htmlspecialchars($violation->hint, ENT_QUOTES),
                    ));
                }

                if ($violation->severity === Severity::Error) {
                    $errorCount++;
                } else {
                    $warningCount++;
                }
            }
        }

        $this->omni->newLine();

        if ($errorCount > 0) {
            $this->omni->error(\sprintf(
                'Architecture check failed: %d error(s), %d warning(s).',
                $errorCount,
                $warningCount,
            ));
        } else {
            $this->omni->warning(\sprintf(
                'Architecture check passed with %d warning(s).',
                $warningCount,
            ));
        }
    }

    /**
     * Shorten an absolute file path to a workspace-relative one
     * when the file is inside the current working directory.
     * Falls back to the absolute path when it isn't.
     */
    private function workspaceRelative(string $path): string
    {
        $cwd = getcwd();
        if ($cwd === false) {
            return $path;
        }

        if (str_starts_with($path, $cwd . DIRECTORY_SEPARATOR)) {
            return substr($path, strlen($cwd) + 1);
        }

        return $path;
    }
}
