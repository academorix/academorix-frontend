<?php

/**
 * @file packages/architecture/src/Rules/NoRouteFacadeRule.php
 *
 * @description
 * Source rule: forbids the use of Laravel's `Route::` facade
 * anywhere in the codebase. Every URL in Stackra is declared
 * via controller attributes (`#[AsController]` + `#[Get]`,
 * `#[Post]`, `#[Put]`, `#[Patch]`, `#[Delete]`, …). Route
 * discovery lives in the routing package and consumes those
 * attributes at boot; `Route::` calls scattered elsewhere drift
 * out of sync with the attribute-driven graph and cause silent
 * "route missing" bugs.
 *
 * ## What it catches
 *
 * A regex scan of {@see SourceFile::$strippedContent} for any
 * of the common `Route::` method calls:
 *
 *   - `Route::get(...)`, `Route::post(...)`, `Route::put(...)`,
 *     `Route::patch(...)`, `Route::delete(...)`, `Route::options(...)`.
 *   - `Route::any(...)`, `Route::match(...)`.
 *   - `Route::resource(...)`, `Route::apiResource(...)`.
 *   - `Route::group(...)`.
 *
 * Stripped content is used so example `Route::get` snippets in
 * docblocks / comments don't trigger false positives. Each
 * unique LINE where a matching call appears produces one
 * violation.
 *
 * ## Config
 *
 * `config('architecture.rules.no_route_facade')`:
 *
 *   - `severity`  — `error` by default.
 */

declare(strict_types=1);

namespace Stackra\Architecture\Rules;

use Stackra\Architecture\Support\SourceFile;
use Stackra\Architecture\Violations\Severity;
use Stackra\Architecture\Violations\Violation;

/**
 * Ban the `Route::` facade.
 *
 * @final
 */
final class NoRouteFacadeRule extends AbstractRule
{
    /**
     * Regex matching a `Route::` facade call for any of the
     * HTTP-verb / grouping helpers. The verbs are enumerated
     * explicitly rather than accepting `\w+` — a wildcard would
     * over-match unrelated `Route::` helpers (e.g.
     * `Route::currentRouteName()` in a controller is fine).
     */
    private const string ROUTE_FACADE_REGEX =
        '/\bRoute::(get|post|put|patch|delete|options|any|match|resource|apiResource|group)\s*\(/';

    /**
     * Stable dotted identifier. Do not rename once shipped.
     */
    public function id(): string
    {
        return 'architecture.no_route_facade';
    }

    /**
     * One-line description surfaced by the reporter.
     */
    public function description(): string
    {
        return 'Route:: facade calls are banned. Every URL is declared via #[AsController] + #[Get] / #[Post] / etc.';
    }

    /**
     * Route drift is a silent-404 bug at runtime. Fail CI hard.
     */
    protected function defaultSeverity(): Severity
    {
        return Severity::Error;
    }

    /**
     * Regex-scan the stripped content and emit a violation for
     * every unique line where a `Route::` call appears.
     *
     * @param  SourceFile     $file  Parsed source file.
     * @return list<Violation>       Zero or more violations, deduped by line.
     */
    public function check(SourceFile $file): array
    {
        // Prefer stripped content so documentation example
        // snippets in docblocks / comments don't fire.
        $content = $file->strippedContent;

        // Bail early when the pattern doesn't appear at all —
        // a plain `strpos` check is faster than the regex.
        if (\strpos($content, 'Route::') === false) {
            return [];
        }

        if (\preg_match_all(self::ROUTE_FACADE_REGEX, $content, $matches, \PREG_OFFSET_CAPTURE) === false) {
            return [];
        }

        if (! isset($matches[0]) || $matches[0] === []) {
            return [];
        }

        $violations = [];
        // Dedupe by line — chained `Route::group(...)->group(...)`
        // on one line only fires once.
        $seenLines = [];

        foreach ($matches[0] as $match) {
            /** @var array{0: string, 1: int} $match */
            $token = $match[0];
            $offset = $match[1];
            $line = $this->lineForOffset($content, $offset);

            if (isset($seenLines[$line])) {
                continue;
            }
            $seenLines[$line] = true;

            $violations[] = $this->violation(
                file: $file,
                offender: \rtrim($token, '('),
                message: \sprintf(
                    '`%s` call in %s — the Route facade is banned; declare the URL on a controller instead.',
                    \rtrim($token, '('),
                    $file->classFqcn ?? $file->path,
                ),
                line: $line,
                hint: 'Move each route into a controller decorated with #[AsController] + #[Get] / #[Post] / etc.',
            );
        }

        return $violations;
    }

    /**
     * Translate a byte offset within the file content into a
     * 1-indexed line number by counting `\n` bytes.
     */
    private function lineForOffset(string $content, int $offset): int
    {
        if ($offset <= 0) {
            return 1;
        }

        return \substr_count($content, "\n", 0, $offset) + 1;
    }
}
