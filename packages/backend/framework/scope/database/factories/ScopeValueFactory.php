<?php

/**
 * @file database/factories/ScopeValueFactory.php
 *
 * @description
 * Factory for {@see \Academorix\Scope\Models\ScopeValue}. Emits a
 * scalar string value under the placeholder `testing` namespace.
 * Real production writes go through
 * {@see \Academorix\Scope\Contracts\ScopeResolutionInterface::write()}
 * which routes through the consumer validator — bypassing it via
 * factory is only appropriate in tests that specifically want to
 * exercise the storage layer.
 */

declare(strict_types=1);

namespace Academorix\Scope\Database\Factories;

use Academorix\Scope\Contracts\Data\ScopeValueInterface;
use Academorix\Scope\Models\ScopeNode;
use Academorix\Scope\Models\ScopeValue;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<ScopeValue>
 */
final class ScopeValueFactory extends Factory
{
    /**
     * @var class-string<ScopeValue>
     */
    protected $model = ScopeValue::class;

    /**
     * Defaults — one stored value on a fresh node under the
     * `testing` namespace.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            ScopeValueInterface::ATTR_ID => (string) Str::uuid(),
            // Lazily create a node when the caller didn't supply
            // one — tests that don't care about the ancestor chain
            // get one root node they can share.
            ScopeValueInterface::ATTR_SCOPE_NODE_ID => ScopeNode::factory(),
            ScopeValueInterface::ATTR_NAMESPACE => 'testing',
            ScopeValueInterface::ATTR_KEY => Str::slug(fake()->unique()->words(2, true), '.'),
            ScopeValueInterface::ATTR_VALUE => fake()->sentence(),
            ScopeValueInterface::ATTR_UPDATED_BY => null,
        ];
    }

    /**
     * State: bind to a specific node so tests can build
     * ancestor chains explicitly.
     */
    public function atNode(ScopeNode $node): self
    {
        return $this->state(fn (array $attributes): array => [
            ScopeValueInterface::ATTR_SCOPE_NODE_ID => (string) $node->getKey(),
        ]);
    }

    /**
     * State: pick a namespace + key. Values remain the factory
     * default so callers who care about shape override again via
     * `->state([ATTR_VALUE => …])`.
     */
    public function forKey(string $namespace, string $key): self
    {
        return $this->state(fn (array $attributes): array => [
            ScopeValueInterface::ATTR_NAMESPACE => $namespace,
            ScopeValueInterface::ATTR_KEY => $key,
        ]);
    }
}
