<?php

/**
 * @file packages/architecture/src/PhpStan/AbstractServiceScopeRule.php
 *
 * @description
 * Base helper class for PHPStan rules that only fire inside the
 * Service or Action layers. Provides a single, well-tested way
 * to answer "is the code we're currently analysing inside a
 * class that belongs to the Service / Action namespaces?" so
 * concrete rules don't reinvent the check each time.
 *
 * ## Why a helper rather than a trait
 *
 * PHPStan calls `processNode()` for every node of the declared
 * type across the entire project. The scope-classification
 * predicate runs many thousands of times per run. Keeping it in
 * ONE place lets us:
 *
 *   - Reuse a single, config-driven namespace list across every
 *     concrete rule.
 *   - Short-circuit fast on anonymous classes / top-level code
 *     where there is no class reflection to test.
 *   - Add tracing or caching here without patching each rule.
 *
 * The class is deliberately not marked as a `PHPStan\Rules\Rule`
 * — it has no `getNodeType()` / `processNode()`. Concrete
 * subclasses declare those.
 *
 * ## Constructor contract
 *
 * `$serviceNamespaces` MUST be a list of FQCN prefixes ending
 * with a trailing backslash (e.g. `App\Services\`). Prefix
 * comparison is done via `str_starts_with()` against the class's
 * fully-qualified name, so the trailing backslash prevents
 * `App\ServiceFoo\Bar` from accidentally matching
 * `App\Service`. Empty list disables the scope check — every
 * class becomes "in scope", which is only sensible for tests.
 */

declare(strict_types=1);

namespace Academorix\Architecture\PhpStan;

use PHPStan\Analyser\Scope;

/**
 * Shared base for scope-aware Service / Action rules.
 */
abstract class AbstractServiceScopeRule
{
    /**
     * @param  list<string>  $serviceNamespaces  FQCN prefixes (trailing backslash) that count as Service / Action layer.
     */
    public function __construct(
        protected readonly array $serviceNamespaces,
    ) {
    }

    /**
     * Return the FQCN of the class currently in scope, or `null`
     * when the analyser is inside a function / closure / global
     * script with no enclosing class. Wrapping the reflection
     * access here means every subclass gets identical null-
     * handling.
     */
    protected function getCurrentClassName(Scope $scope): ?string
    {
        $classReflection = $scope->getClassReflection();
        if ($classReflection === null) {
            return null;
        }

        return $classReflection->getName();
    }

    /**
     * `true` when the code currently being analysed belongs to a
     * class whose FQCN starts with one of the configured Service
     * / Action namespace prefixes. `false` for global code,
     * anonymous classes, and out-of-scope classes.
     *
     * We accept "empty configured list" as "always in scope" so
     * a rule that forgot to set `serviceNamespaces` fires
     * everywhere — noisy but never silently disabled.
     */
    protected function isInsideServiceOrAction(Scope $scope): bool
    {
        $className = $this->getCurrentClassName($scope);
        if ($className === null) {
            return false;
        }

        // Empty configured list — the rule acts as an "always
        // on" gate. Concrete rules that want a strict scope
        // must always inject a non-empty list.
        if ($this->serviceNamespaces === []) {
            return true;
        }

        foreach ($this->serviceNamespaces as $prefix) {
            // Trailing-backslash-aware prefix comparison. See
            // constructor contract above.
            if (str_starts_with($className, $prefix)) {
                return true;
            }
        }

        return false;
    }
}
