<?php

/**
 * @file packages/architecture/src/Rules/AbstractRule.php
 *
 * @description
 * Base class for concrete rules. Provides:
 *
 *   - {@see ArchitectureRule} contract implementation
 *   - a helper for building {@see Violation} instances so
 *     concrete rules stay focused on the "when to flag" logic
 *   - injection points for the {@see LayerResolver} and
 *     configuration payload
 *
 * ## Contract expectations
 *
 * Concrete rules override `id()`, `description()`, `defaultSeverity()`,
 * and `check()`. Everything else is provided.
 *
 * The `$config` argument supplied at construction is the rule's
 * config sub-tree (e.g. `config('architecture.rules.no_direct_model_access')`);
 * the concrete rule reads its own knobs (like severity, allowlists,
 * model namespaces) from that array.
 */

declare(strict_types=1);

namespace Academorix\Architecture\Rules;

use Academorix\Architecture\Contracts\ArchitectureRule;
use Academorix\Architecture\Support\LayerResolver;
use Academorix\Architecture\Support\SourceFile;
use Academorix\Architecture\Violations\Severity;
use Academorix\Architecture\Violations\Violation;

abstract class AbstractRule implements ArchitectureRule
{
    /**
     * @param  LayerResolver          $layers  Classifies each SourceFile. Shared across rules.
     * @param  array<string, mixed>   $config  Rule-specific config subtree. Values are
     *                                         read by name in each concrete rule.
     */
    public function __construct(
        protected readonly LayerResolver $layers,
        protected readonly array $config,
    ) {
    }

    /**
     * Concrete rules override to declare their default severity.
     * Config's `severity` key wins when present.
     */
    protected function defaultSeverity(): Severity
    {
        return Severity::Error;
    }

    /**
     * Resolve the effective severity — configured override wins,
     * fallback to {@see defaultSeverity()}. Reject unknown
     * config values silently (fall back to default) rather than
     * throwing at check-time — the check is running in CI and
     * we prefer to keep going even when config is slightly wrong.
     */
    protected function severity(): Severity
    {
        $configured = $this->config['severity'] ?? null;

        if (is_string($configured)) {
            $enum = Severity::tryFrom($configured);
            if ($enum !== null) {
                return $enum;
            }
        }

        return $this->defaultSeverity();
    }

    /**
     * Build a violation carrying this rule's identity + severity.
     * Concrete rules call this with the file / offender / message
     * fields.
     */
    protected function violation(
        SourceFile $file,
        string $offender,
        string $message,
        ?int $line = null,
        ?string $hint = null,
    ): Violation {
        return new Violation(
            ruleId: $this->id(),
            severity: $this->severity(),
            filePath: $file->path,
            offender: $offender,
            message: $message,
            line: $line,
            hint: $hint,
        );
    }

    /**
     * Coerce a configured value into `list<string>`. Guards
     * against configs that were once strings and are now
     * arrays (or vice versa). Anything non-string is dropped.
     *
     * @return list<string>
     */
    protected function listOfStrings(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        $out = [];
        foreach ($value as $entry) {
            if (is_string($entry) && $entry !== '') {
                $out[] = $entry;
            }
        }

        return $out;
    }
}
