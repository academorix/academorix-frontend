<?php

declare(strict_types=1);

namespace Stackra\Application\Database\Factories;

use Stackra\Application\Contracts\Data\BusinessTypeInterface;
use Stackra\Application\Enums\BusinessTypeEnum;
use Stackra\Application\Models\BusinessType;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see BusinessType}.
 *
 * Produces tenant-custom rows by default (`is_system = false`,
 * `tenant_id` set). `->system(BusinessTypeEnum::case)` produces the
 * platform-default projection of an enum case, wrapped so the observer
 * accepts the write.
 *
 * @extends Factory<BusinessType>
 *
 * @category Application
 *
 * @since    0.1.0
 */
final class BusinessTypeFactory extends Factory
{
    /**
     * The model this factory builds.
     *
     * @var class-string<BusinessType>
     */
    protected $model = BusinessType::class;

    /**
     * Default model attribute values.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $slug = 'custom-'.Str::random(6);

        return [
            BusinessTypeInterface::ATTR_ID           => 'bst_'.Str::ulid()->toBase32(),
            BusinessTypeInterface::ATTR_TENANT_ID    => 'ten_'.Str::ulid()->toBase32(),
            BusinessTypeInterface::ATTR_SLUG         => $slug,
            BusinessTypeInterface::ATTR_LABEL        => Str::title(\str_replace('-', ' ', $slug)),
            BusinessTypeInterface::ATTR_DESCRIPTION  => $this->faker->sentence(),
            BusinessTypeInterface::ATTR_ICON         => 'mdi:tag-outline',
            BusinessTypeInterface::ATTR_SORT_ORDER   => 100,
            BusinessTypeInterface::ATTR_IS_SYSTEM    => false,
            BusinessTypeInterface::ATTR_IS_VISIBLE   => true,
            BusinessTypeInterface::ATTR_TRANSLATIONS => [
                'en' => ['label' => Str::title(\str_replace('-', ' ', $slug))],
            ],
        ];
    }

    /**
     * State — a platform-seeded system row projected from an enum case.
     *
     * The observer refuses `is_system = true` writes outside the
     * mutation-allowed scope, so wrap tests that use this state:
     *
     * ```php
     * BusinessType::allowSystemMutation(
     *     fn () => BusinessType::factory()->system(BusinessTypeEnum::SportsCenter)->create()
     * );
     * ```
     */
    public function system(BusinessTypeEnum $case): static
    {
        return $this->state(fn () => [
            BusinessTypeInterface::ATTR_TENANT_ID    => null,
            BusinessTypeInterface::ATTR_SLUG         => $case->value,
            BusinessTypeInterface::ATTR_LABEL        => $case->label(),
            BusinessTypeInterface::ATTR_DESCRIPTION  => $case->description(),
            BusinessTypeInterface::ATTR_ICON         => $case->iconToken(),
            BusinessTypeInterface::ATTR_IS_SYSTEM    => true,
            BusinessTypeInterface::ATTR_IS_VISIBLE   => $case !== BusinessTypeEnum::Custom,
            BusinessTypeInterface::ATTR_TRANSLATIONS => [
                'en' => [
                    'label'       => $case->label(),
                    'description' => $case->description(),
                ],
            ],
        ]);
    }

    /**
     * State — invisible (excluded from the self-serve picker).
     */
    public function hidden(): static
    {
        return $this->state(fn () => [
            BusinessTypeInterface::ATTR_IS_VISIBLE => false,
        ]);
    }
}
