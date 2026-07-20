<?php

/**
 * @file database/factories/ScopeDefinitionFactory.php
 *
 * @description
 * Factory for {@see \Academorix\Scope\Models\ScopeDefinition}. Emits
 * plausible per-owner hierarchy levels. Real production hierarchies
 * are bootstrapped by whichever module owns the tenant lifecycle
 * (typically `academorix-api/tenancy`), so this factory is
 * test-oriented: parent_slug defaults to `null` (produces root
 * levels) and callers use `->state(['parent_slug' => 'owner'])` to
 * chain deeper levels.
 */

declare(strict_types=1);

namespace Academorix\Scope\Database\Factories;

use Academorix\Scope\Contracts\Data\ScopeDefinitionInterface;
use Academorix\Scope\Models\ScopeDefinition;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<ScopeDefinition>
 */
final class ScopeDefinitionFactory extends Factory
{
    /**
     * The model this factory builds.
     *
     * @var class-string<ScopeDefinition>
     */
    protected $model = ScopeDefinition::class;

    /**
     * Default attribute set — always a root-level definition.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $slug = Str::slug(fake()->unique()->words(2, true), '_');

        return [
            ScopeDefinitionInterface::ATTR_ID => (string) Str::uuid(),
            ScopeDefinitionInterface::ATTR_OWNER_ID => (string) Str::uuid(),
            ScopeDefinitionInterface::ATTR_SLUG => $slug,
            ScopeDefinitionInterface::ATTR_LABEL => Str::title(str_replace('_', ' ', $slug)),
            ScopeDefinitionInterface::ATTR_PARENT_SLUG => null,
            ScopeDefinitionInterface::ATTR_SORT_ORDER => 0,
        ];
    }

    /**
     * State: nest this definition under another slug.
     *
     * @param  string  $parentSlug  Existing definition's slug.
     */
    public function childOf(string $parentSlug): self
    {
        return $this->state(fn (array $attributes): array => [
            ScopeDefinitionInterface::ATTR_PARENT_SLUG => $parentSlug,
        ]);
    }

    /**
     * State: pin a specific slug (useful for named test fixtures).
     */
    public function withSlug(string $slug): self
    {
        return $this->state(fn (array $attributes): array => [
            ScopeDefinitionInterface::ATTR_SLUG => $slug,
            ScopeDefinitionInterface::ATTR_LABEL => Str::title(str_replace(['_', '-'], ' ', $slug)),
        ]);
    }

    /**
     * State: bind to a specific owner.
     */
    public function forOwner(string $ownerId): self
    {
        return $this->state(fn (array $attributes): array => [
            ScopeDefinitionInterface::ATTR_OWNER_ID => $ownerId,
        ]);
    }
}
