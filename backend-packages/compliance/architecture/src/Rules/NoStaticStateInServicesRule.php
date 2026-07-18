<?php

/**
 * @file packages/architecture/src/Rules/NoStaticStateInServicesRule.php
 *
 * @description
 * Source rule: forbids writable static properties on classes in
 * request-scoped layers (Services, Actions, Repositories,
 * Controllers by default).
 *
 * ## Why
 *
 * Under Laravel Octane, workers stay alive across requests.
 * A writable `static $x` on a Service captures state from
 * request N and hands it to request N+1 — the classic
 * cross-request contamination bug. It's rare enough that tests
 * pass in dev (single request) but causes data leaks in prod
 * (concurrent requests share the worker).
 *
 * `const` declarations are compile-time immutable and therefore
 * safe. `readonly static` isn't yet a real thing in PHP but is
 * treated as safe here in anticipation.
 *
 * ## What it catches
 *
 * For files whose {@see LayerType} value is in the configured
 * `targeted_layers` list, walk {@see SourceFile::$properties}
 * and emit one violation per property that is `isStatic` and
 * not `isReadonly`.
 *
 * ## Config
 *
 * `config('architecture.rules.no_static_state_in_services')`:
 *
 *   - `severity`         — `error` by default.
 *   - `targeted_layers`  — list of {@see LayerType} `->value`
 *                          strings the rule applies to.
 */

declare(strict_types=1);

namespace Academorix\Architecture\Rules;

use Academorix\Architecture\Support\SourceFile;
use Academorix\Architecture\Violations\Severity;
use Academorix\Architecture\Violations\Violation;

/**
 * Forbid writable static state on request-scoped classes.
 *
 * @final
 */
final class NoStaticStateInServicesRule extends AbstractRule
{
    /**
     * Stable dotted identifier. Do not rename once shipped.
     */
    public function id(): string
    {
        return 'architecture.no_static_state_in_services';
    }

    /**
     * One-line description surfaced by the reporter.
     */
    public function description(): string
    {
        return 'Writable static properties leak between requests under Octane — forbidden on Services / Actions / Repositories / Controllers.';
    }

    /**
     * Cross-request contamination is a silent data-leak bug.
     * Fail CI hard.
     */
    protected function defaultSeverity(): Severity
    {
        return Severity::Error;
    }

    /**
     * Walk the class's property list and emit a violation per
     * writable static.
     *
     * @param  SourceFile     $file  Parsed source file.
     * @return list<Violation>       One per offending property; `[]` when clean.
     */
    public function check(SourceFile $file): array
    {
        // Which layers is this rule scoped to? Empty list means
        // the rule is effectively disabled.
        $targetedLayers = $this->listOfStrings($this->config['targeted_layers'] ?? []);
        if ($targetedLayers === []) {
            return [];
        }

        // Compare on the layer's string value — configs are
        // human-readable (`'service'`, not the enum instance).
        $layer = $this->layers->resolve($file);
        if (! \in_array($layer->value, $targetedLayers, true)) {
            return [];
        }

        // Fast path — no properties at all.
        if ($file->properties === []) {
            return [];
        }

        // Reuse the file's own hasWritableStaticProperty() as a
        // quick short-circuit — if it says false we're done.
        if (! $file->hasWritableStaticProperty()) {
            return [];
        }

        $violations = [];

        foreach ($file->properties as $property) {
            // Only care about class-body statics — a promoted
            // constructor property cannot be `static` in PHP,
            // so the check reduces to "static AND not readonly".
            if (! $property->isStatic) {
                continue;
            }

            if ($property->isReadonly) {
                continue;
            }

            $violations[] = $this->violation(
                file: $file,
                offender: '$' . $property->name,
                message: \sprintf(
                    'Writable static property $%s on %s "%s" — static state leaks between Octane requests.',
                    $property->name,
                    $layer->label(),
                    $file->classFqcn ?? $file->path,
                ),
                line: $property->line,
                hint: 'Static state leaks between requests under Octane. Move the cache into a #[Cache]-injected repository or make the state instance-level.',
            );
        }

        return $violations;
    }
}
