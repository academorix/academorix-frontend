<?php

/**
 * @file packages/architecture/src/Rules/ControllerNeedsAsControllerRule.php
 *
 * @description
 * **DEPRECATED (ADR 0016).** Legacy source rule that required
 * every Controller class to carry `#[AsController]`. Superseded
 * by two ADR-0016 rules:
 *
 *   - `architecture.no_base_controller` — bans Controller
 *     inheritance in domain modules.
 *   - `architecture.action_has_as_action_attribute` — requires
 *     `#[AsAction]` on every class under an `Actions/`
 *     directory.
 *
 * This rule remains registered so any framework package that
 * still ships pre-migration `#[AsController]` targets during its
 * migration window still gets a lint signal for the omitted
 * attribute — but domain modules that go the actions-only path
 * (as they MUST per ADR 0016) never trigger it: the layer
 * resolver classifies action classes as `Action`, not
 * `Controller`, so this rule's scope-check filters them out.
 *
 * ## What it catches (during the migration window)
 *
 * For files the resolver classifies as `Controller`, one
 * violation when the class declaration is missing the required
 * attribute (matched by short name so both aliased and
 * fully-qualified imports work).
 *
 * ## When this rule is removed
 *
 * When the `#[AsController]` attribute + `Controller` base
 * class are dropped in the next major (per ADR 0016), this
 * rule is removed alongside them. Until then it protects the
 * legacy Controller path from silent-404 mistakes.
 *
 * ## Config
 *
 * `config('architecture.rules.controller_needs_as_controller')`:
 *
 *   - `severity`           — `error` by default.
 *   - `required_attribute` — FQCN of the routing attribute
 *                            (`Stackra\Routing\Attributes\AsController`).
 *
 * @see \Stackra\Architecture\Rules\NoBaseControllerRule Replacement — bans Controller inheritance in domain modules.
 * @see \Stackra\Architecture\Rules\ActionHasAsActionAttributeRule Replacement — requires #[AsAction] on domain-module Action classes.
 *
 * @deprecated since 3.0 (per ADR 0016) — superseded by the two rules above.
 */

declare(strict_types=1);

namespace Stackra\Architecture\Rules;

use Stackra\Architecture\Enums\LayerType;
use Stackra\Architecture\Support\SourceFile;
use Stackra\Architecture\Violations\Severity;
use Stackra\Architecture\Violations\Violation;

/**
 * DEPRECATED: require the #[AsController] attribute on
 * Controller classes. Kept during the migration window; slated
 * for removal alongside `#[AsController]` itself.
 *
 * @final
 * @deprecated since 3.0 — see file docblock.
 */
final class ControllerNeedsAsControllerRule extends AbstractRule
{
    /**
     * Stable dotted identifier. Do not rename once shipped.
     */
    public function id(): string
    {
        return 'architecture.controller_needs_as_controller';
    }

    /**
     * One-line description surfaced by the reporter.
     */
    public function description(): string
    {
        return '[DEPRECATED — ADR 0016] Controller classes must carry #[AsController]. New code should use #[AsAction] instead.';
    }

    /**
     * Missing the attribute means routes never register — a
     * silent runtime failure. Fail CI hard.
     */
    protected function defaultSeverity(): Severity
    {
        return Severity::Error;
    }

    /**
     * Emit at most one violation per file: the required attribute
     * is either present or it isn't.
     *
     * @param  SourceFile     $file  Parsed source file.
     * @return list<Violation>       Empty when clean; one entry when missing.
     */
    public function check(SourceFile $file): array
    {
        // Only Controllers are subject to this rule.
        if ($this->layers->resolve($file) !== LayerType::Controller) {
            return [];
        }

        // Skip anything that isn't a concrete class.
        if ($file->classKeyword !== 'class') {
            return [];
        }

        if ($file->hasClassModifier('abstract')) {
            return [];
        }

        $requiredFqcn = $this->stringConfig('required_attribute');
        if ($requiredFqcn === '') {
            return [];
        }

        $shortName = $this->shortName($requiredFqcn);

        if ($file->hasClassAttribute($shortName)) {
            return [];
        }

        return [
            $this->violation(
                file: $file,
                offender: $file->classFqcn ?? $file->path,
                message: \sprintf(
                    'Controller "%s" is missing the required attribute #[%s]. NOTE: `#[AsController]` is deprecated by ADR 0016 — prefer converting this class to one or more `#[AsAction]` classes.',
                    $file->classFqcn ?? $file->path,
                    $shortName,
                ),
                line: null,
                hint: 'Preferred path: split this controller into per-method Action classes carrying `#[AsAction]` + a route verb attribute. Legacy path (during migration window only): add `#[AsController]` to the class declaration.',
            ),
        ];
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
     * Strip the namespace prefix and any leading backslash from
     * a class reference, leaving the last segment.
     */
    private function shortName(string $reference): string
    {
        $trimmed = \ltrim($reference, '\\');
        $lastSlash = \strrpos($trimmed, '\\');

        return $lastSlash === false ? $trimmed : \substr($trimmed, $lastSlash + 1);
    }
}
