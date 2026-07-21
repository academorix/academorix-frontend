<?php

declare(strict_types=1);

namespace Stackra\Notifications\Contracts\Services;

use Stackra\Notifications\Services\NotificationCategoryRegistry;
use Illuminate\Container\Attributes\Bind;

/**
 * In-memory registry of every `#[NotificationCategory]`-marked class
 * discovered at boot AND every category row persisted through the
 * seed pipeline.
 *
 * The dispatch gateway consults this registry when resolving whether a
 * category slug is registered; downstream admin surfaces read `all()`
 * to render the category picker.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Bind(NotificationCategoryRegistry::class)]
interface NotificationCategoryRegistryInterface
{
    /**
     * Register a category. Called by the discovery bootstrapper AND by
     * the seed command as it upserts rows.
     *
     * @param  string        $slug             Module-namespaced slug (e.g. `invitations.invitation_sent`).
     * @param  string        $owningModule     Owning module identifier.
     * @param  string        $displayName      Admin-facing display name.
     * @param  list<string>  $defaultChannels  Default channel keys.
     * @param  string        $priority         Priority tier (critical / transactional / product / marketing).
     * @param  string        $consentTier      Consent tier identifier.
     * @param  bool          $optOutAllowed    Whether users can opt out.
     * @param  bool          $isSystem         Whether this is a platform default (not a tenant override).
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
    ): void;

    /**
     * Whether a category with `$slug` is registered.
     */
    public function has(string $slug): bool;

    /**
     * Every registered category keyed by slug.
     *
     * @return array<string, array{owning_module: string, display_name: string, default_channels: list<string>, priority: string, consent_tier: string, opt_out_allowed: bool, is_system: bool}>
     */
    public function all(): array;
}
