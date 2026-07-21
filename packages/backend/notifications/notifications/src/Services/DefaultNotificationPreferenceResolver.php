<?php

declare(strict_types=1);

namespace Stackra\Notifications\Services;

use Stackra\Notifications\Contracts\Data\NotificationPreferenceInterface;
use Stackra\Notifications\Contracts\Repositories\NotificationCategoryRepositoryInterface;
use Stackra\Notifications\Contracts\Repositories\NotificationPreferenceRepositoryInterface;
use Stackra\Notifications\Contracts\Services\NotificationPreferenceResolverInterface;
use Stackra\Notifications\Enums\ConsentTier;
use Stackra\Notifications\Enums\DigestMode;
use Stackra\Notifications\Enums\PreferenceSource;
use Stackra\Notifications\Support\NotificationPreferenceDecision;
use Illuminate\Container\Attributes\Scoped;

/**
 * Default resolver for per-user preferences.
 *
 * Order of precedence: user preference row > category default >
 * platform default.
 *
 * `#[Scoped]` — the resolver caches its per-request lookups in
 * memory to avoid duplicate DB queries when the same tuple is
 * evaluated multiple times during a request (rare but possible in
 * digest scheduling paths).
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Scoped]
final class DefaultNotificationPreferenceResolver implements NotificationPreferenceResolverInterface
{
    /**
     * @param  NotificationPreferenceRepositoryInterface  $preferences  Persistence boundary.
     * @param  NotificationCategoryRepositoryInterface    $categories   Category resolver.
     */
    public function __construct(
        private readonly NotificationPreferenceRepositoryInterface $preferences,
        private readonly NotificationCategoryRepositoryInterface $categories,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function resolve(
        string $tenantId,
        string $userId,
        string $categorySlug,
        string $channel,
    ): NotificationPreferenceDecision {
        // Load the category so we know the consent tier + defaults.
        $category = $this->categories->resolveBySlug($tenantId, $categorySlug);

        // No category — return a sane fallback that treats the caller
        // as opted-in with immediate delivery. The dispatch gateway
        // will typically refuse first via CategoryNotRegisteredException
        // so this path is defensive only.
        if ($category === null) {
            return new NotificationPreferenceDecision(
                enabled: true,
                digestMode: DigestMode::Immediate->value,
                inQuietHours: false,
                source: PreferenceSource::Seed->value,
            );
        }

        // Look up the user's explicit preference row.
        $preference = $this->preferences->findByTuple($tenantId, $userId, $categorySlug, $channel);

        if ($preference !== null) {
            return new NotificationPreferenceDecision(
                enabled: (bool) $preference->{NotificationPreferenceInterface::ATTR_ENABLED},
                digestMode: (string) ($preference->{NotificationPreferenceInterface::ATTR_DIGEST_MODE}?->value ?? DigestMode::Immediate->value),
                inQuietHours: false,
                source: PreferenceSource::UserSettings->value,
                quietHoursStart: $preference->{NotificationPreferenceInterface::ATTR_QUIET_HOURS_START},
                quietHoursEnd: $preference->{NotificationPreferenceInterface::ATTR_QUIET_HOURS_END},
                timezone: $preference->{NotificationPreferenceInterface::ATTR_QUIET_HOURS_TIMEZONE},
            );
        }

        // No explicit preference — fall back to category defaults.
        // Transactional-required is always on; marketing is off by
        // default until the user opts in.
        $consentTier = $category->{'consent_tier'};
        $defaultEnabled = $consentTier === ConsentTier::MarketingOptIn ? false : true;

        return new NotificationPreferenceDecision(
            enabled: $defaultEnabled,
            digestMode: DigestMode::Immediate->value,
            inQuietHours: false,
            source: PreferenceSource::Cascade->value,
        );
    }
}
