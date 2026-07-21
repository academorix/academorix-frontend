<?php

/**
 * @file packages/architecture/src/Rules/RequireStrictTypesRule.php
 *
 * @description
 * Source rule: every PHP file must declare `strict_types=1` at
 * the top. Strict types make PHP's scalar-coercion rules
 * predictable — integer arguments are integers, not "whatever
 * casts to int". Without strict_types, `''` becomes `0`,
 * numerical strings silently coerce, and the type system PHPStan
 * gives us loses half its value.
 *
 * ## What it catches
 *
 * A file whose opening tag is not followed (allowing for a file
 * docblock in between) by `declare(strict_types=1);` triggers
 * one violation.
 *
 * ## What it skips
 *
 * Files whose absolute path contains any of the `exempt_paths`
 * substrings — typically Laravel's `/config/` and `/bootstrap/`
 * directories, where every file is a return-array include, the
 * strict_types applies to the caller's process anyway, and the
 * ceremony adds noise without benefit.
 *
 * ## Config
 *
 * `config('architecture.rules.require_strict_types')`:
 *
 *   - `severity`      — `error` by default.
 *   - `exempt_paths`  — list of path substrings that mark a
 *                       file as exempt.
 */

declare(strict_types=1);

namespace Stackra\Architecture\Rules;

use Stackra\Architecture\Support\SourceFile;
use Stackra\Architecture\Violations\Severity;
use Stackra\Architecture\Violations\Violation;

/**
 * Require `declare(strict_types=1);` at the top of every file.
 *
 * @final
 */
final class RequireStrictTypesRule extends AbstractRule
{
    /**
     * Regex that succeeds when a `declare(strict_types=1);` line
     * appears anywhere between the opening PHP tag and the first
     * non-declaration statement. The dotall (`s`) flag lets `.`
     * span newlines so an intervening file docblock doesn't
     * defeat the match. Anchored to the start of the file — a
     * declare later in the body doesn't count.
     */
    private const string STRICT_TYPES_REGEX =
        '/^\s*<\?php\s+.*?declare\s*\(\s*strict_types\s*=\s*1\s*\)\s*;/s';

    /**
     * Stable dotted identifier.
     */
    public function id(): string
    {
        return 'architecture.require_strict_types';
    }

    /**
     * One-line description surfaced by the reporter.
     */
    public function description(): string
    {
        return 'Every PHP source file must declare(strict_types=1); immediately after the opening tag.';
    }

    /**
     * Loose typing coercion is a bug factory. Fail CI.
     */
    protected function defaultSeverity(): Severity
    {
        return Severity::Error;
    }

    /**
     * Regex-scan the file's raw content for the strict_types
     * declaration. Skip files matching any `exempt_paths`
     * substring.
     *
     * @param  SourceFile     $file  Parsed source file.
     * @return list<Violation>       Empty when clean; one entry when missing.
     */
    public function check(SourceFile $file): array
    {
        // Config-driven allowlist — a file whose absolute path
        // contains any exempt substring skips the check.
        foreach ($this->listOfStrings($this->config['exempt_paths'] ?? []) as $needle) {
            if (\str_contains($file->path, $needle)) {
                return [];
            }
        }

        // Pattern match against the raw file content — comments
        // and docblocks are allowed to sit between `<?php` and
        // the declare line, so we anchor the regex at the start
        // of the file and use `.*?` to skip anything in
        // between.
        if (\preg_match(self::STRICT_TYPES_REGEX, $file->rawContent) === 1) {
            return [];
        }

        return [
            $this->violation(
                file: $file,
                offender: $file->classFqcn ?? $file->path,
                message: 'File is missing `declare(strict_types=1);` at the top.',
                line: 1,
                hint: 'Add `declare(strict_types=1);` immediately after the opening PHP tag.',
            ),
        ];
    }
}
