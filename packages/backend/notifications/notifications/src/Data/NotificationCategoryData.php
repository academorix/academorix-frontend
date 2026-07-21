<?php

declare(strict_types=1);

namespace Stackra\Notifications\Data;

use Stackra\Notifications\Contracts\Data\NotificationCategoryInterface;
use Stackra\Notifications\Enums\ConsentTier;
use Stackra\Notifications\Enums\NotificationPriority;
use Stackra\Notifications\Models\NotificationCategory;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see NotificationCategory}.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class NotificationCategoryData extends Data
{
    /**
     * @param  string                $id                `cat_<ulid>`.
     * @param  string|null           $tenantId          Owning tenant (null = platform default).
     * @param  string                $slug              Module-namespaced slug.
     * @param  string                $displayName       Admin display name.
     * @param  string|null           $description       Long-form description.
     * @param  string                $owningModule      Module that owns the category.
     * @param  list<string>          $defaultChannels   Default channel keys.
     * @param  NotificationPriority  $priority          Priority tier.
     * @param  ConsentTier           $consentTier       Consent tier.
     * @param  bool                  $optOutAllowed     Whether users can opt out.
     * @param  bool                  $isSystem          Whether this is a platform default.
     */
    public function __construct(
        public string $id,
        public ?string $tenantId,
        public string $slug,
        public string $displayName,
        public ?string $description,
        public string $owningModule,
        public array $defaultChannels,
        public NotificationPriority $priority,
        public ConsentTier $consentTier,
        public bool $optOutAllowed,
        public bool $isSystem,
    ) {
    }

    /**
     * Build the DTO from a NotificationCategory model.
     */
    public static function fromModel(NotificationCategory $category): self
    {
        $priorityValue = $category->{NotificationCategoryInterface::ATTR_PRIORITY};
        $priority = $priorityValue instanceof NotificationPriority
            ? $priorityValue
            : (NotificationPriority::tryFrom((string) $priorityValue) ?? NotificationPriority::Product);

        $consentValue = $category->{NotificationCategoryInterface::ATTR_CONSENT_TIER};
        $consentTier = $consentValue instanceof ConsentTier
            ? $consentValue
            : (ConsentTier::tryFrom((string) $consentValue) ?? ConsentTier::ProductOptOut);

        return new self(
            id: (string) $category->getKey(),
            tenantId: $category->{NotificationCategoryInterface::ATTR_TENANT_ID},
            slug: (string) $category->{NotificationCategoryInterface::ATTR_SLUG},
            displayName: (string) $category->{NotificationCategoryInterface::ATTR_DISPLAY_NAME},
            description: $category->{NotificationCategoryInterface::ATTR_DESCRIPTION},
            owningModule: (string) $category->{NotificationCategoryInterface::ATTR_OWNING_MODULE},
            defaultChannels: (array) ($category->{NotificationCategoryInterface::ATTR_DEFAULT_CHANNELS} ?? []),
            priority: $priority,
            consentTier: $consentTier,
            optOutAllowed: (bool) $category->{NotificationCategoryInterface::ATTR_OPT_OUT_ALLOWED},
            isSystem: (bool) $category->{NotificationCategoryInterface::ATTR_IS_SYSTEM},
        );
    }
}
