<?php

/**
 * @file src/Resolvers/ScopeAwareCacheTagResolver.php
 *
 * @description
 * Scope-aware contributor to the shared cache-tag chain. Emits
 * one owner tag + one node tag per ancestor whenever a cache
 * operation happens under an active scope context, so cache
 * invalidation at any ancestor cascades correctly to every
 * descendant. Follows the caching package's discovery contract
 * (ADR 0004) — this class is discovered via
 * `olvlvl/composer-attribute-collector` at boot; no manual
 * registration.
 */

declare(strict_types=1);

namespace Academorix\Scope\Resolvers;

use Academorix\Caching\Attributes\AsCacheTagResolver;
use Academorix\Caching\Contracts\CacheTagResolver;
use Academorix\Scope\Contracts\ScopeContextInterface;

/**
 * Scope-aware cache tag resolver.
 *
 * ## Tag shape
 *
 *   * `scope:owner:<owner_id>` — every entry an owner produces.
 *     Flushing this one wipes every cached read for that tenant.
 *   * `scope:node:<node_id>` — one per ancestor of the currently
 *     active node, root first. Flushing a node tag cascades to
 *     every descendant because their entries carry the ancestor
 *     tag too.
 *
 * ## Priority
 *
 * `50` — earlier than the default 100, later than the tenancy
 * resolver at 40. The idea is that scope is "under" the tenant
 * (an owner has many scope nodes), so the tenant tag lands first
 * in the composed tag chain and scope tags follow.
 *
 * ## No-op when no scope
 *
 * Returns `[]` when there's no active scope context (e.g. a
 * request that missed the `scope` middleware). The tag builder
 * concatenates whatever it gets — an empty list is silently
 * dropped without producing a broken tag chain.
 */
#[AsCacheTagResolver(priority: 50)]
final readonly class ScopeAwareCacheTagResolver implements CacheTagResolver
{
    /**
     * @param  ScopeContextInterface  $context  Injected — the
     *                                          active scope context. Nullable at read-time by
     *                                          design; the resolve() method handles the absence
     *                                          with an empty return.
     */
    public function __construct(
        private ScopeContextInterface $context,
    ) {}

    /**
     * Return every tag segment the current context contributes.
     *
     * @param  array<string, mixed>  $context  Free-form hints from
     *                                         the caller (table, operation, entity id). The scope
     *                                         resolver ignores them — the tag shape is fully
     *                                         derived from the ambient scope state.
     * @return list<string>
     */
    public function resolve(array $context = []): array
    {
        $current = $this->context->get();
        if ($current === null) {
            // Cache request outside a scoped context — e.g. a
            // maintenance script or a public health check.
            // Emitting nothing keeps the tag chain valid; the
            // caller's other resolvers still contribute their
            // own segments.
            return [];
        }

        // Owner tag first — coarsest scope. Then one tag per
        // ancestor, root → leaf. Concatenation preserves the
        // materialised-path order so downstream diagnostics can
        // read the chain naturally.
        $tags = ['scope:owner:'.$current->ownerId];

        foreach ($current->ancestorIds() as $nodeId) {
            $tags[] = 'scope:node:'.$nodeId;
        }

        return $tags;
    }
}
