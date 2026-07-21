<?php

/**
 * @file packages/architecture/src/PhpStan/NoFacadesInServicesRule.php
 *
 * @description
 * PHPStan rule: forbid Laravel facade calls inside classes in
 * the Service / Action layer. Scope-aware sibling of the
 * regex-based {@see \Stackra\Architecture\Rules\NoFacadesInServicesRule}.
 *
 * ## Why a PHPStan version
 *
 * The regex-based rule matches `use Illuminate\Support\Facades\*`
 * imports at the top of a source file. That misses:
 *
 *   1. **Aliased imports** — `use Illuminate\Support\Facades\Cache
 *      as C; C::get(...);`. The regex sees `Cache` but the call
 *      site uses `C`.
 *   2. **Inline FQCN calls** — `\Illuminate\Support\Facades\DB::table('...')`
 *      with no `use` at all.
 *   3. **Nested subclasses of `Facade`** — anything a team ships
 *      that extends `Illuminate\Support\Facades\Facade` and lives
 *      in a non-standard namespace.
 *
 * The PHPStan version resolves the class at the callsite via
 * `ReflectionProvider`, walks the parent chain, and flags any
 * static call whose target ultimately extends
 * `Illuminate\Support\Facades\Facade`. That closes every gap.
 *
 * ## Node type
 *
 * We inspect `PhpParser\Node\Expr\StaticCall` — the only node
 * that represents a `SomeClass::method(...)` call. Method-name
 * static calls on `$this::` or on a computed class expression
 * are NOT flagged (PHPStan can't resolve those to a class
 * name statically). That's an accepted false-negative — those
 * usages are rare and always warrant a manual review anyway.
 *
 * ## Config
 *
 * Constructor arguments (see phpstan-extension.neon):
 *
 *   - `serviceNamespaces` — FQCN prefixes counted as Service /
 *                           Action layer.
 *   - `allowedFacades`    — list of specific facade FQCNs that
 *                           are permitted despite this rule
 *                           (e.g. `Illuminate\Support\Facades\Log`
 *                           when the team explicitly allows Log).
 *
 * The rule implements `PHPStan\Rules\Rule` for
 * `PhpParser\Node\Expr\StaticCall` nodes.
 */

declare(strict_types=1);

namespace Stackra\Architecture\PhpStan;

use PhpParser\Node;
use PhpParser\Node\Expr\StaticCall;
use PhpParser\Node\Name;
use PHPStan\Analyser\Scope;
use PHPStan\Reflection\ClassReflection;
use PHPStan\Reflection\ReflectionProvider;
use PHPStan\Rules\IdentifierRuleError;
use PHPStan\Rules\Rule;
use PHPStan\Rules\RuleErrorBuilder;

/**
 * Scope-aware facade ban for Services / Actions.
 *
 * @final
 */
final class NoFacadesInServicesRule extends AbstractServiceScopeRule implements Rule
{
    /**
     * Illuminate's facade base class. Every genuine facade
     * eventually extends this.
     */
    private const string FACADE_BASE_CLASS = 'Illuminate\\Support\\Facades\\Facade';

    /**
     * @param  list<string>  $serviceNamespaces  FQCN prefixes for Service / Action.
     * @param  list<string>  $allowedFacades     FQCNs of facades that are explicitly permitted.
     */
    public function __construct(
        array $serviceNamespaces,
        private readonly array $allowedFacades,
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
     * Inspect a static call. When the caller is inside a
     * Service / Action AND the target class extends
     * `Facade`, emit one error at the call site.
     *
     * @return list<IdentifierRuleError>
     */
    public function processNode(Node $node, Scope $scope): array
    {
        if (! $node instanceof StaticCall) {
            return [];
        }

        // Fast-path: not in scope → no work to do.
        if (! $this->isInsideServiceOrAction($scope)) {
            return [];
        }

        // The static call's class must be a resolvable name.
        // `Foo::bar()` gives us `Foo` as a `Name` node;
        // `$var::bar()` gives us an `Expr` which we cannot
        // statically resolve.
        if (! $node->class instanceof Name) {
            return [];
        }

        $className = $scope->resolveName($node->class);

        // Not resolvable / unknown class — skip. PHPStan's own
        // reflection provider will surface that as a separate
        // error.
        if (! $this->reflectionProvider->hasClass($className)) {
            return [];
        }

        $classReflection = $this->reflectionProvider->getClass($className);

        if (! $this->extendsFacade($classReflection)) {
            return [];
        }

        // Explicit allow-list — a facade the team has decided
        // is acceptable in Services survives the rule.
        if (\in_array($className, $this->allowedFacades, true)) {
            return [];
        }

        $currentClass = $this->getCurrentClassName($scope) ?? '(unknown)';
        $message = sprintf(
            'Facade "%s" used inside "%s" — Services and Actions must inject collaborators via container attributes.',
            $className,
            $currentClass,
        );

        return [
            RuleErrorBuilder::message($message)
                ->identifier('architecture.phpstan.noFacadesInServices')
                ->line($node->getStartLine())
                ->build(),
        ];
    }

    /**
     * Walk the parent-class chain and return `true` when any
     * ancestor matches `FACADE_BASE_CLASS`. `getParents()`
     * gives us the ordered chain from immediate parent to
     * `object`, so a straight scan suffices.
     */
    private function extendsFacade(ClassReflection $classReflection): bool
    {
        // The class itself IS the facade base — trivially yes.
        if ($classReflection->getName() === self::FACADE_BASE_CLASS) {
            return true;
        }

        foreach ($classReflection->getParents() as $parent) {
            if ($parent->getName() === self::FACADE_BASE_CLASS) {
                return true;
            }
        }

        return false;
    }
}
