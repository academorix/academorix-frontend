<?php

/**
 * @file packages/architecture/src/Rules/ModelUsesFillableAttributeRule.php
 *
 * @description
 * Source rule: every Eloquent Model must declare its
 * mass-assignment policy via one of Laravel's attribute-based
 * declarations — `#[Fillable]`, `#[Guarded]`, or
 * `#[Unguarded]` — instead of the legacy `protected $fillable`
 * / `protected $guarded` properties.
 *
 * ## Why
 *
 * Attributes make the mass-assignment policy visible on the
 * class declaration, integrate with reflection-based tooling,
 * and follow the same "attribute-first" convention Stackra
 * uses for `#[AsController]`, `#[Bind]`, and friends. The
 * $fillable / $guarded properties still work at runtime, but
 * they're invisible to attribute-driven discovery and produce
 * inconsistent code style across the codebase.
 *
 * ## What it catches
 *
 * For files the resolver classifies as
 * {@see LayerType::Model}, check whether the class carries at
 * least one of the configured `accepted_attributes` (matched by
 * short name). Two failure modes each produce one violation:
 *
 *   1. Neither attribute present AND the raw file content
 *      contains `protected $fillable` or `protected $guarded` —
 *      the model uses the legacy property. Violation names the
 *      property that should be replaced.
 *
 *   2. No attribute AND no property either — the model doesn't
 *      declare any mass-assignment policy at all. Violation
 *      recommends adding one.
 *
 * ## Config
 *
 * `config('architecture.rules.model_uses_fillable_attribute')`:
 *
 *   - `severity`             — `warning` by default.
 *   - `accepted_attributes`  — list of FQCNs of accepted
 *                              mass-assignment attributes.
 */

declare(strict_types=1);

namespace Stackra\Architecture\Rules;

use Stackra\Architecture\Enums\LayerType;
use Stackra\Architecture\Support\SourceFile;
use Stackra\Architecture\Violations\Severity;
use Stackra\Architecture\Violations\Violation;

/**
 * Require attribute-based fillable/guarded on Models.
 *
 * @final
 */
final class ModelUsesFillableAttributeRule extends AbstractRule
{
    /**
     * Regex matching the legacy `protected $fillable` /
     * `protected $guarded` property declarations. We accept
     * either public/protected/private visibility because the
     * intent is the same regardless.
     */
    private const string LEGACY_PROPERTY_REGEX =
        '/\b(?:public|protected|private)\s+(?:static\s+)?\$(fillable|guarded)\b/';

    /**
     * Stable dotted identifier.
     */
    public function id(): string
    {
        return 'architecture.model_uses_fillable_attribute';
    }

    /**
     * One-line description surfaced by the reporter.
     */
    public function description(): string
    {
        return 'Models must declare mass-assignment policy via #[Fillable] / #[Guarded] attributes, not the legacy $fillable / $guarded properties.';
    }

    /**
     * Warning — this is a hygiene / consistency rule. Both
     * approaches work at runtime; we want the attribute form
     * for tooling and readability.
     */
    protected function defaultSeverity(): Severity
    {
        return Severity::Warning;
    }

    /**
     * Detect model-layer files and check for attribute presence
     * vs. legacy property presence.
     *
     * @param  SourceFile     $file  Parsed source file.
     * @return list<Violation>       Zero or one violation.
     */
    public function check(SourceFile $file): array
    {
        // Only Models are subject to this rule.
        if ($this->layers->resolve($file) !== LayerType::Model) {
            return [];
        }

        // Interfaces / traits / enums can't declare fillables in
        // any meaningful sense.
        if ($file->classKeyword !== 'class') {
            return [];
        }

        $acceptedAttributes = $this->listOfStrings($this->config['accepted_attributes'] ?? []);
        if ($acceptedAttributes === []) {
            // No attributes configured — rule effectively off.
            return [];
        }

        // Present via at least one accepted attribute — clean.
        foreach ($acceptedAttributes as $attributeFqcn) {
            if ($file->hasClassAttribute($this->shortName($attributeFqcn))) {
                return [];
            }
        }

        // Attribute missing — is the legacy property present?
        if (\preg_match(self::LEGACY_PROPERTY_REGEX, $file->strippedContent, $match) === 1) {
            $legacyProperty = '$' . ($match[1] ?? 'fillable');

            return [
                $this->violation(
                    file: $file,
                    offender: $legacyProperty,
                    message: \sprintf(
                        'Model "%s" declares legacy `%s` property — replace with an attribute-based declaration.',
                        $file->classFqcn ?? $file->path,
                        $legacyProperty,
                    ),
                    line: null,
                    hint: 'Add #[Fillable(...)] or #[Guarded(...)] to the class declaration. Replaces the old $fillable/$guarded properties.',
                ),
            ];
        }

        // Neither attribute nor property — no mass-assignment
        // policy declared at all.
        return [
            $this->violation(
                file: $file,
                offender: $file->classFqcn ?? $file->path,
                message: \sprintf(
                    'Model "%s" declares no mass-assignment policy — expected #[Fillable], #[Guarded], or #[Unguarded].',
                    $file->classFqcn ?? $file->path,
                ),
                line: null,
                hint: 'Add #[Fillable(...)] or #[Guarded(...)] to the class declaration. Replaces the old $fillable/$guarded properties.',
            ),
        ];
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
