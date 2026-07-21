<?php

declare(strict_types=1);

/**
 * Settings Change Event.
 *
 * Dispatched when one or more settings fields are successfully updated
 * in a settings group. Carries the group key, the list of changed field
 * keys, the new values for those fields, an optional tenant ID for
 * scoped changes, and a server timestamp.
 *
 * Implements {@see ShouldBroadcast} to propagate changes in real-time
 * to all connected clients (web, mobile, desktop) via Laravel Broadcasting
 * (Redis → Soketi → Laravel Echo).
 *
 * ## Broadcasting Channels:
 * - **System-level**: `settings.{group}` — public channel if the group
 *   is marked as public in its `#[AsSetting]` definition, otherwise a
 *   private channel requiring authentication.
 * - **Tenant-scoped**: `settings.{group}.tenant.{tenantId}` — always a
 *   private channel requiring authentication.
 *
 * ## Payload:
 * ```json
 * {
 *     "group": "theme",
 *     "changed_fields": ["accent", "background"],
 *     "values": {"accent": "oklch(0.7 0.2 260)", "background": "oklch(0.98 0 0)"},
 *     "timestamp": 1719849600
 * }
 * ```
 *
 * @category Events
 *
 * @since    1.0.0
 *
 * @see \Stackra\Settings\Services\SettingsService::updateGroup()
 * @see \Stackra\Settings\Contracts\SettingsRegistryInterface
 */

namespace Stackra\Settings\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Stackra\Events\Attributes\AsEvent;
use Stackra\Settings\Contracts\SettingsRegistryInterface;

/**
 * Settings Change Event.
 *
 * Fired when settings are successfully updated in a group.
 * Implements ShouldBroadcast to notify all connected clients in real-time.
 *
 * Usage:
 *   ```php
 *   Event::dispatch(new SettingsChangeEvent(
 *       group: 'theme',
 *       changedFields: ['accent', 'background'],
 *       values: ['accent' => 'oklch(0.7 0.2 260)', 'background' => 'oklch(0.98 0 0)'],
 *       tenantId: null,
 *       timestamp: time(),
 *   ));
 *   ```
 */
#[AsEvent(description: 'Fired when settings are successfully updated in a group.', broadcastable: true)]
final readonly class SettingsChangeEvent implements ShouldBroadcast
{
    /**
     * Create a new SettingsChangeEvent instance.
     *
     * @param  string               $group          The settings group key (e.g., `theme`, `notifications`).
     * @param  array<int, string>   $changedFields  The list of field keys that were changed.
     * @param  array<string, mixed> $values         The new values for the changed fields.
     * @param  int|null             $tenantId       Optional tenant ID for tenant-scoped changes.
     * @param  int                  $timestamp      Unix timestamp of when the change occurred.
     */
    public function __construct(
        /**
         * @var string The settings group key (e.g., `theme`, `notifications`).
         */
        public string $group,

        /**
         * @var array<int, string> The list of field keys that were changed.
         */
        public array $changedFields,

        /**
         * @var array<string, mixed> The new values for the changed fields.
         */
        public array $values,

        /**
         * @var int|null Optional tenant ID for tenant-scoped changes.
         */
        public ?int $tenantId,

        /**
         * @var int Unix timestamp of when the change occurred.
         */
        public int $timestamp,
    ) {}

    // =========================================================================
    // ShouldBroadcast
    // =========================================================================

    /**
     * Get the channels the event should broadcast on.
     *
     * Returns the appropriate channel(s) based on the change scope:
     * - **Tenant-scoped** (tenantId is set): broadcasts on a private
     *   channel `settings.{group}.tenant.{tenantId}`.
     * - **System-level** (no tenantId): broadcasts on `settings.{group}`.
     *   Uses a public {@see Channel} if the group is marked as public
     *   in the registry, otherwise uses a {@see PrivateChannel}.
     *
     * @return array<int, Channel|PrivateChannel> The broadcast channels.
     */
    public function broadcastOn(): array
    {
        $channels = [];

        // Tenant-scoped channel (always private — requires authentication)
        if ($this->tenantId !== null) {
            $channels[] = new PrivateChannel("settings.{$this->group}.tenant.{$this->tenantId}");
        }

        // System-level channel — public or private based on group definition
        if ($this->isPublicGroup()) {
            $channels[] = new Channel("settings.{$this->group}");
        } else {
            $channels[] = new PrivateChannel("settings.{$this->group}");
        }

        return $channels;
    }

    /**
     * Get the broadcast event name.
     *
     * All settings change broadcasts use the same event name so that
     * clients can listen on a single event type across all groups.
     *
     * @return string The event name for the broadcast payload.
     */
    public function broadcastAs(): string
    {
        return 'settings.changed';
    }

    /**
     * Get the data to broadcast.
     *
     * Returns the payload containing the group key, changed field keys,
     * new values, and server timestamp. The tenant ID is intentionally
     * excluded from the payload because it is encoded in the channel
     * name for tenant-scoped broadcasts.
     *
     * @return array{
     *     group: string,
     *     changed_fields: array<int, string>,
     *     values: array<string, mixed>,
     *     timestamp: int,
     * }
     */
    public function broadcastWith(): array
    {
        return [
            'group' => $this->group,
            'changed_fields' => $this->changedFields,
            'values' => $this->values,
            'timestamp' => $this->timestamp,
        ];
    }

    // =========================================================================
    // PRIVATE — HELPERS
    // =========================================================================

    /**
     * Determine whether the settings group is marked as public.
     *
     * Resolves the group definition from the {@see SettingsRegistryInterface}
     * and checks the `public` flag. If the registry is unavailable or the
     * group is not registered, defaults to private (non-public) for safety.
     *
     * @return bool True if the group is public, false otherwise.
     */
    private function isPublicGroup(): bool
    {
        try {
            /** @var SettingsRegistryInterface|null $registry */
            $registry = resolve(SettingsRegistryInterface::class);

            if ($registry === null) {
                return false;
            }

            $definition = $registry->get($this->group);

            return $definition?->public ?? false;
        } catch (\Throwable) {
            // If the registry is unavailable, default to private for safety
            return false;
        }
    }
}
