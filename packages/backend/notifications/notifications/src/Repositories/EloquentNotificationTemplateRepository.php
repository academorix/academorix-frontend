<?php

declare(strict_types=1);

namespace Stackra\Notifications\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Notifications\Contracts\Data\NotificationTemplateInterface;
use Stackra\Notifications\Contracts\Repositories\NotificationTemplateRepositoryInterface;
use Stackra\Notifications\Enums\TemplateState;
use Stackra\Notifications\Models\NotificationTemplate;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see NotificationTemplateRepositoryInterface}.
 *
 * Template resolution follows the deepest-wins pattern: tenant
 * override > platform default > platform default English fallback.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(NotificationTemplateInterface::class)]
#[Cacheable(ttl: 900, tags: true)]
#[Filterable([
    NotificationTemplateInterface::ATTR_TENANT_ID     => ['$eq', '$null'],
    NotificationTemplateInterface::ATTR_KEY           => ['$eq', '$in'],
    NotificationTemplateInterface::ATTR_CATEGORY_SLUG => ['$eq', '$in'],
    NotificationTemplateInterface::ATTR_CHANNEL       => ['$eq', '$in'],
    NotificationTemplateInterface::ATTR_LOCALE        => ['$eq', '$in'],
    NotificationTemplateInterface::ATTR_STATE         => ['$eq', '$in'],
    NotificationTemplateInterface::ATTR_IS_SYSTEM     => ['$eq'],
])]
final class EloquentNotificationTemplateRepository extends Repository implements NotificationTemplateRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function resolvePublished(
        ?string $tenantId,
        string $key,
        string $channel,
        string $locale,
    ): ?NotificationTemplate {
        // 1. Tenant override — exact locale.
        if ($tenantId !== null) {
            /** @var NotificationTemplate|null $override */
            $override = $this->query()
                ->where(NotificationTemplateInterface::ATTR_TENANT_ID, $tenantId)
                ->where(NotificationTemplateInterface::ATTR_KEY, $key)
                ->where(NotificationTemplateInterface::ATTR_CHANNEL, $channel)
                ->where(NotificationTemplateInterface::ATTR_LOCALE, $locale)
                ->where(NotificationTemplateInterface::ATTR_STATE, TemplateState::Published->value)
                ->orderByDesc(NotificationTemplateInterface::ATTR_VERSION)
                ->first();

            if ($override !== null) {
                return $override;
            }
        }

        // 2. Platform default — exact locale.
        /** @var NotificationTemplate|null $platform */
        $platform = $this->query()
            ->whereNull(NotificationTemplateInterface::ATTR_TENANT_ID)
            ->where(NotificationTemplateInterface::ATTR_KEY, $key)
            ->where(NotificationTemplateInterface::ATTR_CHANNEL, $channel)
            ->where(NotificationTemplateInterface::ATTR_LOCALE, $locale)
            ->where(NotificationTemplateInterface::ATTR_STATE, TemplateState::Published->value)
            ->orderByDesc(NotificationTemplateInterface::ATTR_VERSION)
            ->first();

        if ($platform !== null) {
            return $platform;
        }

        // 3. Platform default — English fallback.
        if ($locale !== 'en') {
            /** @var NotificationTemplate|null $fallback */
            $fallback = $this->query()
                ->whereNull(NotificationTemplateInterface::ATTR_TENANT_ID)
                ->where(NotificationTemplateInterface::ATTR_KEY, $key)
                ->where(NotificationTemplateInterface::ATTR_CHANNEL, $channel)
                ->where(NotificationTemplateInterface::ATTR_LOCALE, 'en')
                ->where(NotificationTemplateInterface::ATTR_STATE, TemplateState::Published->value)
                ->orderByDesc(NotificationTemplateInterface::ATTR_VERSION)
                ->first();

            return $fallback;
        }

        return null;
    }

    /**
     * {@inheritDoc}
     */
    public function findAllVersions(?string $tenantId, string $key, string $channel, string $locale): Collection
    {
        $query = $this->query()
            ->where(NotificationTemplateInterface::ATTR_KEY, $key)
            ->where(NotificationTemplateInterface::ATTR_CHANNEL, $channel)
            ->where(NotificationTemplateInterface::ATTR_LOCALE, $locale)
            ->orderByDesc(NotificationTemplateInterface::ATTR_VERSION);

        if ($tenantId === null) {
            $query->whereNull(NotificationTemplateInterface::ATTR_TENANT_ID);
        } else {
            $query->where(NotificationTemplateInterface::ATTR_TENANT_ID, $tenantId);
        }

        /** @var Collection<int, NotificationTemplate> $rows */
        $rows = $query->get();

        return $rows;
    }
}
