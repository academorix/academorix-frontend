<?php

/**
 * @file packages/architecture/src/Rules/ExceptionsExtendStackraBaseRule.php
 *
 * @description
 * Source rule: every concrete exception class must extend
 * {@see \Stackra\Exceptions\StackraException}, not one of
 * PHP's standard-library exception classes directly.
 *
 * ## Why
 *
 * ADR 0002 + 0006 fix `StackraException` as the sole trunk of
 * the exception hierarchy:
 *
 *   - Central JSON renderer treats every subclass uniformly.
 *   - Sentry gets a consistent structural fingerprint.
 *   - PHPStan can enforce catch-all handlers explicitly.
 *
 * A domain-specific exception that extends `\RuntimeException`
 * directly bypasses all three benefits and drifts silently over
 * time.
 *
 * ## What it catches
 *
 *   - Classes declared under any of the configured domain paths
 *     (`src/`, `src/modules/`, `packages/*`) whose `extends`
 *     clause references one of PHP's standard exception classes:
 *     `Exception`, `RuntimeException`, `LogicException`,
 *     `DomainException`, `InvalidArgumentException`,
 *     `UnexpectedValueException`.
 *
 * ## Exceptions
 *
 *   - The `stackra/exceptions` package itself (defines the
 *     base — can't extend itself).
 *   - Classes that extend an intermediate Stackra subclass
 *     (already implicitly extending `StackraException`).
 *
 * ## Paired migrator
 *
 * `dev-tools/migrations/src/ExceptionsExtendBaseMigrator.php` is
 * idempotent and mutates exceptions to satisfy this rule
 * automatically.
 */

declare(strict_types=1);

namespace Stackra\Architecture\Rules;

use Stackra\Architecture\Support\SourceFile;
use Stackra\Architecture\Violations\Severity;
use Stackra\Architecture\Violations\Violation;

/**
 * Enforce that every exception extends
 * {@see \Stackra\Exceptions\StackraException}.
 *
 * @final
 */
final class ExceptionsExtendStackraBaseRule extends AbstractRule
{
    /**
     * PHP-standard exception names disallowed as direct parents.
     */
    private const array STANDARD_EXCEPTIONS = [
        'Exception',
        'RuntimeException',
        'LogicException',
        'DomainException',
        'InvalidArgumentException',
        'UnexpectedValueException',
    ];

    public function id(): string
    {
        return 'architecture.exceptions_extend_stackra_base';
    }

    public function description(): string
    {
        return 'Every exception must extend `Stackra\\Exceptions\\StackraException`, not one of PHP\'s standard-library exception classes.';
    }

    protected function defaultSeverity(): Severity
    {
        return Severity::Error;
    }

    /**
     * @return list<Violation>
     */
    public function check(SourceFile $file): array
    {
        if ($file->classKeyword !== 'class' || $file->className === null || $file->extends === null) {
            return [];
        }

        // The framework's exceptions package defines the base.
        $fqcn = $file->classFqcn ?? '';
        if (str_starts_with($fqcn, 'Stackra\\Exceptions\\')) {
            return [];
        }

        $extends = ltrim($file->extends, '\\');

        // Consider the SHORT name — an aliased import (`use Foo as Bar`)
        // means `Bar` appears in the extends clause even though the
        // real FQCN is different. Rules of thumb: if the short
        // name is one of the disallowed set, we flag.
        $shortName = str_contains($extends, '\\')
            ? substr($extends, strrpos($extends, '\\') + 1)
            : $extends;

        if (! in_array($shortName, self::STANDARD_EXCEPTIONS, true)) {
            return [];
        }

        return [
            $this->violation(
                file: $file,
                offender: $fqcn !== '' ? $fqcn : $file->className,
                message: \sprintf(
                    'Exception "%s" extends "%s" directly — every exception must extend StackraException.',
                    $fqcn !== '' ? $fqcn : $file->className,
                    $file->extends,
                ),
                line: null,
                hint: 'Run `php dev-tools/migrations/bin/stackra-migrate exceptions --apply` to fix every violation of this rule automatically.',
            ),
        ];
    }
}
