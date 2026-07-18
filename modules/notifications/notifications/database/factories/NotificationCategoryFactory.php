<?php

declare(strict_types=1);

namespace Academorix\Notifications\Database\Factories;

use Academorix\Notifications\Contracts\Data\NotificationCategoryInterface;
use Academorix\Notifications\Enums\ConsentTier;
use Academorix\Notifications\Enums\NotificationPriority;
use Academorix\Notifications\Models\NotificationCategory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see NotificationCategory}.
 *
 * @extends Factory<NotificationCategory>
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class NotificationCategoryFactory extends Factory
{
    /**
     * @var class-string<NotificationCategory>
     */
    protected $model = NotificationCategory::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $slug = 'sample.' . Str::random(8);

        return [
            NotificationCategoryInterface::ATTR_ID               => 'cat_' . Str::ulid()->toBase32(),
            NotificationCategoryInterface::ATTR_TENANT_ID        => null,
            NotificationCategoryInterface::ATTR_SLUG             => $slug,
            NotificationCategoryInterface::ATTR_DISPLAY_NAME     => 'Sample category',
            NotificationCategoryInterface::ATTR_DESCRIPTION      => null,
            NotificationCategoryInterface::ATTR_OWNING_MODULE    => 'notifications',
            NotificationCategoryInterface::ATTR_DEFAULT_CHANNELS => ['in_app'],
            NotificationCategoryInterface::ATTR_PRIORITY         => NotificationPriority::Product->value,
            NotificationCategoryInterface::ATTR_CONSENT_TIER     => ConsentTier::ProductOptOut->value,
            NotificationCategoryInterface::ATTR_OPT_OUT_ALLOWED  => true,
            NotificationCategoryInterface::ATTR_IS_SYSTEM        => false,
        ];
    }

    /**
     * State — a platform-default (system) category.
     */
    public function system(): static
    {
        return $this->state(fn (): array => [
            NotificationCategoryInterface::ATTR_IS_SYSTEM => true,
            NotificationCategoryInterface::ATTR_TENANT_ID => null,
        ]);
    }
}
