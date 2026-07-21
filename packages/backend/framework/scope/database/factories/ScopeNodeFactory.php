<?php

/**
 * @file database/factories/ScopeNodeFactory.php
 *
 * @description
 * Factory for {@see \Stackra\Scope\Models\ScopeNode}. Produces
 * root nodes by default (no parent, depth 0, materialised_path is
 * the node's own id wrapped in slashes). Deeper nodes chain via
 * the `->childOf($parentNode)` state which correctly rebuilds the
 * materialised path and increments depth.
 *
 * ## Why we compute the path on the factory side
 *
 * In production the `ScopeNodeService` computes materialised
 * paths on insert — but the service isn't available in a bare
 * factory call (`ScopeNode::factory()->create()`). Rebuilding it
 * here in `configure()` keeps factory-created nodes internally
 * consistent so downstream resolvers can walk them.
 */

declare(strict_types=1);

namespace Stackra\Scope\Database\Factories;

use Stackra\Scope\Contracts\Data\ScopeNodeInterface;
use Stackra\Scope\Models\ScopeNode;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<ScopeNode>
 */
final class ScopeNodeFactory extends Factory
{
    /**
     * @var class-string<ScopeNode>
     */
    protected $model = ScopeNode::class;

    /**
     * Root node defaults.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Pre-generate the id so the materialised_path can embed it
        // before the model is persisted. `HasUuids` would otherwise
        // pick an id post-fill and the path would be one step
        // behind.
        $id = (string) Str::uuid();

        return [
            ScopeNodeInterface::ATTR_ID => $id,
            ScopeNodeInterface::ATTR_OWNER_ID => (string) Str::uuid(),
            ScopeNodeInterface::ATTR_SCOPE_SLUG => 'owner',
            ScopeNodeInterface::ATTR_ENTITY_ID => (string) Str::uuid(),
            ScopeNodeInterface::ATTR_PARENT_NODE_ID => null,
            ScopeNodeInterface::ATTR_MATERIALISED_PATH => '/' . $id . '/',
            ScopeNodeInterface::ATTR_DEPTH => 0,
        ];
    }

    /**
     * State: nest under an existing node. Rebuilds the
     * materialised_path + depth to remain consistent.
     */
    public function childOf(ScopeNode $parent, ?string $slug = null): self
    {
        return $this->state(function (array $attributes) use ($parent, $slug): array {
            $childId = $attributes[ScopeNodeInterface::ATTR_ID] ?? (string) Str::uuid();

            return [
                ScopeNodeInterface::ATTR_ID => $childId,
                ScopeNodeInterface::ATTR_OWNER_ID => (string) $parent->owner_id,
                ScopeNodeInterface::ATTR_SCOPE_SLUG => $slug ?? $attributes[ScopeNodeInterface::ATTR_SCOPE_SLUG] ?? 'child',
                ScopeNodeInterface::ATTR_PARENT_NODE_ID => (string) $parent->getKey(),
                ScopeNodeInterface::ATTR_MATERIALISED_PATH => rtrim((string) $parent->materialised_path, '/') . '/' . $childId . '/',
                ScopeNodeInterface::ATTR_DEPTH => (int) $parent->depth + 1,
            ];
        });
    }

    /**
     * State: bind to a specific owner + slug.
     */
    public function forOwner(string $ownerId, string $slug = 'owner'): self
    {
        return $this->state(fn (array $attributes): array => [
            ScopeNodeInterface::ATTR_OWNER_ID => $ownerId,
            ScopeNodeInterface::ATTR_SCOPE_SLUG => $slug,
        ]);
    }
}
