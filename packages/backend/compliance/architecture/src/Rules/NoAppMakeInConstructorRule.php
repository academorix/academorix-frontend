<?php

/**
 * @file packages/architecture/src/Rules/NoAppMakeInConstructorRule.php
 *
 * @description
 * Source rule: forbids `app()->make(...)` and `resolve(...)`
 * inside a class constructor. Service-Locator inside a
 * constructor is dangerous for two reasons:
 *
 *   1. It hides the dependency from the type system — mocking
 *      and test-doubles fall apart because the constructor
 *      signature doesn't reveal what the class needs.
 *
 *   2. Under Laravel Octane, a `#[Singleton]` constructor runs
 *      exactly ONCE per worker. `app()->make()` at that point
 *      resolves the container's boot-time bindings and captures
 *      that instance for every subsequent request the worker
 *      serves — even request-scoped services get frozen.
 *
 * ## What it catches
 *
 * When the file declares a `__construct` method, extract the
 * constructor's body (using a brace-matching helper) and regex-
 * scan for `app()->make(` or `resolve(`. Each match on a
 * distinct line produces one violation.
 *
 * If the brace-matching gets confused (extremely unusual for
 * hand-written code), we fall back to scanning the WHOLE
 * stripped file content — stricter but safe. False positives
 * in that fallback are considered acceptable because the
 * pattern is a code smell everywhere, not just in constructors.
 *
 * ## Config
 *
 * `config('architecture.rules.no_app_make_in_constructor')`:
 *
 *   - `severity`  — `error` by default.
 */

declare(strict_types=1);

namespace Stackra\Architecture\Rules;

use Stackra\Architecture\Support\SourceFile;
use Stackra\Architecture\Violations\Severity;
use Stackra\Architecture\Violations\Violation;

/**
 * Ban `app()->make()` / `resolve()` inside constructors.
 *
 * @final
 */
final class NoAppMakeInConstructorRule extends AbstractRule
{
    /**
     * Regex matching either `app()->make(` (any whitespace) or
     * a top-level `resolve(` helper call. The `\b` word
     * boundary keeps class-methods named `resolve(` on the
     * class's own instance out of scope — we're only interested
     * in the global-namespace helper.
     */
    private const string SERVICE_LOCATOR_REGEX =
        '/\bapp\s*\(\s*\)\s*->\s*make\s*\(|(?<![\$>\w:])\bresolve\s*\(/';

    /**
     * Stable dotted identifier.
     */
    public function id(): string
    {
        return 'architecture.no_app_make_in_constructor';
    }

    /**
     * One-line description surfaced by the reporter.
     */
    public function description(): string
    {
        return 'Constructors must not use app()->make() or resolve() — inject dependencies via typed constructor parameters.';
    }

    /**
     * Hides dependencies from the type system and freezes
     * bindings on #[Singleton] classes. Fail CI.
     */
    protected function defaultSeverity(): Severity
    {
        return Severity::Error;
    }

    /**
     * Extract the constructor body (if any) and regex-scan it
     * for forbidden service-locator calls. Fall back to
     * whole-file scan when brace matching fails.
     *
     * @param  SourceFile     $file  Parsed source file.
     * @return list<Violation>       Zero or more violations.
     */
    public function check(SourceFile $file): array
    {
        // No constructor — nothing to check.
        if ($file->findMethod('__construct') === null) {
            return [];
        }

        // Attempt to isolate just the constructor body. On
        // success the scan is precise; on failure we fall back
        // to the whole stripped content (stricter but safe).
        [$scanContent, $scanOffset] = $this->extractConstructorBody($file);

        if ($scanContent === '') {
            return [];
        }

        if (\preg_match_all(self::SERVICE_LOCATOR_REGEX, $scanContent, $matches, \PREG_OFFSET_CAPTURE) === false) {
            return [];
        }

        if (! isset($matches[0]) || $matches[0] === []) {
            return [];
        }

        $violations = [];
        $seenLines = [];

        foreach ($matches[0] as $match) {
            /** @var array{0: string, 1: int} $match */
            $token = \trim($match[0], " \t\r\n");
            // Translate the match offset (within the extracted
            // constructor body) back into the file's global
            // offset so line numbers line up with the source.
            $globalOffset = $scanOffset + $match[1];
            $line = $this->lineForOffset($file->strippedContent, $globalOffset);

            if (isset($seenLines[$line])) {
                continue;
            }
            $seenLines[$line] = true;

            $violations[] = $this->violation(
                file: $file,
                offender: $token,
                message: \sprintf(
                    'Constructor of "%s" uses "%s" — service-locate through the container instead of typed parameters.',
                    $file->classFqcn ?? $file->path,
                    $token,
                ),
                line: $line,
                hint: 'Type-hint the dependency in the constructor signature. `app()->make()` in a #[Singleton] constructor captures a boot-time instance.',
            );
        }

        return $violations;
    }

    /**
     * Return the constructor body plus the offset at which it
     * starts inside `$file->strippedContent`, so match offsets
     * translate back to file-level line numbers.
     *
     * Falls back to `[stripped, 0]` (whole-file scan) when the
     * brace matcher can't find a clean body. That's safe — the
     * pattern is a code smell everywhere, not just in the
     * constructor.
     *
     * @return array{0: string, 1: int}
     */
    private function extractConstructorBody(SourceFile $file): array
    {
        $content = $file->strippedContent;

        // Find the constructor keyword. We look for `function`
        // followed by whitespace and `__construct` so plain
        // string matches on the identifier alone don't fool us.
        if (\preg_match('/\bfunction\s+__construct\b/i', $content, $m, \PREG_OFFSET_CAPTURE) !== 1) {
            return [$content, 0];
        }

        $keywordEnd = $m[0][1] + \strlen($m[0][0]);

        // Match the constructor's opening paren, then its
        // matching close.
        $signatureOpenParen = \strpos($content, '(', $keywordEnd);
        if ($signatureOpenParen === false) {
            return [$content, 0];
        }

        $signatureClose = $this->matchDelimiter($content, $signatureOpenParen, '(', ')');
        if ($signatureClose === null) {
            return [$content, 0];
        }

        // The body may be preceded by return-type declarations
        // (`: void`, `: static`) — skip whitespace and any
        // non-brace characters until we hit `{` or `;`.
        $bodyOpenBrace = null;
        $length = \strlen($content);
        for ($i = $signatureClose + 1; $i < $length; $i++) {
            $char = $content[$i];
            if ($char === '{') {
                $bodyOpenBrace = $i;
                break;
            }
            if ($char === ';') {
                // Abstract / interface declaration — no body.
                return ['', 0];
            }
        }

        if ($bodyOpenBrace === null) {
            return [$content, 0];
        }

        $bodyClose = $this->matchDelimiter($content, $bodyOpenBrace, '{', '}');
        if ($bodyClose === null) {
            return [$content, 0];
        }

        $bodyStart = $bodyOpenBrace + 1;
        $bodyLength = $bodyClose - $bodyStart;
        if ($bodyLength <= 0) {
            return ['', 0];
        }

        return [\substr($content, $bodyStart, $bodyLength), $bodyStart];
    }

    /**
     * Walk from `$startOffset` (which points at `$open`) and
     * return the offset of the matching `$close`. Naive
     * brace-counter — good enough for well-formed PHP because
     * comments and strings have been stripped upstream. Returns
     * `null` when no match is found.
     */
    private function matchDelimiter(string $content, int $startOffset, string $open, string $close): ?int
    {
        $depth = 0;
        $length = \strlen($content);

        for ($i = $startOffset; $i < $length; $i++) {
            $char = $content[$i];
            if ($char === $open) {
                $depth++;
            } elseif ($char === $close) {
                $depth--;
                if ($depth === 0) {
                    return $i;
                }
            }
        }

        return null;
    }

    /**
     * Translate a byte offset within the file content into a
     * 1-indexed line number.
     */
    private function lineForOffset(string $content, int $offset): int
    {
        if ($offset <= 0) {
            return 1;
        }

        return \substr_count($content, "\n", 0, $offset) + 1;
    }
}
