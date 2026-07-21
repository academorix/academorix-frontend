<?php

declare(strict_types=1);

namespace Stackra\Settings\Attributes;

use Attribute;

/**
 * Marker attribute for a Spatie Settings class managed by the
 * Stackra settings platform.
 *
 * Place on a class extending `Spatie\LaravelSettings\Settings` to
 * register the class with the {@see \Stackra\Settings\Registry\SettingsRegistry}.
 * The registry is hydrated at boot via the shared
 * `Stackra\Foundation\Contracts\DiscoversAttributes` seam
 * (no runtime reflection in hot paths).
 *
 * The `scope` field controls hierarchy resolution:
 *
 *   * `system` — one global instance, no tenant / user overrides.
 *   * `tenant` — supports tenant-level overrides via
 *     `tenant_{id}.{group}` keys.
 *   * `user` — supports user-level preferences via
 *     `user_{id}.{group}` keys.
 *
 * The `public` field determines whether the
 * `GET /api/v1/settings/{group}` endpoint requires authentication.
 * Public groups (e.g. theme tokens) are accessible without
 * authentication; non-public groups require the permission
 * specified in the `permission` field.
 *
 * ## Usage
 *
 * ```php
 * #[AsSetting(
 *     group: 'notifications',
 *     label: 'Notification Preferences',
 *     description: 'Configure email, SMS, and push settings.',
 *     icon: 'bell',
 *     permission: 'settings.notifications.read',
 *     scope: 'user',
 * )]
 * class NotificationSettings extends Settings { ... }
 * ```
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsSetting
{
    /**
     * @param  string  $group  Unique group key — used as the Spatie Settings group identifier AND the API route segment (`theme` → `/api/v1/settings/theme`). Must match the scope-consumer regex `^[a-z][a-z0-9_]{0,63}$`.
     * @param  string  $label  Human-readable display label for admin surfaces. Empty falls back to the group key.
     * @param  string  $description  Longer description text for admin surfaces.
     * @param  string  $icon  Icon identifier (e.g. `palette`, `bell`) — semantic name, not a HeroUI class.
     * @param  string  $permission  Permission gating the read endpoint; defaults to `settings.read`. Writes always require `settings.update`.
     * @param  string  $scope  Hierarchy scope: `system`, `tenant`, or `user`.
     * @param  bool  $public  Whether the GET endpoint is publicly accessible without auth. When `true`, broadcasts go on public channels.
     * @param  int  $sortOrder  Sort order in admin listings; lower values first.
     */
    public function __construct(
        public string $group,
        public string $label = '',
        public string $description = '',
        public string $icon = '',
        public string $permission = 'settings.read',
        public string $scope = 'system',
        public bool $public = false,
        public int $sortOrder = 0,
    ) {}
}
