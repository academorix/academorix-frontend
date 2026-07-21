<?php

/**
 * @file packages/architecture/src/Rules/JobHasQueueAttributeRule.php
 *
 * @description
 * Source rule: every class that implements Laravel's
 * `ShouldQueue` (identified by SHORT NAME, so both the direct
 * `use Illuminate\Contracts\Queue\ShouldQueue;` import and any
 * re-export survive) must declare `#[Queue]`, `#[Timeout]`, and
 * `#[Tries]` attributes so retry / backoff / queue-name
 * behaviour is visible on the class.
 *
 * ## Why
 *
 * The default queue name, timeout, and retry count are process-
 * wide defaults set by Laravel — they're rarely what a specific
 * job wants. Declaring the values as attributes on the class
 * puts the operational contract next to the code that needs
 * it, and makes ops changes visible to reviewers.
 *
 * ## What it catches
 *
 * For files where any implemented interface's short name
 * matches the configured `triggering_interface`
 * (`ShouldQueue`), check for each of the configured
 * `required_attributes`. Missing attributes each produce their
 * own violation.
 *
 * ## Config
 *
 * `config('architecture.rules.job_has_queue_attribute')`:
 *
 *   - `severity`              — `warning` by default.
 *   - `required_attributes`   — list of FQCNs of the queue-
 *                               control attributes.
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
 * Require #[Queue] + #[Timeout] + #[Tries] on ShouldQueue jobs.
 *
 * @final
 */
final class JobHasQueueAttributeRule extends AbstractRule
{
    /**
     * Stable dotted identifier.
     */
    public function id(): string
    {
        return 'architecture.job_has_queue_attribute';
    }

    /**
     * One-line description surfaced by the reporter.
     */
    public function description(): string
    {
        return 'ShouldQueue classes must declare #[Queue] + #[Timeout] + #[Tries] to control retry and backoff behaviour.';
    }

    /**
     * Warning — silent operational defaults are a soft failure
     * mode. We surface it strongly but don't block CI.
     */
    protected function defaultSeverity(): Severity
    {
        return Severity::Warning;
    }

    /**
     * Detect ShouldQueue implementers and emit one violation
     * per missing required attribute.
     *
     * @param  SourceFile     $file  Parsed source file.
     * @return list<Violation>       One per missing required attribute.
     */
    public function check(SourceFile $file): array
    {
        $triggeringInterface = $this->stringConfig('triggering_interface');
        if ($triggeringInterface === '') {
            return [];
        }

        // Fire only for files that implement the triggering
        // interface. Compare by short name because
        // `implements` clauses often use the imported alias.
        if (! $this->implementsShortName($file, $triggeringInterface)) {
            return [];
        }

        // Interfaces / traits / enums don't get queued — skip.
        if ($file->classKeyword !== 'class') {
            return [];
        }

        // Abstract job bases exist as extension points and
        // don't need the concrete queue policy declared.
        if ($file->hasClassModifier('abstract')) {
            return [];
        }

        $requiredAttributes = $this->listOfStrings($this->config['required_attributes'] ?? []);
        if ($requiredAttributes === []) {
            return [];
        }

        $violations = [];

        foreach ($requiredAttributes as $attributeFqcn) {
            $short = $this->shortName($attributeFqcn);
            if ($file->hasClassAttribute($short)) {
                continue;
            }

            $violations[] = $this->violation(
                file: $file,
                offender: '#[' . $short . ']',
                message: \sprintf(
                    'Job "%s" implements %s but is missing required attribute #[%s].',
                    $file->classFqcn ?? $file->path,
                    $triggeringInterface,
                    $short,
                ),
                line: null,
                hint: 'Every ShouldQueue class must declare #[Queue], #[Timeout], and #[Tries] to control retry/backoff behaviour.',
            );
        }

        return $violations;
    }

    /**
     * `true` when any of the file's implemented interfaces has
     * the given short name. Case-insensitive comparison
     * because PHP class names are.
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
