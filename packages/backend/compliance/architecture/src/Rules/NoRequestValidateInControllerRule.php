<?php

/**
 * @file packages/architecture/src/Rules/NoRequestValidateInControllerRule.php
 *
 * @description
 * Source rule: forbids `$request->validate([...])` /
 * `request()->validate([...])` inside Controller classes.
 *
 * ## Why
 *
 * Every controller in Stackra accepts a
 * `spatie/laravel-data` input DTO by type-hint. The container
 * validates the DTO before the `__invoke()` method runs — so
 * the controller body starts with a fully-typed, already-valid
 * request payload. Calling `$request->validate(...)` inside
 * the controller duplicates that validation, hides the wire
 * shape from static analysis, and re-introduces the "request
 * as untyped array" pattern the data-first architecture
 * exists to eliminate.
 *
 * ## What it catches
 *
 * For files the resolver classifies as {@see LayerType::Controller},
 * a regex scan of {@see SourceFile::$strippedContent} for:
 *
 *   - `$request->validate(...)`
 *   - `request()->validate(...)`
 *
 * Comments and docblocks are stripped before scanning so
 * documentation snippets don't cause false positives. Each
 * unique LINE produces one violation.
 *
 * ## Config
 *
 * `config('architecture.rules.no_request_validate_in_controller')`:
 *
 *   - `severity`  — `error` by default.
 */

declare(strict_types=1);

namespace Stackra\Architecture\Rules;

use Stackra\Architecture\Enums\LayerType;
use Stackra\Architecture\Support\SourceFile;
use Stackra\Architecture\Violations\Severity;
use Stackra\Architecture\Violations\Violation;

/**
 * Ban `$request->validate(...)` inside controllers.
 *
 * @final
 */
final class NoRequestValidateInControllerRule extends AbstractRule
{
    /**
     * Regex matching either the `$request->validate(` idiom or
     * the `request()->validate(` helper form. Whitespace around
     * the `->` and around the paren is tolerated.
     */
    private const string VALIDATE_CALL_REGEX =
        '/\$request\s*->\s*validate\s*\(|\brequest\s*\(\s*\)\s*->\s*validate\s*\(/';

    /**
     * Stable dotted identifier.
     */
    public function id(): string
    {
        return 'architecture.no_request_validate_in_controller';
    }

    /**
     * One-line description surfaced by the reporter.
     */
    public function description(): string
    {
        return 'Controllers must not call $request->validate() — type-hint a spatie/laravel-data DTO instead.';
    }

    /**
     * Bypasses the data-first typing story. Fail CI.
     */
    protected function defaultSeverity(): Severity
    {
        return Severity::Error;
    }

    /**
     * Regex-scan controller-layer files and emit a violation
     * per unique line.
     *
     * @param  SourceFile     $file  Parsed source file.
     * @return list<Violation>       Zero or more violations.
     */
    public function check(SourceFile $file): array
    {
        // Only Controllers are subject to this rule.
        if ($this->layers->resolve($file) !== LayerType::Controller) {
            return [];
        }

        $content = $file->strippedContent;

        // Cheap short-circuit — no `validate` substring at all
        // means nothing to match.
        if (\strpos($content, 'validate') === false) {
            return [];
        }

        if (\preg_match_all(self::VALIDATE_CALL_REGEX, $content, $matches, \PREG_OFFSET_CAPTURE) === false) {
            return [];
        }

        if (! isset($matches[0]) || $matches[0] === []) {
            return [];
        }

        $violations = [];
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
                offender: '$request->validate(',
                message: \sprintf(
                    'Controller "%s" calls $request->validate(...) — validation belongs on the injected Data DTO.',
                    $file->classFqcn ?? $file->path,
                ),
                line: $line,
                hint: 'Type-hint a spatie/laravel-data DTO in the controller signature. The container validates it before __invoke() runs.',
            );
        }

        return $violations;
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
