<?php

declare(strict_types=1);

namespace Stackra\Application\Database\Seeders;

use Stackra\Application\Contracts\Data\BusinessTypeInterface;
use Stackra\Application\Enums\BusinessTypeEnum;
use Stackra\Application\Models\BusinessType;
use Stackra\ServiceProvider\Attributes\AsSeeder;
use Illuminate\Database\Seeder;

/**
 * Iterate {@see BusinessTypeEnum::cases()} and upsert one system row
 * per case into `business_types`. Skips `BusinessTypeEnum::Custom` —
 * it's a code-level bucket only, never persisted.
 *
 * Discovered by `stackra/database`'s `#[AsSeeder]` scanner (ADR
 * 0011). Priority `20` puts it in the framework/tenancy tier, ahead
 * of every downstream module that references business types.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[AsSeeder(priority: 20, environments: [])]
final class BusinessTypeSeeder extends Seeder
{
    /**
     * Idempotent — upserts by `(tenant_id, slug)`.
     */
    public function run(): void
    {
        BusinessType::allowSystemMutation(function (): void {
            foreach (BusinessTypeEnum::cases() as $case) {
                // Custom is a code-level bucket — never a real row.
                if ($case === BusinessTypeEnum::Custom) {
                    continue;
                }

                BusinessType::query()->updateOrCreate(
                    [
                        BusinessTypeInterface::ATTR_TENANT_ID => null,
                        BusinessTypeInterface::ATTR_SLUG      => $case->value,
                    ],
                    [
                        BusinessTypeInterface::ATTR_LABEL        => $case->label(),
                        BusinessTypeInterface::ATTR_DESCRIPTION  => $case->description(),
                        BusinessTypeInterface::ATTR_ICON         => $case->iconToken(),
                        BusinessTypeInterface::ATTR_IS_SYSTEM    => true,
                        // `Other` is visible but `Custom` never lands here (skipped above).
                        BusinessTypeInterface::ATTR_IS_VISIBLE   => true,
                        BusinessTypeInterface::ATTR_SORT_ORDER   => $this->sortOrderFor($case),
                        BusinessTypeInterface::ATTR_TRANSLATIONS => [
                            'en' => [
                                'label'       => $case->label(),
                                'description' => $case->description(),
                            ],
                        ],
                    ],
                );
            }
        });
    }

    /**
     * Fixed sort order for the self-serve picker. Mirrors the enum
     * declaration order — future cases append with sort_order > 60.
     */
    private function sortOrderFor(BusinessTypeEnum $case): int
    {
        return match ($case) {
            BusinessTypeEnum::SportsCenter => 10,
            BusinessTypeEnum::Club         => 20,
            BusinessTypeEnum::Academy      => 30,
            BusinessTypeEnum::School       => 40,
            BusinessTypeEnum::Gym          => 50,
            BusinessTypeEnum::Federation   => 60,
            BusinessTypeEnum::Other        => 999,
            BusinessTypeEnum::Custom       => 9999,
        };
    }
}
