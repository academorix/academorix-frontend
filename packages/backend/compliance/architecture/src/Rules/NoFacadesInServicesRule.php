<?php

/**
 * @file packages/architecture/src/Rules/NoFacadesInServicesRule.php
 *
 * @description
 * Source rule: forbids Laravel facades (and any other configured
 * "facade-like" namespace) from being imported by classes in the
 * Service or Action layers.
 *
 * Facades hide dependencies. In a Service or Action, every
 * collaborator must be explicit in the constructor signature so
 * the class can be instantiated by the container, mocked in
 * tests, and reasoned about at the type level. The Stackra
 * convention is to inject the underlying service via one of the
 * container attributes — `#[Auth]`, `#[Log]`, `#[Cache]`,
 * `#[DB]`, etc. See steering: `octane-first-di.md`.
 *
 * ## What it catches
 *
 * For files whose {@see LayerType} resolves to `Service` or
 * `Action`, any `use` statement whose FQCN starts with one of
 * the configured `forbidden_namespaces` prefixes triggers a
 * violation — UNLESS the exact FQCN is on the `allowed_facades`
 * escape hatch.
 *
 * The rule intentionally checks only `use` statements and not
 * inline FQCN references. Facades used without an import are
 * caught by other rules (the no-static-state / no-app-make
 * family); duplicating detection here would just noise up the
 * output.
 *
 * ## Config
 *
 * `config('architecture.rules.no_facades_in_services')`:
 *
 *   - `severity`             — `error` by default.
 *   - `forbidden_namespaces` — list of namespace prefixes ending
 *                              with a trailing backslash
 *                              (e.g. `Illuminate\\Support\\Facades\\`).
 *   - `allowed_facades`      — list of specific FQCNs to permit
 *                              despite matching a forbidden
 *                              prefix. Keep this list tight —
 *                              every entry is a hole in the
 *                              rule.
 */

declare(strict_types=1);

namespace Stackra\Architecture\Rules;

use Stackra\Architecture\Enums\LayerType;
use Stackra\Architecture\Support\SourceFile;
use Stackra\Architecture\Violations\Severity;
use Stackra\Architecture\Violations\Violation;

/**
 * Ban Laravel facades inside Service / Action classes.
 *
 * @final
 */
final class NoFacadesInServicesRule extends AbstractRule
{
    /**
     * Stable dotted identifier for this rule. Used as the config
     * key and printed in every violation payload.
     */
    public function id(): string
    {
        return 'architecture.no_facades_in_services';
    }

    /**
     * One-line description surfaced by the CLI reporter above
     * each violation group.
     */
    public function description(): string
    {
        return 'Services and Actions must not import Laravel facades — inject collaborators via container attributes.';
    }

    /**
     * Facade coupling in Services / Actions defeats the DI story;
     * we fail CI by default and let the config override where a
     * team explicitly opts into a warning-only rollout.
     */
    protected function defaultSeverity(): Severity
    {
        return Severity::Error;
    }

    /**
     * Emit a violation for every forbidden-namespace import in a
     * Service / Action file. Layer resolution happens first so
     * files outside the target layers pay no per-import cost.
     *
     * @param  SourceFile     $file  Parsed source file the scanner supplied.
     * @return list<Violation>       Every offending import; `[]` when clean.
     */
    public function check(SourceFile $file): array
    {
        // Only enforce on Service / Action — Controllers and
        // Infrastructure legitimately reach for facades. This is
        // the rule's raison d'être; short-circuit hard.
        $layer = $this->layers->resolve($file);
        if ($layer !== LayerType::Service && $layer !== LayerType::Action) {
            return [];
        }

        // Load the configured namespace prefix list. When empty
        // the rule is a no-op — treat as "not configured".
        $forbiddenNamespaces = $this->listOfStrings($this->config['forbidden_namespaces'] ?? []);
        if ($forbiddenNamespaces === []) {
            return [];
        }

        // Whitelist of specific FQCNs — checked as an exact
        // match, not a prefix. Small list expected.
        $allowedFacades = $this->listOfStrings($this->config['allowed_facades'] ?? []);

        $violations = [];

        // Walk every `use` line and test against the prefix list.
        // Use::isUnderAnyNamespace() already does the trailing-
        // backslash-aware comparison for us.
        foreach ($file->useStatements as $use) {
            if (! $use->isUnderAnyNamespace($forbiddenNamespaces)) {
                continue;
            }

            // Escape hatch — a specifically permitted facade
            // survives even when its namespace is forbidden.
            if (\in_array($use->fqcn, $allowedFacades, true)) {
                continue;
            }

            $violations[] = $this->violation(
                file: $file,
                offender: $use->fqcn,
                message: \sprintf(
                    'Facade "%s" imported by %s "%s" — inject the underlying service via a container attribute.',
                    $use->fqcn,
                    $layer->label(),
                    $file->classFqcn ?? $file->path,
                ),
                line: $use->line,
                hint: 'Inject the underlying service via the container attribute (#[Auth], #[Log], #[Cache], #[DB]). See steering: octane-first-di.md.',
            );
        }

        return $violations;
    }
}
