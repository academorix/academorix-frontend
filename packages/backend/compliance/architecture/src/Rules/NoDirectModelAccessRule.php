<?php

/**
 * @file packages/architecture/src/Rules/NoDirectModelAccessRule.php
 *
 * @description
 * The headline rule: Model classes may only be referenced from
 * Repositories, Factories, Seeders, Migrations, other Models
 * (for relationships), tests, and classes explicitly marked
 * with {@see AllowsDirectModelAccess}. Every other reference
 * is a violation.
 *
 * ## Enforcement
 *
 * A file "references a Model" when either of the following is
 * true:
 *
 *   1. It has a `use` statement whose FQCN starts with any of
 *      the configured `model_namespaces` prefixes.
 *   2. It has an inline FQCN reference (a `\App\Models\...`
 *      literal in source) matching one of those prefixes.
 *
 * The check runs AFTER {@see LayerResolver::resolve()} decides
 * what layer the current file belongs to. If the layer is on
 * the allowlist, we skip the check entirely.
 *
 * ## Allowlist
 *
 * Layers that MAY import Models:
 *
 *   - {@see LayerType::Model} — self-references (relationships).
 *   - {@see LayerType::Repository} — the designed exception.
 *   - {@see LayerType::Test} — tests routinely construct models.
 *   - {@see LayerType::Infrastructure} — factories, seeders,
 *     migrations, observers, policies. Config's
 *     `infra_path_prefixes` is where you widen / narrow this.
 *   - Any class carrying `#[AllowsDirectModelAccess]`.
 *
 * Every other layer (Controller, Service, Action, Unknown-with-
 * imports) trips the rule when it touches Models.
 */

declare(strict_types=1);

namespace Stackra\Architecture\Rules;

use Stackra\Architecture\Attributes\AllowsDirectModelAccess;
use Stackra\Architecture\Enums\LayerType;
use Stackra\Architecture\Support\SourceFile;
use Stackra\Architecture\Violations\Severity;

/**
 * Enforce "only Repositories touch Models".
 *
 * @final
 */
final class NoDirectModelAccessRule extends AbstractRule
{
    public function id(): string
    {
        return 'architecture.no_direct_model_access';
    }

    public function description(): string
    {
        return 'Models may only be imported from Repositories, Factories, Seeders, Migrations, other Models, or tests.';
    }

    protected function defaultSeverity(): Severity
    {
        return Severity::Error;
    }

    /**
     * @return list<\Stackra\Architecture\Violations\Violation>
     */
    public function check(SourceFile $file): array
    {
        // Fast path — the file has no imports at all. Common for
        // views, migrations relying on Schema builders only,
        // small helpers.
        if ($file->useStatements === [] && $file->inlineReferences === []) {
            return [];
        }

        // Waived by attribute — the developer took the escape
        // hatch explicitly. Trust it.
        if ($file->hasClassAttribute($this->shortAttributeName())) {
            return [];
        }

        // Layer allowlist.
        $layer = $this->layers->resolve($file);
        if ($this->isLayerAllowlisted($layer)) {
            return [];
        }

        // Config-driven path allowlist — used to whitelist
        // one-off directories (e.g. a legacy code fold) without
        // sprinkling attributes everywhere.
        foreach ($this->listOfStrings($this->config['allowlist_paths'] ?? []) as $prefix) {
            if (str_starts_with($file->path, $prefix)) {
                return [];
            }
        }

        // Now the real work — walk each Model reference and emit
        // a violation.
        $modelNamespaces = $this->listOfStrings($this->config['model_namespaces'] ?? []);
        if ($modelNamespaces === []) {
            return [];
        }

        $violations = [];

        foreach ($file->useStatements as $use) {
            if (! $use->isUnderAnyNamespace($modelNamespaces)) {
                continue;
            }

            $violations[] = $this->violation(
                file: $file,
                offender: $use->fqcn,
                message: sprintf(
                    'Model "%s" imported from %s "%s" — route Model access through a Repository.',
                    $use->fqcn,
                    $layer->label(),
                    $file->classFqcn ?? $file->path,
                ),
                line: $use->line,
                hint: 'Introduce a Repository for this Model and inject it here, or mark the class with #[AllowsDirectModelAccess(reason: ...)] if this is a deliberate one-off.',
            );
        }

        foreach ($file->inlineReferences as $ref) {
            if (! $ref->isUnderAnyNamespace($modelNamespaces)) {
                continue;
            }

            $violations[] = $this->violation(
                file: $file,
                offender: $ref->fqcn,
                message: sprintf(
                    'Inline reference to Model "%s" in %s "%s" — route Model access through a Repository.',
                    $ref->fqcn,
                    $layer->label(),
                    $file->classFqcn ?? $file->path,
                ),
                line: $ref->line,
                hint: 'Replace the inline reference with a Repository call.',
            );
        }

        return $violations;
    }

    /**
     * Layers that MAY import Models. Kept as an instance method
     * rather than a constant so subclasses / future config knobs
     * can adjust the set.
     */
    private function isLayerAllowlisted(LayerType $layer): bool
    {
        return match ($layer) {
            LayerType::Model,
            LayerType::Repository,
            LayerType::Test,
            LayerType::Infrastructure,
            LayerType::Unknown => true,
            LayerType::Controller,
            LayerType::Service,
            LayerType::Action => false,
        };
    }

    /**
     * Short name of the escape-hatch attribute. We use the
     * short name so callers can add either `use AllowsDirectModelAccess`
     * or `use Stackra\Architecture\Attributes\AllowsDirectModelAccess`
     * — both survive.
     */
    private function shortAttributeName(): string
    {
        // Not using `class_basename()` — the routing package is
        // free of Illuminate helpers by design, and short-name
        // extraction is a one-liner.
        $fqcn = AllowsDirectModelAccess::class;
        $lastSlash = strrpos($fqcn, '\\');

        return $lastSlash === false ? $fqcn : substr($fqcn, $lastSlash + 1);
    }
}
