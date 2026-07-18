<?php

/**
 * @file packages/architecture/src/Rules/NoEnvOutsideConfigRule.php
 *
 * @description
 * Source rule: forbids `env(...)` calls anywhere outside of
 * config files (and a small allowlist of legitimate exceptions
 * such as database factories / seeders that use env() for
 * test-time database wiring).
 *
 * ## Why
 *
 * `env()` reads directly from PHP's `$_ENV` / getenv() every
 * time it's called. Under Laravel Octane, application boot
 * happens ONCE per worker; env values captured after boot are
 * frozen for the worker's lifetime. Any `env(...)` call outside
 * of a config file therefore either:
 *
 *   - Bypasses the config cache entirely (slower + drifts
 *     from `config:cache`), OR
 *   - Reads a stale value because the config cache is warm.
 *
 * Both failure modes are silent. The canonical pattern is to
 * read every environment variable via `config('foo.bar')` OR
 * the `#[Config('foo.bar')]` container attribute — that way the
 * value is captured at config-cache time, and rebuilding the
 * config cache is the ONE way to refresh it.
 *
 * ## What it catches
 *
 * A regex scan of the file's {@see SourceFile::$strippedContent}
 * for `\benv\s*\(` — the `env(` token, with any whitespace
 * between the identifier and the paren. Comments and docblocks
 * are stripped before scanning so example snippets in
 * documentation don't trigger false positives.
 *
 * Each unique LINE where `env(` appears produces one violation
 * — multiple calls on the same line only surface once, to keep
 * the reporter output readable.
 *
 * ## Config
 *
 * `config('architecture.rules.no_env_outside_config')`:
 *
 *   - `severity`      — `error` by default.
 *   - `exempt_paths`  — list of path substrings that mark a
 *                       file as exempt (e.g. `/config/`,
 *                       `/database/factories/`).
 */

declare(strict_types=1);

namespace Academorix\Architecture\Rules;

use Academorix\Architecture\Support\SourceFile;
use Academorix\Architecture\Violations\Severity;
use Academorix\Architecture\Violations\Violation;

/**
 * Forbid `env()` outside of config files.
 *
 * @final
 */
final class NoEnvOutsideConfigRule extends AbstractRule
{
    /**
     * Regex matching a bare `env(` identifier — the `\b` word
     * boundary keeps `preventEnv(`, `myEnv(`, and similar
     * false-friends out. Whitespace between the identifier and
     * paren is tolerated because PHP accepts it.
     */
    private const string ENV_CALL_REGEX = '/\benv\s*\(/';

    /**
     * Stable dotted identifier. Do not rename once shipped.
     */
    public function id(): string
    {
        return 'architecture.no_env_outside_config';
    }

    /**
     * One-line description surfaced by the reporter above the
     * violation group.
     */
    public function description(): string
    {
        return 'env() outside config/ bypasses the config cache under Octane — read via config() or #[Config] instead.';
    }

    /**
     * Silent correctness failure under Octane — worker reads a
     * stale value or bypasses the cache. Fail CI by default.
     */
    protected function defaultSeverity(): Severity
    {
        return Severity::Error;
    }

    /**
     * Scan the file's stripped content for `env(` calls and
     * emit a violation for each unique line. Files whose path
     * matches any `exempt_paths` substring skip the check.
     *
     * @param  SourceFile     $file  Parsed source file.
     * @return list<Violation>       Zero or more violations, one per unique line.
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

        // Prefer stripped content — this drops comments and
        // docblocks so example `env('APP_KEY')` snippets in
        // documentation don't trip the rule.
        $content = $file->strippedContent;

        // Find every match with its byte offset so we can turn
        // it into a 1-indexed line number. PREG_OFFSET_CAPTURE
        // returns `[match, offset]` tuples for each capture.
        if (\preg_match_all(self::ENV_CALL_REGEX, $content, $matches, \PREG_OFFSET_CAPTURE) === false) {
            return [];
        }

        if (! isset($matches[0]) || $matches[0] === []) {
            return [];
        }

        $violations = [];
        // Dedupe by line — one call site per line is enough.
        $seenLines = [];

        foreach ($matches[0] as $match) {
            /** @var array{0: string, 1: int} $match */
            $offset = $match[1];
            $line = $this->lineForOffset($content, $offset);

            if (isset($seenLines[$line])) {
                continue;
            }
            $seenLines[$line] = true;

            $violations[] = $this->violation(
                file: $file,
                offender: 'env(',
                message: \sprintf(
                    '`env()` call outside of config — %s reads the environment directly and bypasses the config cache.',
                    $file->classFqcn ?? $file->path,
                ),
                line: $line,
                hint: "Read the value via config('...') or #[Config('...')] injection. env() bypasses the config cache under Octane.",
            );
        }

        return $violations;
    }

    /**
     * Translate a byte offset within the file content into a
     * 1-indexed line number. Counting `\n` bytes up to the
     * offset is enough — CR-only files are effectively extinct
     * and CRLF files have the `\n` in the same column.
     */
    private function lineForOffset(string $content, int $offset): int
    {
        if ($offset <= 0) {
            return 1;
        }

        // substr_count is faster than looping when we only need
        // the count, not the positions.
        return \substr_count($content, "\n", 0, $offset) + 1;
    }
}
