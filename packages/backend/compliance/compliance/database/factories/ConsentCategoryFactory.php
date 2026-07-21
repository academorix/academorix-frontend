<?php

declare(strict_types=1);

namespace Stackra\Compliance\Database\Factories;

use Stackra\Compliance\Contracts\Data\ConsentCategoryInterface;
use Stackra\Compliance\Models\ConsentCategory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see ConsentCategory}.
 *
 * @extends Factory<ConsentCategory>
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
final class ConsentCategoryFactory extends Factory
{
    /**
     * @var class-string<ConsentCategory>
     */
    protected $model = ConsentCategory::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            ConsentCategoryInterface::ATTR_ID              => 'ccg_' . Str::ulid()->toBase32(),
            ConsentCategoryInterface::ATTR_TENANT_ID       => 'ten_' . Str::ulid()->toBase32(),
            ConsentCategoryInterface::ATTR_KEY             => 'marketing_' . Str::random(6),
            ConsentCategoryInterface::ATTR_LABEL           => 'Marketing communications',
            ConsentCategoryInterface::ATTR_DESCRIPTION     => 'Product news + upsell.',
            ConsentCategoryInterface::ATTR_REQUIRES_GUARDIAN => false,
            ConsentCategoryInterface::ATTR_IS_SYSTEM       => false,
            ConsentCategoryInterface::ATTR_IS_WITHDRAWABLE => true,
        ];
    }

    /**
     * Platform-default variant — tenant_id is null.
     */
    public function platformDefault(): static
    {
        return $this->state(fn (): array => [
            ConsentCategoryInterface::ATTR_TENANT_ID => null,
            ConsentCategoryInterface::ATTR_IS_SYSTEM => true,
        ]);
    }

    /**
     * Minor-parental variant — requires_guardian=true.
     */
    public function minorParental(): static
    {
        return $this->state(fn (): array => [
            ConsentCategoryInterface::ATTR_KEY               => 'minor_parental',
            ConsentCategoryInterface::ATTR_LABEL             => 'Parental consent (minor)',
            ConsentCategoryInterface::ATTR_REQUIRES_GUARDIAN => true,
        ]);
    }
}
