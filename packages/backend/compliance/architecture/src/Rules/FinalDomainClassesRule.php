<?php

/**
 * @file packages/architecture/src/Rules/FinalDomainClassesRule.php
 *
 * @description
 * Source rule: classes in the configured "leaf" layers
 * (Controllers, Services, Actions by default) must be declared
 * `final`. These layers sit at the bottom of the dependency
 * graph — nothing extends them, so leaving them open is a
 * mis-signal that leads to accidental inheritance and brittle
 * test doubles.
 *
 * ## Why the layer list is configurable
 *
 * Some layers legitimately need extension:
 *
 *   - Repositories often share an abstract base for common
 *     query helpers.
 *   - Models are extended by Eloquent trait composition and
 *     tenant scoping.
 *   - Infrastructure is a broad bucket that includes providers,
 *     which frameworks like Laravel expect to be extendable.
 *
 * So the rule ships opt-in per layer via `required_layers`.
 *
 * ## What it catches
 *
 * For files whose layer matches any entry in `required_layers`,
 * emit a violation when the class declaration is missing the
 * `final` modifier — UNLESS the class is `abstract` (mutually
 * exclusive with `final` in PHP) or is not actually a `class`
 * (interfaces / traits / enums).
 *
 * ## Config
 *
 * `config('architecture.rules.final_domain_classes')`:
 *
 *   - `severity`         — `error` by default.
 *   - `required_layers`  — list of {@see LayerType} `->value`
 *                          strings that must be `final`.
 */

declare(strict_types=1);

namespace Stackra\Architecture\Rules;

use Stackra\Architecture\Enums\LayerType;
use Stackra\Architecture\Support\SourceFile;
use Stackra\Architecture\Violations\Severity;
use Stackra\Architecture\Violations\Violation;

/**
 * Require `final` on leaf-layer classes.
 *
 * @final
 */
final class FinalDomainClassesRule extends AbstractRule
{
    /**
     * Stable dotted identifier.
     */
    public function id(): string
    {
        return 'architecture.final_domain_classes';
    }

    /**
     * One-line description surfaced by the reporter.
     */
    public function description(): string
    {
        return 'Controllers, Services, and Actions must be `final` — they sit at the leaves of the dependency graph.';
    }

    /**
     * Non-final leaf classes invite accidental inheritance and
     * brittle test-double patterns. Fail CI.
     */
    protected function defaultSeverity(): Severity
    {
        return Severity::Error;
    }

    /**
     * Enforce `final` on classes whose layer is in the configured
     * `required_layers` list.
     *
     * @param  SourceFile     $file  Parsed source file.
     * @return list<Violation>       Empty when clean; one entry when missing.
     */
    public function check(SourceFile $file): array
    {
        // Interfaces / traits / enums are not classes and cannot
        // carry `final` in the sense we mean here.
        if ($file->classKeyword !== 'class') {
            return [];
        }

        // Abstract and final are mutually exclusive. An abstract
        // class is by definition an extension point.
        if ($file->hasClassModifier('abstract')) {
            return [];
        }

        // Which layer values require `final`? Empty list means
        // the rule is effectively disabled.
        $requiredLayers = $this->listOfStrings($this->config['required_layers'] ?? []);
        if ($requiredLayers === []) {
            return [];
        }

        // Resolve the file's layer and see if it's on the list.
        // We compare on the enum's string value so config stays
        // human-readable (`'service'`, not the enum instance).
        $layer = $this->layers->resolve($file);
        if (! \in_array($layer->value, $requiredLayers, true)) {
            return [];
        }

        if ($file->hasClassModifier('final')) {
            return [];
        }

        return [
            $this->violation(
                file: $file,
                offender: $file->classFqcn ?? $file->path,
                message: \sprintf(
                    '%s "%s" is not declared `final`.',
                    $this->titleForLayer($layer),
                    $file->classFqcn ?? $file->path,
                ),
                line: null,
                hint: 'Add `final` to the class declaration — these layers are leaves in the dependency graph.',
            ),
        ];
    }

    /**
     * Pretty-print the layer name for the violation message —
     * capital first letter reads better than the raw enum
     * value (`Service` vs `service`).
     */
    private function titleForLayer(LayerType $layer): string
    {
        return $layer->label();
    }
}
