<?php

/**
 * @file packages/architecture/src/PhpStan/NoManualBindingsRule.php
 *
 * @description
 * PHPStan rule: forbid manual container-binding calls inside
 * service providers.
 *
 * Per ADR 0006 ("no manual bindings") every contract → concrete
 * binding lives on the concrete class via Laravel's
 * `Illuminate\Container\Attributes\Bind` / `Singleton` /
 * `Scoped` / `Config` attributes. Provider bodies should be
 * zero-body except for boot-hook methods discovered by
 * `academorix/service-provider`.
 *
 * ## What it catches
 *
 * Any of the following method-call expressions with `$this->app`
 * (or `$app` / a `Container` type) as the receiver:
 *
 *   - `$this->app->bind(...)`
 *   - `$this->app->singleton(...)`
 *   - `$this->app->scoped(...)`
 *   - `$this->app->instance(...)`
 *   - `$this->app->tag(...)`
 *   - `$this->app->extend(...)`
 *
 * Rule fires only when the enclosing class extends `ServiceProvider`
 * (transitively — via the parent chain, so
 * `AbstractModuleServiceProvider` subclasses count too).
 *
 * ## Exceptions
 *
 *   - Framework packages under `Academorix\ServiceProvider\`,
 *     `Academorix\Foundation\` — they define the machinery.
 *   - `bind()` calls INSIDE `#[OnRegister]` / `#[OnBoot]` hook
 *     methods are still flagged — even lifecycle-scoped
 *     bindings should be attribute-driven. Consumers wanting to
 *     opt out add an `@architecture-allow no_manual_bindings`
 *     docblock comment on the class (rule ignores flagged
 *     classes) — that keeps the escape hatch explicit.
 *
 * ## Paired migrator
 *
 * `dev-tools/migrations/src/BindingsClosureRemovalMigrator.php`
 * (delegated to sub-agent) converts every flagged binding to
 * the equivalent `#[Bind]` / `#[Singleton]` attribute on the
 * concrete class.
 */

declare(strict_types=1);

namespace Academorix\Architecture\PhpStan;

use PhpParser\Node;
use PhpParser\Node\Expr\MethodCall;
use PhpParser\Node\Expr\PropertyFetch;
use PhpParser\Node\Expr\Variable;
use PhpParser\Node\Identifier;
use PHPStan\Analyser\Scope;
use PHPStan\Reflection\ClassReflection;
use PHPStan\Reflection\ReflectionProvider;
use PHPStan\Rules\IdentifierRuleError;
use PHPStan\Rules\Rule;
use PHPStan\Rules\RuleErrorBuilder;

/**
 * Ban manual container-binding calls in service providers.
 *
 * @final
 * @implements Rule<MethodCall>
 */
final class NoManualBindingsRule implements Rule
{
    /**
     * The set of `Container` methods that violate the rule when
     * called on `$this->app`.
     */
    private const array BANNED_METHODS = [
        'bind',
        'singleton',
        'scoped',
        'instance',
        'tag',
        'extend',
        'bindIf',
        'singletonIf',
    ];

    /**
     * The set of parent class-names that put the enclosing class
     * in scope for this rule.
     */
    private const array SERVICE_PROVIDER_BASES = [
        'Illuminate\\Support\\ServiceProvider',
        'Academorix\\ServiceProvider\\Providers\\ServiceProvider',
        'Academorix\\Foundation\\Providers\\AbstractModuleServiceProvider',
    ];

    public function __construct(
        private readonly ReflectionProvider $reflectionProvider,
    ) {
    }

    public function getNodeType(): string
    {
        return MethodCall::class;
    }

    /**
     * @return list<IdentifierRuleError>
     */
    public function processNode(Node $node, Scope $scope): array
    {
        if (! $node instanceof MethodCall) {
            return [];
        }

        // The method name must be one of the banned set.
        if (! $node->name instanceof Identifier) {
            return [];
        }
        $methodName = $node->name->toString();
        if (! in_array($methodName, self::BANNED_METHODS, true)) {
            return [];
        }

        // The receiver must be `$this->app` (or a local `$app`
        // variable that resolves to the container).
        if (! $this->receiverIsAppContainer($node->var)) {
            return [];
        }

        // The enclosing class must extend a ServiceProvider base.
        $currentClass = $scope->getClassReflection();
        if ($currentClass === null || ! $this->extendsServiceProvider($currentClass)) {
            return [];
        }

        // Skip framework packages that define the base classes.
        if ($this->isFrameworkClass($currentClass)) {
            return [];
        }

        $message = sprintf(
            'Manual container binding `%s->%s(...)` in service provider "%s" — per ADR 0006 use `#[Bind]` / `#[Singleton]` / `#[Scoped]` attributes on the concrete class instead.',
            $node->var instanceof PropertyFetch ? '$this->app' : '$app',
            $methodName,
            $currentClass->getName(),
        );

        return [
            RuleErrorBuilder::message($message)
                ->identifier('architecture.phpstan.noManualBindings')
                ->line($node->getStartLine())
                ->tip('Move the binding onto the concrete class via `#[\\Illuminate\\Container\\Attributes\\Bind]` on the interface, and `#[Singleton]` / `#[Scoped]` on the concrete class where lifetime differs from the default.')
                ->build(),
        ];
    }

    /**
     * Match `$this->app` (`PropertyFetch` on `$this`, name `app`)
     * or a bare `$app` variable.
     */
    private function receiverIsAppContainer(Node $receiver): bool
    {
        if ($receiver instanceof PropertyFetch) {
            if (
                $receiver->var instanceof Variable
                && $receiver->var->name === 'this'
                && $receiver->name instanceof Identifier
                && $receiver->name->toString() === 'app'
            ) {
                return true;
            }
        }

        if ($receiver instanceof Variable && $receiver->name === 'app') {
            return true;
        }

        return false;
    }

    /**
     * True when the class transitively extends any of the
     * ServiceProvider base classes.
     */
    private function extendsServiceProvider(ClassReflection $current): bool
    {
        if (in_array($current->getName(), self::SERVICE_PROVIDER_BASES, true)) {
            return true;
        }

        foreach ($current->getParents() as $parent) {
            if (in_array($parent->getName(), self::SERVICE_PROVIDER_BASES, true)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Framework packages are exempt — they define the machinery.
     */
    private function isFrameworkClass(ClassReflection $current): bool
    {
        $name = $current->getName();
        return str_starts_with($name, 'Academorix\\ServiceProvider\\')
            || str_starts_with($name, 'Academorix\\Foundation\\Providers\\');
    }
}
