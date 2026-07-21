<?php

/**
 * @file database/factories/ScopeAliasFactory.php
 *
 * @description
 * Factory for {@see \Stackra\Scope\Models\ScopeAlias}. Emits a
 * per-owner display rename of a scope-definition slug — for tests
 * that assert on the aliasing behaviour (admin UI shows the
 * override label instead of the definition's default).
 */

declare(strict_types=1);

namespace Stackra\Scope\Database\Factories;

use Stackra\Scope\Contracts\Data\ScopeAliasInterface;
use Stackra\Scope\Models\ScopeAlias;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<ScopeAlias>
 */
final class ScopeAliasFactory extends Factory
{
    /**
     * @var class-string<ScopeAlias>
     */
    protected $model = ScopeAlias::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            ScopeAliasInterface::ATTR_ID => (string) Str::uuid(),
            ScopeAliasInterface::ATTR_OWNER_ID => (string) Str::uuid(),
            ScopeAliasInterface::ATTR_SCOPE_SLUG => Str::slug(fake()->word(), '_'),
            ScopeAliasInterface::ATTR_ALIAS_LABEL => Str::title(fake()->words(2, true)),
        ];
    }

    /**
     * State: bind to a specific owner + slug so tests can assert
     * on the exact override that lands in the admin UI.
     */
    public function overrides(string $ownerId, string $slug, string $label): self
    {
        return $this->state(fn (array $attributes): array => [
            ScopeAliasInterface::ATTR_OWNER_ID => $ownerId,
            ScopeAliasInterface::ATTR_SCOPE_SLUG => $slug,
            ScopeAliasInterface::ATTR_ALIAS_LABEL => $label,
        ]);
    }
}
