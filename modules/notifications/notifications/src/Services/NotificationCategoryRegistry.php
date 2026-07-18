<?php

declare(strict_types=1);

namespace Academorix\Notifications\Services;

use Academorix\Notifications\Contracts\Services\NotificationCategoryRegistryInterface;
use Illuminate\Container\Attributes\Singleton;

/**
 * In-memory registry of every notification category the platform + its
 * tenants know about.
 *
 * Populated by the seed pipeline (`notifications:seed-categories`)
 * and by module discovery. Idempotent — registering the same slug
 * twice overwrites in place.
 *
 * `#[Singleton]` — the registry is a pure function of the composed
 * modules; same output every boot, safely shared across every
 * request under Octane.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Singleton]
final class NotificationCategoryRegistry implements NotificationCategoryRegistryInterface
{
    /**
     * Registered categories keyed by slug.
     *
     * @var array<string, array{owning_module: string, display_name: string, default_channels: list<string>, priority: string, consent_tier: string, opt_out_allowed: bool, is_system: bool}>
     */
    private array $categories = [];

    /**
     * {@inheritDoc}
     */
    public function register(
        string $slug,
        string $owningModule,
        string $displayName,
        array $defaultChannels,
        string $priority,
        string $consentTier,
        bool $optOutAllowed,
        bool $isSystem,
    ): void {
        $this->categories[$slug] = [
            'owning_module'    => $owningModule,
            'display_name'     => $displayName,
            'default_channels' => \array_values($defaultChannels),
            'priority'         => $priority,
            'consent_tier'     => $consentTier,
            'opt_out_allowed'  => $optOutAllowed,
            'is_system'        => $isSystem,
        ];
    }

    /**
     * {@inheritDoc}
     */
    public function has(string $slug): bool
    {
        return isset($this->categories[$slug]);
    }

    /**
     * {@inheritDoc}
     */
    public function all(): array
    {
        return $this->categories;
    }
}
