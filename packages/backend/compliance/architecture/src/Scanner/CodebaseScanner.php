<?php

/**
 * @file packages/architecture/src/Scanner/CodebaseScanner.php
 *
 * @description
 * Orchestrator that walks every configured source root, parses each
 * `.php` file with {@see SourceFileParser}, and runs the registered
 * rules. Handles TWO rule flavours:
 *
 *   1. **Source rules** ({@see ArchitectureRule}) — inspect the
 *      parsed {@see SourceFile}. Run once per file.
 *   2. **Path rules** ({@see PathRule}) — inspect filesystem
 *      presence / absence. Run once per scan root (not per file),
 *      BEFORE the file iteration begins so they fail fast without
 *      opening a single `.php`.
 *
 * ## Traversal
 *
 * Uses `symfony/finder` for the directory walk — consistent
 * recursive iteration across every OS, built-in glob-style
 * exclusions (`vendor/`, `.git/`, `node_modules/`), ordered
 * iteration so violation output is deterministic across runs.
 *
 * ## Failure semantics
 *
 *   - A file that fails to parse yields ZERO violations and is
 *     skipped silently. Lint = false negatives on broken source
 *     are strictly better than false positives.
 *   - A rule that throws is caught and downgraded to a `Warning`
 *     violation attributed to the rule itself. Scan continues.
 */

declare(strict_types=1);

namespace Academorix\Architecture\Scanner;

use Academorix\Architecture\Contracts\ArchitectureRule;
use Academorix\Architecture\Contracts\PathRule;
use Academorix\Architecture\Support\SourceFileParser;
use Academorix\Architecture\Violations\Severity;
use Academorix\Architecture\Violations\Violation;
use Symfony\Component\Finder\Finder;
use Throwable;

/**
 * Walk a codebase and run every rule.
 *
 * @final
 */
final class CodebaseScanner
{
    /**
     * @param  SourceFileParser         $parser        Parses each file.
     * @param  list<ArchitectureRule>   $sourceRules   Rules that inspect a parsed SourceFile.
     * @param  list<PathRule>           $pathRules     Rules that inspect filesystem presence/absence.
     * @param  list<string>             $paths         Absolute directories to scan.
     * @param  list<string>             $excludes      Directory names to skip recursively.
     */
    public function __construct(
        private readonly SourceFileParser $parser,
        private readonly array $sourceRules,
        private readonly array $pathRules,
        private readonly array $paths,
        private readonly array $excludes,
    ) {
    }

    /**
     * Run the scan and return the flat violation list.
     *
     * @return list<Violation>
     */
    public function scan(): array
    {
        $violations = [];

        // Path rules first — they're fast and can fail before we
        // parse a single `.php` file.
        foreach ($this->paths as $root) {
            if (! is_dir($root)) {
                continue;
            }

            foreach ($this->pathRules as $rule) {
                try {
                    foreach ($rule->check($root) as $violation) {
                        $violations[] = $violation;
                    }
                } catch (Throwable $throwable) {
                    $violations[] = $this->wrapCrash($rule::class, $rule->id(), $root, $throwable);
                }
            }
        }

        // Source rules — walk every `.php` in the scan roots.
        foreach ($this->paths as $root) {
            if (! is_dir($root)) {
                continue;
            }

            $finder = (new Finder())
                ->files()
                ->in($root)
                ->name('*.php')
                ->sortByName();

            foreach ($this->excludes as $exclude) {
                $finder->exclude($exclude);
            }

            foreach ($finder as $fileInfo) {
                $source = $this->parser->parseFile($fileInfo->getRealPath());
                if ($source === null) {
                    continue;
                }

                foreach ($this->sourceRules as $rule) {
                    try {
                        foreach ($rule->check($source) as $violation) {
                            $violations[] = $violation;
                        }
                    } catch (Throwable $throwable) {
                        $violations[] = $this->wrapCrash(
                            ruleClass: $rule::class,
                            ruleId: $rule->id(),
                            filePath: $fileInfo->getRealPath(),
                            throwable: $throwable,
                        );
                    }
                }
            }
        }

        return $violations;
    }

    /**
     * `true` when any {@see Violation} in `$violations` carries an
     * `Error` severity. Used by the CLI to decide the exit code.
     *
     * @param  list<Violation>  $violations
     */
    public static function hasFailures(array $violations): bool
    {
        foreach ($violations as $violation) {
            if ($violation->severity->fails()) {
                return true;
            }
        }

        return false;
    }

    /**
     * Turn a rule crash into a soft warning attributed to the
     * broken rule. Keeps the scan running even when one rule has
     * a bug.
     */
    private function wrapCrash(
        string $ruleClass,
        string $ruleId,
        string $filePath,
        Throwable $throwable,
    ): Violation {
        return new Violation(
            ruleId: $ruleId,
            severity: Severity::Warning,
            filePath: $filePath,
            offender: $ruleClass,
            message: sprintf(
                'Rule "%s" threw an exception: %s',
                $ruleId,
                $throwable->getMessage(),
            ),
            line: null,
            hint: 'This is a bug in the rule itself. Report it with a reproduction case.',
        );
    }
}
