<?php

/**
 * @file packages/architecture/src/Rules/EnumIsBackedStringRule.php
 *
 * @description
 * Source rule: every PHP enum must be a `: string`-backed enum.
 *
 * ## Why
 *
 * String-backed enums round-trip cleanly through JSON, database
 * columns, config files, and cache serialisation. Pure enums
 * (no backing) and int-backed enums are surprising in exactly
 * those places — `enum Status { case Active; }` can't be
 * `json_encode`'d to a meaningful string, and int-backed
 * values change silently when new cases are inserted mid-list.
 * The convention is one and only one: `: string`.
 *
 * ## What it catches
 *
 * For files whose {@see SourceFile::$classKeyword} is `'enum'`,
 * regex-check the raw content for
 * `enum <ClassName>\s*:\s*string`. A missing / different
 * backing produces one violation.
 *
 * Anonymous enums don't exist in PHP so the class-name is
 * always known here — we use it verbatim in the regex to
 * anchor the match.
 *
 * ## Config
 *
 * `config('architecture.rules.enum_is_backed_string')`:
 *
 *   - `severity`  — `error` by default.
 */

declare(strict_types=1);

namespace Academorix\Architecture\Rules;

use Academorix\Architecture\Support\SourceFile;
use Academorix\Architecture\Violations\Severity;
use Academorix\Architecture\Violations\Violation;

/**
 * Require `: string` backing on every enum.
 *
 * @final
 */
final class EnumIsBackedStringRule extends AbstractRule
{
    /**
     * Stable dotted identifier.
     */
    public function id(): string
    {
        return 'architecture.enum_is_backed_string';
    }

    /**
     * One-line description surfaced by the reporter.
     */
    public function description(): string
    {
        return 'Enums must be backed by string — `enum FooStatus: string { ... }` is the convention.';
    }

    /**
     * Non-string enums round-trip badly through JSON / DB /
     * cache — silent data-corruption risk. Fail CI.
     */
    protected function defaultSeverity(): Severity
    {
        return Severity::Error;
    }

    /**
     * Check the enum declaration for a `: string` backing.
     *
     * @param  SourceFile     $file  Parsed source file.
     * @return list<Violation>       Empty when clean; one entry otherwise.
     */
    public function check(SourceFile $file): array
    {
        // Only enums are subject to this rule.
        if ($file->classKeyword !== 'enum') {
            return [];
        }

        // Class name should always be present for an enum
        // declaration, but guard defensively.
        if ($file->className === null) {
            return [];
        }

        // Match `enum <Name>\s*:\s*string` on the raw content —
        // stripped content works too but the enum header is
        // outside any comment/docblock, so raw is simpler.
        $pattern = '/\benum\s+' . \preg_quote($file->className, '/') . '\s*:\s*string\b/';
        if (\preg_match($pattern, $file->rawContent) === 1) {
            return [];
        }

        return [
            $this->violation(
                file: $file,
                offender: $file->classFqcn ?? $file->className,
                message: \sprintf(
                    'Enum "%s" is not backed by string — every enum must be declared `: string`.',
                    $file->classFqcn ?? $file->className,
                ),
                line: null,
                hint: 'Declare the enum as backed by string: `enum FooStatus: string { ... }`. Backed enums are our convention.',
            ),
        ];
    }
}
