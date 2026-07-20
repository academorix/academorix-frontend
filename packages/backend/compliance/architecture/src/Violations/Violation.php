<?php

/**
 * @file packages/architecture/src/Violations/Violation.php
 *
 * @description
 * Value object representing one architectural-rule violation.
 * Immutable. Rules construct these; reporters consume them.
 *
 * ## Wire shape
 *
 *   - `ruleId`     — dotted rule identifier (`architecture.no_direct_model_access`).
 *   - `severity`   — `Error` / `Warning`. Only `Error` fails the check.
 *   - `filePath`   — absolute path on disk. Reporter emits it as a
 *                    workspace-relative path for readability.
 *   - `line`       — 1-indexed line number. `null` when the rule
 *                    can't attribute the violation to a specific
 *                    line (rare — most rules pin to a `use`
 *                    statement or class declaration).
 *   - `offender`   — the FQCN or import statement responsible.
 *                    Prints under the file path.
 *   - `message`    — one-sentence human-readable explanation of
 *                    what's wrong.
 *   - `hint`       — optional multi-line remediation suggestion.
 *
 * All fields are `readonly` — a violation is stamped once and
 * shipped through the reporter without further mutation.
 */

declare(strict_types=1);

namespace Academorix\Architecture\Violations;

/**
 * Immutable violation record.
 *
 * @final
 */
final class Violation
{
    /**
     * @param  string        $ruleId    Stable dotted identifier of the rule.
     * @param  Severity      $severity  `Error` blocks CI; `Warning` reports only.
     * @param  string        $filePath  Absolute file path — reporter shortens for display.
     * @param  string        $offender  FQCN / import that triggered the violation.
     * @param  string        $message   One-sentence explanation.
     * @param  int|null      $line      1-indexed source line, when available.
     * @param  string|null   $hint      Optional remediation guidance.
     */
    public function __construct(
        public readonly string $ruleId,
        public readonly Severity $severity,
        public readonly string $filePath,
        public readonly string $offender,
        public readonly string $message,
        public readonly ?int $line = null,
        public readonly ?string $hint = null,
    ) {
    }

    /**
     * Convenience serialiser — used by the JSON reporter (when we
     * add one) and by tests that want to snapshot-compare.
     *
     * @return array{
     *     rule_id: string,
     *     severity: string,
     *     file: string,
     *     line: int|null,
     *     offender: string,
     *     message: string,
     *     hint: string|null,
     * }
     */
    public function toArray(): array
    {
        return [
            'rule_id' => $this->ruleId,
            'severity' => $this->severity->value,
            'file' => $this->filePath,
            'line' => $this->line,
            'offender' => $this->offender,
            'message' => $this->message,
            'hint' => $this->hint,
        ];
    }
}
