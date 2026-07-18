<?php

/**
 * @file src/Facades/Scope.php
 *
 * @description
 * Facade over {@see \Academorix\Scope\Services\ScopeManager} — the
 * single manager class that aggregates the three underlying scope
 * services (context, resolution, emulator). Matches the framework
 * facade convention (`Json` → `JsonInterface`,
 * `Serializer` → `SerializerInterface`): the facade accessor
 * points at ONE class, not a bespoke container key or "facade
 * root" wrapper.
 */

declare(strict_types=1);

namespace Academorix\Scope\Facades;

use Academorix\Scope\Data\ResolvedScopeValue;
use Academorix\Scope\Data\ScopeContextData;
use Academorix\Scope\Models\ScopeNode;
use Academorix\Scope\Services\ScopeManager;
use Illuminate\Support\Facades\Facade;

/**
 * Terse call site over the scope services.
 *
 * @method static ScopeContextData|null current() Active context or null.
 * @method static ScopeContextData currentOrFail() Active context, or throw.
 * @method static ResolvedScopeValue resolve(string $namespace, string $key) Cascading read.
 * @method static array<string, ResolvedScopeValue> resolveMany(string $namespace, string $prefix = '')
 * @method static mixed runIn(ScopeContextData $context, callable $callback) Layer a scope temporarily.
 * @method static mixed runInNode(ScopeNode $node, callable $callback) Same, but from a node.
 * @method static mixed runInBlank(callable $callback) Blank the scope stack.
 */
final class Scope extends Facade
{
    /**
     * The container-binding key the facade resolves to — the
     * concrete manager class. `#[Scoped]` on `ScopeManager` gives
     * one instance per request; the facade transparently sees the
     * right instance in Octane workers without any additional
     * wiring.
     */
    protected static function getFacadeAccessor(): string
    {
        return ScopeManager::class;
    }
}
