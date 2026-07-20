<?php

/**
 * @file src/Contracts/ScopeResolutionInterface.php
 *
 * @description
 * Contract for the cascading value resolver — the piece that walks
 * a node's materialised path and returns the first stored value per
 * key. Consumers ({@see \Academorix\Settings\Services\SettingsService},
 * for example) call this instead of hitting `scope_values` directly.
 */

declare(strict_types=1);

namespace Academorix\Scope\Contracts;

use Academorix\Scope\Data\ResolvedScopeValue;
use Academorix\Scope\Exceptions\ScopeContextRequiredException;
use Academorix\Scope\Models\ScopeNode;
use Academorix\Scope\Services\ScopeResolver;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Container\Attributes\Scoped;

/**
 * Cascading value resolver.
 *
 * `#[Scoped]` — one instance per request. The resolver may cache
 * per-request lookups internally (avoid repeat SELECTs for the same
 * key inside one request), so it MUST NOT be a singleton.
 */
#[Bind(ScopeResolver::class)]
#[Scoped]
interface ScopeResolutionInterface
{
    /**
     * Resolve a single key at the current scope.
     *
     * Walks the active node's `materialised_path` from leaf to root,
     * returning the first `scope_values` row whose `(namespace, key)`
     * matches. When no ancestor stores a value, the consumer's
     * `defaultValueFactory` is invoked.
     *
     * @param  string  $namespace  Consumer namespace ('settings',
     *                             'permissions', ...).
     * @param  string  $key  Fully-qualified key
     *                       ('general.timezone', 'admin.audit').
     * @return ResolvedScopeValue DTO carrying value + source node.
     *
     * @throws ScopeContextRequiredException When no active scope.
     */
    public function resolve(string $namespace, string $key): ResolvedScopeValue;

    /**
     * Resolve every key under a namespace prefix at the current
     * scope. Used by settings' group-read endpoint.
     *
     * @param  string  $namespace  Consumer namespace.
     * @param  string  $prefix  Key prefix (e.g. 'general.',
     *                          'theme.'). Empty = all keys.
     * @return array<string, ResolvedScopeValue> Keyed by resolved
     *                                           key.
     *
     * @throws ScopeContextRequiredException When no active scope.
     */
    public function resolveMany(string $namespace, string $prefix = ''): array;

    /**
     * Persist a value at a specific node.
     *
     * Writes are ALWAYS explicit — a caller specifies which node
     * receives the value. Cascading only applies to reads.
     *
     * @param  string  $namespace  Consumer namespace.
     * @param  ScopeNode  $node  Target node.
     * @param  string  $key  Fully-qualified key.
     * @param  mixed  $value  Serialisable payload.
     * @param  string|null  $updatedBy  User id (for audit).
     */
    public function write(
        string $namespace,
        ScopeNode $node,
        string $key,
        mixed $value,
        ?string $updatedBy = null,
    ): void;

    /**
     * Remove a stored value at a specific node.
     *
     * After deletion, subsequent reads at descendants fall through
     * to whatever ancestor still holds a value (or the default).
     *
     * @return bool True if a row was deleted, false if it didn't
     *              exist.
     */
    public function forget(string $namespace, ScopeNode $node, string $key): bool;
}
