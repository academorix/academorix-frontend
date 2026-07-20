<?php

/**
 * @file packages/architecture/src/PhpStan/NoQueryBuilderInServicesRule.php
 *
 * @description
 * PHPStan rule: forbid Eloquent / query-builder entry points
 * inside classes in the Service / Action layer. Scope-aware
 * sibling of {@see \Academorix\Architecture\Rules\NoQueryBuilderInServicesRule}.
 *
 * ## What it catches
 *
 * Inside Service / Action scope, this rule flags:
 *
 *   1. **Model::query()** — any static call to `query()` on a
 *      class that (directly or transitively) extends
 *      `Illuminate\Database\Eloquent\Model`. Detected via
 *      reflection so subclasses, aliased imports, and inline
 *      FQCN calls are all covered.
 *
 *   2. **DB facade calls** — any static call whose target
 *      resolves to `Illuminate\Support\Facades\DB`, regardless
 *      of the method name. `DB::table(...)`, `DB::select(...)`,
 *      `DB::transaction(...)` all bypass the Repository layer.
 *
 * ## Why the reflection route
 *
 * The regex sibling matches concrete `Model::query` patterns.
 * The PHPStan version resolves the FQCN through
 * `ReflectionProvider` and walks parents, so a `Foo extends
 * Model` inside `App\Domain\Ordering\Foo::query()` is caught
 * even though the class doesn't live in `App\Models\` at all.
 *
 * ## Config
 *
 * Constructor arguments (see phpstan-extension.neon):
 *
 *   - `serviceNamespaces` — FQCN prefixes counted as Service /
 *                           Action layer.
 *   - `modelBaseClass`    — parent class that identifies a
 *                           model. Defaults to Eloquent's
 *                           `Model`.
 *
 * The rule implements `PHPStan\Rules\Rule` for
 * `PhpParser\Node\Expr\StaticCall` nodes.
 */

declare(strict_types=1);

namespace Academorix\Architecture\PhpStan;

use PhpParser\Node;
use PhpParser\Node\Expr\StaticCall;
use PhpParser\Node\Identifier;
use PhpParser\Node\Name;
use PHPStan\Analyser\Scope;
use PHPStan\Reflection\ClassReflection;
use PHPStan\Reflection\ReflectionProvider;
use PHPStan\Rules\IdentifierRuleError;
use PHPStan\Rules\Rule;
use PHPStan\Rules\RuleErrorBuilder;

/**
 * Scope-aware "no query builder in Services" gate.
 *
 * @final
 */
final class NoQueryBuilderInServicesRule extends AbstractServiceScopeRule implements Rule
{
    /**
     * The Laravel `DB` facade FQCN. Any static call on this
     * class is a bypass of the Repository layer.
     */
    private const string DB_FACADE_CLASS = 'Illuminate\\Support\\Facades\\DB';

    /**
     * @param  list<string>  $serviceNamespaces  FQCN prefixes for Service / Action.
     * @param  string        $modelBaseClass     Parent class that marks a class as a model.
     */
    public function __construct(
        array $serviceNamespaces,
        private readonly string $modelBaseClass,
        private readonly ReflectionProvider $reflectionProvider,
    ) {
        parent::__construct($serviceNamespaces);
    }

    /**
     * PHPStan hook — declare the node type this rule listens to.
     */
    public function getNodeType(): string
    {
        return StaticCall::class;
    }

    /**
     * Emit one error per offending static call.
     *
     * @return list<IdentifierRuleError>
     */
    public function processNode(Node $node, Scope $scope): array
    {
        if (! $node instanceof StaticCall) {
            return [];
        }

        // Fast-path: only rules on Services / Actions.
        if (! $this->isInsideServiceOrAction($scope)) {
            return [];
        }

        // We can only reason about statically-known class
        // names. `$class::query()` is out of scope.
        if (! $node->class instanceof Name) {
            return [];
        }

        $className = $scope->resolveName($node->class);
        if (! $this->reflectionProvider->hasClass($className)) {
            return [];
        }

        $classReflection = $this->reflectionProvider->getClass($className);
        $methodName = $node->name instanceof Identifier ? $node->name->toString() : null;

        // Case 1 — DB facade. Any method name is forbidden.
        if ($className === self::DB_FACADE_CLASS) {
            return [
                RuleErrorBuilder::message(sprintf(
                    'DB facade call "%s::%s()" inside "%s" — the DB facade is banned in Services / Actions; route queries through a Repository.',
                    $className,
                    $methodName ?? '?',
                    $this->getCurrentClassName($scope) ?? '(unknown)',
                ))
                    ->identifier('architecture.phpstan.noQueryBuilderInServices')
                    ->line($node->getStartLine())
                    ->build(),
            ];
        }

        // Case 2 — Model::query(). Restricted to the exact
        // method name `query` on classes that extend
        // Eloquent's Model.
        if ($methodName === 'query' && $this->extendsModelBase($classReflection)) {
            return [
                RuleErrorBuilder::message(sprintf(
                    'Model::query() call "%s::query()" inside "%s" — Services and Actions must not build queries; route through a Repository.',
                    $className,
                    $this->getCurrentClassName($scope) ?? '(unknown)',
                ))
                    ->identifier('architecture.phpstan.noQueryBuilderInServices')
                    ->line($node->getStartLine())
                    ->build(),
            ];
        }

        return [];
    }

    /**
     * `true` when `$classReflection` (directly or transitively)
     * extends the configured model base class. The class itself
     * matching the base counts too — a static call on the base
     * `Model::query()` is still a query builder.
     */
    private function extendsModelBase(ClassReflection $classReflection): bool
    {
        if ($classReflection->getName() === $this->modelBaseClass) {
            return true;
        }

        foreach ($classReflection->getParents() as $parent) {
            if ($parent->getName() === $this->modelBaseClass) {
                return true;
            }
        }

        return false;
    }
}
