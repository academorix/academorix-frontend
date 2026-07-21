<?php

/**
 * @file packages/architecture/src/Rules/ModelNoSideEffectsRule.php
 *
 * @description
 * Source rule: Models must expose no side-effecting public
 * methods. Business actions — sending notifications, charging
 * cards, dispatching jobs — belong on Services or Actions, not
 * on the Eloquent model itself.
 *
 * ## Why
 *
 * "Fat models" mix persistence with orchestration, hide side
 * effects behind property-like access, and encourage
 * "$user->send()" call sites that are indistinguishable from
 * data accessors at the type level. Keeping models thin makes
 * them safe to construct, mock, and pass around.
 *
 * ## What it catches
 *
 * For files the resolver classifies as
 * {@see LayerType::Model}, walk {@see SourceFile::$methods} and
 * emit one violation per PUBLIC method whose name is in the
 * configured `forbidden_method_names` list. Case-insensitive
 * comparison matches PHP's own method-name semantics.
 *
 * ## Config
 *
 * `config('architecture.rules.model_no_side_effects')`:
 *
 *   - `severity`                — `warning` by default.
 *   - `forbidden_method_names`  — list of method names that
 *                                 indicate side-effecting
 *                                 behaviour (send, notify,
 *                                 process, charge, refund,
 *                                 dispatch, execute, handle).
 */

declare(strict_types=1);

namespace Stackra\Architecture\Rules;

use Stackra\Architecture\Enums\LayerType;
use Stackra\Architecture\Support\SourceFile;
use Stackra\Architecture\Violations\Severity;
use Stackra\Architecture\Violations\Violation;

/**
 * Forbid side-effecting method names on Models.
 *
 * @final
 */
final class ModelNoSideEffectsRule extends AbstractRule
{
    /**
     * Stable dotted identifier.
     */
    public function id(): string
    {
        return 'architecture.model_no_side_effects';
    }

    /**
     * One-line description surfaced by the reporter.
     */
    public function description(): string
    {
        return 'Models must expose no side-effecting methods — move business actions to Services / Actions.';
    }

    /**
     * Warning — this is a design-hygiene rule. Fat-model
     * refactors are gradual; we surface the issue but don't
     * block CI unless the app explicitly bumps severity.
     */
    protected function defaultSeverity(): Severity
    {
        return Severity::Warning;
    }

    /**
     * Walk the Model's public methods and emit a violation per
     * forbidden name.
     *
     * @param  SourceFile     $file  Parsed source file.
     * @return list<Violation>       One per offending method.
     */
    public function check(SourceFile $file): array
    {
        // Only Models are subject to this rule.
        if ($this->layers->resolve($file) !== LayerType::Model) {
            return [];
        }

        // Interfaces / traits / enums don't have "methods" in
        // the side-effecting sense — skip.
        if ($file->classKeyword !== 'class') {
            return [];
        }

        $forbiddenNames = $this->listOfStrings($this->config['forbidden_method_names'] ?? []);
        if ($forbiddenNames === []) {
            return [];
        }

        // Lowercase-normalise the list once so we can compare
        // case-insensitively without churn per method.
        $forbiddenLower = \array_map(\strtolower(...), $forbiddenNames);

        $violations = [];

        foreach ($file->methods as $method) {
            // Only public methods count — helpers on the class
            // itself may legitimately be named
            // "handleSomething" without exposing the model as a
            // side-effecting API.
            if ($method->visibility !== 'public') {
                continue;
            }

            if (! \in_array(\strtolower($method->name), $forbiddenLower, true)) {
                continue;
            }

            $violations[] = $this->violation(
                file: $file,
                offender: $method->name . '()',
                message: \sprintf(
                    'Model "%s" declares side-effecting method %s() — move business actions to a Service or Action class.',
                    $file->classFqcn ?? $file->path,
                    $method->name,
                ),
                line: $method->line,
                hint: 'Move this action to a Service or Action class. Models expose no side-effecting methods.',
            );
        }

        return $violations;
    }
}
