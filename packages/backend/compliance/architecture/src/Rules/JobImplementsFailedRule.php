<?php

/**
 * @file packages/architecture/src/Rules/JobImplementsFailedRule.php
 *
 * @description
 * Source rule: every class that implements Laravel's
 * `ShouldQueue` must declare a `failed(\Throwable $e): void`
 * method. Even an empty body counts — the point is to document
 * intent and ensure someone thought about the failure path.
 *
 * ## Why
 *
 * Queued jobs run detached from the request that triggered
 * them. When they throw and exceed retries, Laravel's default
 * behaviour is to log-and-move-on — the caller never learns.
 * Declaring `failed()` (even trivially) makes the failure hook
 * discoverable and forces the author to at least consider
 * what should happen when the job dies.
 *
 * ## What it catches
 *
 * Same triggering condition as
 * {@see JobHasQueueAttributeRule} — any file whose
 * `implements` clause carries the configured
 * `triggering_interface` short name. For those files, check
 * whether the configured `required_method` (default: `failed`)
 * is declared. Missing → one violation.
 *
 * ## Config
 *
 * `config('architecture.rules.job_implements_failed')`:
 *
 *   - `severity`              — `warning` by default.
 *   - `required_method`       — method name to look for
 *                               (default: `failed`).
 *   - `triggering_interface`  — short name of the interface
 *                               that flags a class as a queued
 *                               job (`ShouldQueue`).
 */

declare(strict_types=1);

namespace Stackra\Architecture\Rules;

use Stackra\Architecture\Support\SourceFile;
use Stackra\Architecture\Violations\Severity;
use Stackra\Architecture\Violations\Violation;

/**
 * Require `failed(\Throwable)` on ShouldQueue jobs.
 *
 * @final
 */
final class JobImplementsFailedRule extends AbstractRule
{
    /**
     * Default method name when the config omits it.
     */
    private const string DEFAULT_METHOD = 'failed';

    /**
     * Stable dotted identifier.
     */
    public function id(): string
    {
        return 'architecture.job_implements_failed';
    }

    /**
     * One-line description surfaced by the reporter.
     */
    public function description(): string
    {
        return 'ShouldQueue classes must declare failed(\\Throwable $e): void to handle unrecoverable failures.';
    }

    /**
     * Warning — same rationale as job_has_queue_attribute: a
     * soft failure mode we surface but don't block CI on.
     */
    protected function defaultSeverity(): Severity
    {
        return Severity::Warning;
    }

    /**
     * Detect ShouldQueue implementers missing the failure
     * hook and emit one violation each.
     *
     * @param  SourceFile     $file  Parsed source file.
     * @return list<Violation>       Zero or one violation.
     */
    public function check(SourceFile $file): array
    {
        $triggeringInterface = $this->stringConfig('triggering_interface');
        if ($triggeringInterface === '') {
            return [];
        }

        if (! $this->implementsShortName($file, $triggeringInterface)) {
            return [];
        }

        // Interfaces / traits / enums are neither jobs nor
        // capable of declaring the method body we require.
        if ($file->classKeyword !== 'class') {
            return [];
        }

        // Abstract job bases delegate failed() to concrete
        // subclasses.
        if ($file->hasClassModifier('abstract')) {
            return [];
        }

        $requiredMethod = $this->stringConfig('required_method');
        if ($requiredMethod === '') {
            $requiredMethod = self::DEFAULT_METHOD;
        }

        if ($file->hasMethod($requiredMethod)) {
            return [];
        }

        return [
            $this->violation(
                file: $file,
                offender: $requiredMethod . '()',
                message: \sprintf(
                    'Job "%s" implements %s but does not declare %s().',
                    $file->classFqcn ?? $file->path,
                    $triggeringInterface,
                    $requiredMethod,
                ),
                line: null,
                hint: 'Add public function failed(\\Throwable $e): void to the job. Even an empty body documents intent.',
            ),
        ];
    }

    /**
     * `true` when any of the file's implemented interfaces has
     * the given short name.
     */
    private function implementsShortName(SourceFile $file, string $shortName): bool
    {
        $needle = \strtolower($shortName);

        foreach ($file->implements as $iface) {
            if (\strtolower($this->shortName($iface)) === $needle) {
                return true;
            }
        }

        return false;
    }

    /**
     * Read a scalar string config value, tolerating missing /
     * wrong-typed values by returning `''`.
     */
    private function stringConfig(string $key): string
    {
        $value = $this->config[$key] ?? null;

        return \is_string($value) ? $value : '';
    }

    /**
     * Reduce a fully-qualified name to its last segment.
     */
    private function shortName(string $reference): string
    {
        $trimmed = \ltrim($reference, '\\');
        $lastSlash = \strrpos($trimmed, '\\');

        return $lastSlash === false ? $trimmed : \substr($trimmed, $lastSlash + 1);
    }
}
