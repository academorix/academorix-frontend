<?php

/**
 * @file packages/architecture/src/PhpStan/SingletonNoScopedDepsRule.php
 *
 * @description
 * PHPStan rule: a class carrying `#[Singleton]` may not accept
 * constructor parameters annotated with request-scoped
 * container attributes (`#[CurrentUser]`, `#[Authenticated]`,
 * `#[RouteParameter]`, `#[Context]`).
 *
 * ## Why
 *
 * Under Laravel Octane, a `#[Singleton]` class is instantiated
 * ONCE per worker. Any request-scoped value pushed in through
 * the constructor is captured at that instant and returned to
 * every subsequent request the worker serves — a severe
 * correctness / security bug.
 *
 * `#[Scoped]` is the correct annotation for classes that need
 * request-scoped state. This rule fails CI when a class mixes
 * the two.
 *
 * ## Scope-aware advantage
 *
 * The regex sibling
 * ({@see \Stackra\Architecture\Rules\NoSingletonOnScopedDepsRule})
 * looks for `#[Singleton]` and a scoped-attribute short name in
 * the SAME file. That misses e.g. attribute imports aliased
 * under a different local name. The PHPStan version walks the
 * parsed AST attributes directly — no regex, no aliasing gap.
 *
 * ## Node type
 *
 * We inspect `PhpParser\Node\Stmt\Class_`. For every class, we
 * scan the class-level attributes for `Singleton` — if present,
 * we then walk the constructor's parameters and their
 * attributes for any of the configured scoped-attribute FQCNs.
 * One violation per offending parameter.
 *
 * ## Config
 *
 * Constructor arguments (see phpstan-extension.neon):
 *
 *   - `singletonAttributes` — FQCNs that mark a class as
 *                             singleton-scoped (typically just
 *                             `Illuminate\Container\Attributes\Singleton`).
 *   - `scopedAttributes`    — FQCNs of request-scoped
 *                             container attributes.
 *
 * The rule implements `PHPStan\Rules\Rule` for
 * `PhpParser\Node\Stmt\Class_` nodes.
 */

declare(strict_types=1);

namespace Stackra\Architecture\PhpStan;

use PhpParser\Node;
use PhpParser\Node\AttributeGroup;
use PhpParser\Node\Param;
use PhpParser\Node\Stmt\Class_;
use PhpParser\Node\Stmt\ClassMethod;
use PHPStan\Analyser\Scope;
use PHPStan\Rules\IdentifierRuleError;
use PHPStan\Rules\Rule;
use PHPStan\Rules\RuleErrorBuilder;

/**
 * "Singleton class must not inject scoped deps" gate.
 *
 * @final
 */
final class SingletonNoScopedDepsRule implements Rule
{
    /**
     * @param  list<string>  $singletonAttributes  FQCNs that mark a class as `#[Singleton]`.
     * @param  list<string>  $scopedAttributes     FQCNs of request-scoped parameter attributes.
     */
    public function __construct(
        private readonly array $singletonAttributes,
        private readonly array $scopedAttributes,
    ) {
    }

    /**
     * PHPStan hook — declare the node type this rule listens to.
     */
    public function getNodeType(): string
    {
        return Class_::class;
    }

    /**
     * Walk the class-level attributes for a Singleton marker,
     * then walk the constructor parameters for scoped
     * attributes.
     *
     * @return list<IdentifierRuleError>
     */
    public function processNode(Node $node, Scope $scope): array
    {
        if (! $node instanceof Class_) {
            return [];
        }

        // Anonymous class: skip. Only real classes carry
        // meaningful lifetime attributes.
        if ($node->name === null) {
            return [];
        }

        // Class must be marked #[Singleton]. Empty config
        // disables the rule silently — treat as "not
        // configured".
        if ($this->singletonAttributes === []) {
            return [];
        }
        if (! $this->hasAttributeFromSet($node->attrGroups, $this->singletonAttributes, $scope)) {
            return [];
        }

        // Now find the constructor. Only its parameter list
        // matters — property-promoted params are still `Param`
        // nodes.
        $constructor = $this->findConstructor($node);
        if ($constructor === null || $constructor->params === []) {
            return [];
        }

        $errors = [];
        $className = $node->namespacedName !== null
            ? $node->namespacedName->toString()
            : $node->name->toString();

        foreach ($constructor->params as $param) {
            $offendingAttribute = $this->findScopedAttribute($param, $scope);
            if ($offendingAttribute === null) {
                continue;
            }

            $paramName = $this->paramName($param);
            $errors[] = RuleErrorBuilder::message(sprintf(
                '#[Singleton] class "%s" injects request-scoped attribute #[%s] on constructor parameter $%s — request-scoped state leaks across requests.',
                $className,
                $this->shortName($offendingAttribute),
                $paramName,
            ))
                ->identifier('architecture.phpstan.singletonNoScopedDeps')
                ->line($param->getStartLine())
                ->build();
        }

        return $errors;
    }

    /**
     * Locate a class's `__construct` method statement. Returns
     * `null` when no constructor is declared.
     */
    private function findConstructor(Class_ $class): ?ClassMethod
    {
        foreach ($class->getMethods() as $method) {
            if (strtolower($method->name->toString()) === '__construct') {
                return $method;
            }
        }

        return null;
    }

    /**
     * `true` when any of the supplied `AttributeGroup`s carries
     * an attribute whose resolved FQCN is in `$whitelist`. Uses
     * `$scope->resolveName()` so aliased imports resolve to
     * their canonical FQCN before comparison.
     *
     * @param  array<int, AttributeGroup>  $groups
     * @param  list<string>                $whitelist
     */
    private function hasAttributeFromSet(array $groups, array $whitelist, Scope $scope): bool
    {
        foreach ($groups as $group) {
            foreach ($group->attrs as $attribute) {
                $fqcn = $scope->resolveName($attribute->name);
                if (\in_array($fqcn, $whitelist, true)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Return the first scoped-attribute FQCN attached to
     * `$param`, or `null` when none is present.
     */
    private function findScopedAttribute(Param $param, Scope $scope): ?string
    {
        if ($this->scopedAttributes === []) {
            return null;
        }

        foreach ($param->attrGroups as $group) {
            foreach ($group->attrs as $attribute) {
                $fqcn = $scope->resolveName($attribute->name);
                if (\in_array($fqcn, $this->scopedAttributes, true)) {
                    return $fqcn;
                }
            }
        }

        return null;
    }

    /**
     * Best-effort parameter name for the error message.
     * Property-promoted params expose `->var` as a `Variable`
     * node with a string `name`.
     */
    private function paramName(Param $param): string
    {
        $var = $param->var;
        if ($var instanceof Node\Expr\Variable && \is_string($var->name)) {
            return $var->name;
        }

        return '(unknown)';
    }

    /**
     * Reduce a fully-qualified attribute name to its final
     * segment for a cleaner error message.
     */
    private function shortName(string $fqcn): string
    {
        $lastSlash = strrpos($fqcn, '\\');

        return $lastSlash === false ? $fqcn : substr($fqcn, $lastSlash + 1);
    }
}
