<?php

/**
 * @file src/Data/ScopeContextData.php
 *
 * @description
 * Immutable value object representing the "active scope" for a
 * single request. Threaded through every downstream service via
 * {@see \Stackra\Scope\Contracts\ScopeContextInterface}. Kept as
 * a plain readonly class rather than a Spatie Data DTO to keep the
 * scope package dependency-free — Spatie Data is a fine choice for
 * HTTP boundary DTOs but overkill for this internal handoff.
 */

declare(strict_types=1);

namespace Stackra\Scope\Data;

use Stackra\Scope\Contracts\ScopeContextInterface;
use Stackra\Scope\Models\ScopeNode;

/**
 * Active scope for a request.
 *
 * ## Fields
 *
 *  * `nodeId` — UUID of the active `ScopeNode`. String rather than
 *    the model itself so the DTO stays hydration-free — the model
 *    is loaded lazily via `node()` when needed.
 *  * `ownerId` — UUID of the owner (tenant) the node belongs to.
 *    Denormalised for cheap authorisation checks.
 *  * `scopeSlug` — the definition slug this node represents
 *    ('venue', 'academy', ...). Cached so ordering/filter decisions
 *    don't need to load the node model.
 *  * `materialisedPath` — the node's full ancestor chain. Copied
 *    verbatim from `scope_nodes.materialised_path`. Consumers walk
 *    this string to enumerate ancestors without additional queries.
 *  * `depth` — hop count from the root. Cached alongside the path.
 *
 * ## Immutability
 *
 * The class is `readonly`. To change scope for a nested code block,
 * push a new instance via
 * {@see ScopeContextInterface::push()}.
 */
final readonly class ScopeContextData
{
    /**
     * @param  string  $nodeId  Active node UUID.
     * @param  string  $ownerId  Owner UUID.
     * @param  string  $scopeSlug  Definition slug.
     * @param  string  $materialisedPath  Slash-delimited
     *                                    ancestor chain.
     * @param  int  $depth  Hop count from root.
     * @param  ScopeNode|null  $node  Optional preloaded
     *                                model — the middleware
     *                                hydrates it once so
     *                                downstream reads don't
     *                                re-query.
     */
    public function __construct(
        public string $nodeId,
        public string $ownerId,
        public string $scopeSlug,
        public string $materialisedPath,
        public int $depth,
        public ?ScopeNode $node = null,
    ) {}

    /**
     * Build a context from a loaded ScopeNode.
     *
     * Convenience factory the resolvers use once they've fetched
     * the node.
     */
    public static function fromNode(ScopeNode $node): self
    {
        return new self(
            nodeId: (string) $node->getKey(),
            ownerId: (string) $node->owner_id,
            scopeSlug: (string) $node->scope_slug,
            materialisedPath: (string) $node->materialised_path,
            depth: (int) $node->depth,
            node: $node,
        );
    }

    /**
     * Return the ordered list of ancestor node UUIDs, from root to
     * self. Parsed from `materialisedPath`.
     *
     * @return list<string>
     */
    public function ancestorIds(): array
    {
        // Path shape: `/root_id/level1_id/.../self_id/`. Trim the
        // leading/trailing slashes and split — filter drops the
        // empty strings the split otherwise emits.
        return array_values(array_filter(explode('/', $this->materialisedPath)));
    }
}
