<?php

/**
 * @file packages/architecture/src/Rules/AbstractPathRule.php
 *
 * @description
 * Base class for filesystem-existence rules. Mirrors
 * {@see AbstractRule} for source rules: provides the config
 * plumbing + violation-construction helper, leaves the concrete
 * "when to flag" logic to subclasses.
 *
 * ## Config shape
 *
 * Each concrete path rule reads its own config subtree
 * (`config('architecture.rules.<rule_id>')`). The base handles
 * `severity` normalisation identically to source rules so operators
 * get one uniform config vocabulary regardless of rule flavour.
 *
 * @see \Stackra\Architecture\Contracts\PathRule Contract.
 * @see AbstractRule                                Source-scan sibling.
 */

declare(strict_types=1);

namespace Stackra\Architecture\Rules;

use Stackra\Architecture\Contracts\PathRule;
use Stackra\Architecture\Violations\Severity;
use Stackra\Architecture\Violations\Violation;

abstract class AbstractPathRule implements PathRule
{
    /**
     * @param  array<string, mixed>  $config  Rule-specific config subtree.
     */
    public function __construct(protected readonly array $config)
    {
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
     * Effective severity — configured override wins, fallback to
     * {@see defaultSeverity()}. Silently falls back on invalid
     * config so CI keeps running.
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
     * Convenience — build a {@see Violation} tagged with the rule
     * id and effective severity. Rules call this from `check()`
     * with just the offending path + message + hint.
     */
    protected function violation(
        string $filePath,
        string $offender,
        string $message,
        ?int $line = null,
        ?string $hint = null,
    ): Violation {
        return new Violation(
            ruleId: $this->id(),
            severity: $this->severity(),
            filePath: $filePath,
            offender: $offender,
            message: $message,
            line: $line,
            hint: $hint,
        );
    }
}
