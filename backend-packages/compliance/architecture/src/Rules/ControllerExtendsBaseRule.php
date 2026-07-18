<?php

/**
 * @file packages/architecture/src/Rules/ControllerExtendsBaseRule.php
 *
 * @description
 * Source rule: Controllers must extend
 * `Academorix\Routing\BaseController` — the routing package's
 * base class that wires up the InteractsWith* traits every
 * controller needs (input parsing, response shaping, auth-user
 * accessors, tracing headers). Extending Laravel's stock
 * `Illuminate\Routing\Controller` (or nothing at all) leaves a
 * controller half-wired and inconsistent with the rest of the
 * app.
 *
 * ## What it catches
 *
 * For files the resolver classifies as `Controller`, two
 * independent conditions each produce their own violation:
 *
 *   1. `extends X` where `X` (resolved through the file's
 *      imports) is on the `forbidden_bases` list. Typical
 *      offender: `Illuminate\Routing\Controller`.
 *   2. `extends` is empty — a controller with no explicit base
 *      class is missing the required scaffolding, so we surface
 *      it and point at the required base.
 *
 * Detecting an INTERMEDIATE base (e.g.
 * `class MyController extends AbstractInternalController`) is
 * out of scope for this regex-flavoured rule — resolving the
 * transitive parent chain requires walking every file in the
 * codebase. We flag only what we can verify: the direct parent.
 *
 * ## Config
 *
 * `config('architecture.rules.controller_extends_base')`:
 *
 *   - `severity`         — `error` by default.
 *   - `required_base`    — single FQCN the controller SHOULD
 *                          extend.
 *   - `forbidden_bases`  — list of FQCNs the controller MUST NOT
 *                          extend directly.
 */

declare(strict_types=1);

namespace Academorix\Architecture\Rules;

use Academorix\Architecture\Enums\LayerType;
use Academorix\Architecture\Support\SourceFile;
use Academorix\Architecture\Violations\Severity;
use Academorix\Architecture\Violations\Violation;

/**
 * Enforce the mandatory controller base class.
 *
 * @final
 */
final class ControllerExtendsBaseRule extends AbstractRule
{
    /**
     * Stable dotted identifier. Never change once shipped.
     */
    public function id(): string
    {
        return 'architecture.controller_extends_base';
    }

    /**
     * One-line description surfaced above the violation group.
     */
    public function description(): string
    {
        return 'Controllers must extend Academorix\\Routing\\BaseController — not the raw Illuminate base or nothing at all.';
    }

    /**
     * Missing InteractsWith* traits produce silent bugs at
     * runtime (bad response shapes, missing auth accessors). Fail
     * CI by default.
     */
    protected function defaultSeverity(): Severity
    {
        return Severity::Error;
    }

    /**
     * Two independent checks run per controller file:
     *
     *   1. `extends` present and resolved to a forbidden base.
     *   2. `extends` missing entirely.
     *
     * The two are stacked (a class can trip both — implausible
     * in practice but harmless to allow) and each produces one
     * violation entry.
     *
     * @param  SourceFile     $file  Parsed source file.
     * @return list<Violation>       Zero, one, or two violations.
     */
    public function check(SourceFile $file): array
    {
        // Only Controllers are subject to this rule. Route
        // discovery, provider registration, and other layers
        // have their own extension rules.
        if ($this->layers->resolve($file) !== LayerType::Controller) {
            return [];
        }

        // Interfaces and traits can't extend a base class — they
        // don't belong in the Controller layer to begin with, but
        // if the classifier tagged one as Controller we still
        // want to avoid spurious violations.
        if ($file->classKeyword !== 'class') {
            return [];
        }

        $requiredBase = $this->stringConfig('required_base');
        $forbiddenBases = $this->listOfStrings($this->config['forbidden_bases'] ?? []);

        $violations = [];

        // Case 1 — explicit `extends X`. Resolve through the
        // file's imports so short-name extends still match a
        // forbidden FQCN. Only fire when there's actually an
        // extends clause to inspect.
        if ($file->extends !== null) {
            $resolvedBase = $this->resolveExtends($file);

            if ($forbiddenBases !== [] && \in_array($resolvedBase, $forbiddenBases, true)) {
                $violations[] = $this->violation(
                    file: $file,
                    offender: $resolvedBase,
                    message: \sprintf(
                        'Controller "%s" extends forbidden base "%s" — extend "%s" instead.',
                        $file->classFqcn ?? $file->path,
                        $resolvedBase,
                        $requiredBase !== '' ? $requiredBase : 'the required base',
                    ),
                    line: null,
                    hint: 'Extend Academorix\\Routing\\BaseController — it brings the InteractsWith* traits every controller needs.',
                );
            }
        } else {
            // Case 2 — no `extends` at all. A bare `class Foo` in
            // the Controller layer is missing the required
            // scaffolding. We emit only when a required_base is
            // configured, otherwise the rule has nothing to
            // recommend.
            if ($requiredBase !== '') {
                $violations[] = $this->violation(
                    file: $file,
                    offender: $file->classFqcn ?? $file->path,
                    message: \sprintf(
                        'Controller "%s" has no base class — must extend "%s".',
                        $file->classFqcn ?? $file->path,
                        $requiredBase,
                    ),
                    line: null,
                    hint: 'Extend Academorix\\Routing\\BaseController — it brings the InteractsWith* traits every controller needs.',
                );
            }
        }

        return $violations;
    }

    /**
     * Expand the `extends` clause to a full FQCN using the file's
     * `use` statements. Idempotent for already-qualified names.
     *
     * @param  SourceFile  $file  The parsed source file whose extends we're resolving.
     * @return string             The best-effort FQCN, or the raw name when nothing resolves.
     */
    private function resolveExtends(SourceFile $file): string
    {
        $extends = $file->extends;
        if ($extends === null) {
            return '';
        }

        // Already namespaced — strip leading backslash, done.
        if (\str_contains($extends, '\\')) {
            return \ltrim($extends, '\\');
        }

        // Short name — consult the file's use statements.
        $resolved = $file->resolveShortName($extends);

        return $resolved ?? $extends;
    }

    /**
     * Read a scalar string config value defensively — returns
     * empty string when missing / wrong shape.
     */
    private function stringConfig(string $key): string
    {
        $value = $this->config[$key] ?? null;

        return \is_string($value) ? $value : '';
    }
}
