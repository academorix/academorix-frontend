<?php

/**
 * @file packages/architecture/src/PhpStan/NoAppMakeInConstructorRule.php
 *
 * @description
 * PHPStan rule: forbid service-locator calls
 * (`app()->make(...)`, `resolve(...)`) inside a `__construct`
 * body. Scope-aware sibling of
 * {@see \Stackra\Architecture\Rules\NoAppMakeInConstructorRule}.
 *
 * ## Why constructor scope specifically
 *
 * A `#[Singleton]` class's constructor runs ONCE per Octane
 * worker. Anything resolved from the container at that instant
 * gets frozen into the object. `app()->make(...)` in the ctor
 * bypasses the type system, hides the dependency from tests,
 * and — critically — captures a boot-time instance for every
 * subsequent request the worker serves.
 *
 * The regex sibling scans the constructor body's source. This
 * PHPStan version uses scope information (`getFunctionName()`)
 * to precisely know whether we're inside a `__construct` — no
 * brace matching, no false positives on look-alike method
 * bodies that happen to contain the string `__construct`.
 *
 * ## Node type
 *
 * We inspect `PhpParser\Node\Expr` — the common ancestor of
 * `MethodCall` and `FuncCall`. PHPStan lets us subscribe to the
 * ancestor; we then narrow inside `processNode()`. Registering
 * two separate rules would work too but would duplicate the
 * scope logic. One rule is easier to maintain.
 *
 * ## What it catches
 *
 *   - `app()->make(...)` — a `MethodCall` whose caller is a
 *     `FuncCall` to `app()` (0 arguments) and whose method
 *     name is `make`.
 *   - `resolve(...)`     — a bare `FuncCall` to the global
 *     `resolve()` helper.
 *
 * ## Config
 *
 * Constructor arguments (see phpstan-extension.neon):
 *
 *   - `serviceNamespaces` — FQCN prefixes counted as Service /
 *                           Action layer. The rule fires on
 *                           EVERY class's constructor by
 *                           default; the namespace filter lets
 *                           an operator narrow the scope.
 *
 * The rule implements `PHPStan\Rules\Rule` for
 * `PhpParser\Node\Expr` nodes (narrows to `MethodCall` /
 * `FuncCall` internally).
 */

declare(strict_types=1);

namespace Stackra\Architecture\PhpStan;

use PhpParser\Node;
use PhpParser\Node\Expr\FuncCall;
use PhpParser\Node\Expr\MethodCall;
use PhpParser\Node\Identifier;
use PhpParser\Node\Name;
use PHPStan\Analyser\Scope;
use PHPStan\Rules\IdentifierRuleError;
use PHPStan\Rules\Rule;
use PHPStan\Rules\RuleErrorBuilder;

/**
 * Scope-aware "no service locator in ctor" gate.
 *
 * @final
 */
final class NoAppMakeInConstructorRule extends AbstractServiceScopeRule implements Rule
{
    /**
     * @param  list<string>  $serviceNamespaces  FQCN prefixes for Service / Action; empty = every class.
     */
    public function __construct(array $serviceNamespaces)
    {
        parent::__construct($serviceNamespaces);
    }

    /**
     * PHPStan hook — subscribe to the common ancestor of the two
     * call-node types we care about. We filter inside
     * `processNode()`.
     */
    public function getNodeType(): string
    {
        return Node\Expr::class;
    }

    /**
     * Fire on `app()->make(...)` / `resolve(...)` inside a
     * `__construct` body.
     *
     * @return list<IdentifierRuleError>
     */
    public function processNode(Node $node, Scope $scope): array
    {
        // We only care about method calls and function calls —
        // silently ignore every other expression node.
        if (! $node instanceof MethodCall && ! $node instanceof FuncCall) {
            return [];
        }

        // Constructor scope is the ONLY scope we fire in. The
        // scope function name is `__construct` when the
        // analyser is inside a class constructor's body.
        if ($scope->getFunctionName() !== '__construct') {
            return [];
        }

        // Namespace scope filter — when the operator configures
        // a non-empty `serviceNamespaces`, restrict the rule
        // to classes under those prefixes. Empty list =
        // "check every class" (matches the operator intent).
        if ($this->serviceNamespaces !== [] && ! $this->isInsideServiceOrAction($scope)) {
            return [];
        }

        // Branch by node type. Each branch decides whether the
        // node matches its forbidden pattern.
        if ($node instanceof MethodCall) {
            return $this->checkMethodCall($node, $scope);
        }

        return $this->checkFuncCall($node, $scope);
    }

    /**
     * Look for `app()->make(...)`. The receiver must be a
     * `FuncCall` to the global `app` helper with no arguments —
     * `app('foo')->make(...)` is a different (but equally bad)
     * pattern that we deliberately don't flag here; keep this
     * rule tightly scoped to the classical shape.
     *
     * @return list<IdentifierRuleError>
     */
    private function checkMethodCall(MethodCall $node, Scope $scope): array
    {
        // Method name must be `make` — nothing else on
        // `app()` matters for this rule.
        if (! $node->name instanceof Identifier || $node->name->toString() !== 'make') {
            return [];
        }

        $receiver = $node->var;
        if (! $receiver instanceof FuncCall) {
            return [];
        }

        // Receiver's target function must be the bare `app`
        // helper. FQCN comparison handles `use function app;`
        // aliases as long as they resolve back to the global
        // `app`.
        if (! $receiver->name instanceof Name) {
            return [];
        }
        if ($receiver->name->toLowerString() !== 'app') {
            return [];
        }

        return [
            RuleErrorBuilder::message(sprintf(
                'Constructor of "%s" uses app()->make(...) — service-locate through the container; inject typed dependencies via constructor parameters.',
                $this->getCurrentClassName($scope) ?? '(unknown)',
            ))
                ->identifier('architecture.phpstan.noAppMakeInConstructor')
                ->line($node->getStartLine())
                ->build(),
        ];
    }

    /**
     * Look for the bare `resolve(...)` helper. Any global-namespace
     * function call whose name resolves to `resolve` counts.
     *
     * @return list<IdentifierRuleError>
     */
    private function checkFuncCall(FuncCall $node, Scope $scope): array
    {
        if (! $node->name instanceof Name) {
            return [];
        }
        if ($node->name->toLowerString() !== 'resolve') {
            return [];
        }

        return [
            RuleErrorBuilder::message(sprintf(
                'Constructor of "%s" calls resolve(...) — service-locate through the container; inject typed dependencies via constructor parameters.',
                $this->getCurrentClassName($scope) ?? '(unknown)',
            ))
                ->identifier('architecture.phpstan.noAppMakeInConstructor')
                ->line($node->getStartLine())
                ->build(),
        ];
    }
}
