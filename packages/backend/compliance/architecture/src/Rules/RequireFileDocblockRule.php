<?php

/**
 * @file packages/architecture/src/Rules/RequireFileDocblockRule.php
 *
 * @description
 * Source rule: every PHP file must begin with a header docblock
 * that answers "what is this file, and why does it exist?"
 * carrying at minimum `@file` and `@description` tags. The
 * header docblock is the entry point for a new reader — one
 * skim of the top of the file should orient them before they
 * dive into the code.
 *
 * ## What it catches
 *
 * The rule scans the FIRST ~30 lines of the raw file content
 * for a `/** ... *\/` docblock that contains each of the
 * configured `required_tags` (`@file`, `@description` by
 * default). Missing any required tag — or missing the docblock
 * entirely — produces one violation.
 *
 * ## What it skips
 *
 * Files whose absolute path contains any of the `exempt_paths`
 * substrings. Config files, bootstrap files, and migrations
 * default to exempt — the ceremony there is noise.
 *
 * ## Severity
 *
 * Warning by default — this is a hygiene rule, not a
 * correctness rule. Failing CI on a missing docblock generates
 * more churn than it saves; developers see the warning and fix
 * it on next touch.
 *
 * ## Config
 *
 * `config('architecture.rules.require_file_docblock')`:
 *
 *   - `severity`       — `warning` by default.
 *   - `required_tags`  — list of tag strings (e.g. `@file`,
 *                        `@description`) the docblock must
 *                        contain.
 *   - `exempt_paths`   — list of path substrings that mark a
 *                        file as exempt.
 */

declare(strict_types=1);

namespace Stackra\Architecture\Rules;

use Stackra\Architecture\Support\SourceFile;
use Stackra\Architecture\Violations\Severity;
use Stackra\Architecture\Violations\Violation;

/**
 * Require a file-header docblock with @file + @description.
 *
 * @final
 */
final class RequireFileDocblockRule extends AbstractRule
{
    /**
     * How many lines from the top of the file to inspect when
     * searching for the header docblock. 30 is generous enough
     * to accommodate long file-level descriptions while still
     * bounding the work per file.
     */
    private const int HEADER_LINE_BUDGET = 30;

    /**
     * Stable dotted identifier.
     */
    public function id(): string
    {
        return 'architecture.require_file_docblock';
    }

    /**
     * One-line description surfaced by the reporter.
     */
    public function description(): string
    {
        return 'Every PHP source file must begin with a header docblock carrying @file and @description tags.';
    }

    /**
     * Warning by default — hygiene rule, not a correctness rule.
     * We surface it so developers see it, but don't block CI on
     * it unless the app explicitly bumps the severity.
     */
    protected function defaultSeverity(): Severity
    {
        return Severity::Warning;
    }

    /**
     * Look at the top of the file for a docblock containing all
     * required tags. Skip files matching any `exempt_paths`
     * substring.
     *
     * @param  SourceFile     $file  Parsed source file.
     * @return list<Violation>       Empty when clean; one entry when missing.
     */
    public function check(SourceFile $file): array
    {
        // Config-driven exemptions. Path substring match — the
        // config supplies fragments like `/config/`, not full
        // prefixes, so we use `str_contains`.
        foreach ($this->listOfStrings($this->config['exempt_paths'] ?? []) as $needle) {
            if (\str_contains($file->path, $needle)) {
                return [];
            }
        }

        // Which tags must the docblock contain? When the list is
        // empty the rule has nothing to enforce — no-op.
        $requiredTags = $this->listOfStrings($this->config['required_tags'] ?? []);
        if ($requiredTags === []) {
            return [];
        }

        // Read the first HEADER_LINE_BUDGET lines. We split on
        // `\n` because raw content preserves the file's
        // original line endings, and the LF byte is the shared
        // separator across Windows / Unix files.
        $header = $this->extractHeader($file->rawContent);

        // Extract the first docblock in the header, if any.
        // Regex looks for `/**` ... `*/` non-greedily so nested
        // stars don't over-match.
        $docblock = $this->extractFirstDocblock($header);

        // Missing docblock — surface a single violation.
        if ($docblock === null) {
            return [
                $this->violation(
                    file: $file,
                    offender: $file->classFqcn ?? $file->path,
                    message: 'File is missing a header docblock.',
                    line: 1,
                    hint: 'Add a file header docblock with @file and @description tags at the top of the file.',
                ),
            ];
        }

        // Present — check each required tag. Missing any of them
        // is a single violation naming the specific gaps.
        $missing = [];
        foreach ($requiredTags as $tag) {
            if (! \str_contains($docblock, $tag)) {
                $missing[] = $tag;
            }
        }

        if ($missing === []) {
            return [];
        }

        return [
            $this->violation(
                file: $file,
                offender: $file->classFqcn ?? $file->path,
                message: \sprintf(
                    'File header docblock is missing required tag(s): %s.',
                    \implode(', ', $missing),
                ),
                line: 1,
                hint: 'Add a file header docblock with @file and @description tags at the top of the file.',
            ),
        ];
    }

    /**
     * Return the first {@see HEADER_LINE_BUDGET} lines of the
     * file content, joined back with newlines. Keeps the
     * regex work bounded per file.
     */
    private function extractHeader(string $rawContent): string
    {
        // Split on any newline; `explode` with the LF byte is
        // enough — CRLF ends up as `\r\n` and the trailing `\r`
        // stays on the previous line, which is harmless for a
        // substring match.
        $lines = \explode("\n", $rawContent);
        $header = \array_slice($lines, 0, self::HEADER_LINE_BUDGET);

        return \implode("\n", $header);
    }

    /**
     * Extract the first `/** ... *\/` docblock from a chunk of
     * source text. Returns `null` when no docblock is present.
     * Non-greedy on the inner content so consecutive docblocks
     * don't run together.
     */
    private function extractFirstDocblock(string $source): ?string
    {
        // The regex uses the `s` flag so `.` matches newlines
        // inside the docblock body — docblocks span multiple
        // lines by nature.
        if (\preg_match('#/\*\*.*?\*/#s', $source, $matches) === 1) {
            return $matches[0];
        }

        return null;
    }
}
