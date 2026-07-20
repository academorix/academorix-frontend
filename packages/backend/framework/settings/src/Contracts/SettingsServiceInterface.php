<?php

declare(strict_types=1);

namespace Academorix\Settings\Contracts;

use Academorix\Settings\Services\SettingsService;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Container\Attributes\Scoped;

/**
 * Contract for the settings management service.
 *
 * Reads + writes flow through the `academorix/scope` substrate —
 * every operation is scoped to the active context established by
 * the `scope` middleware. Callers don't pass tenant / user
 * arguments; the substrate handles the cascade.
 *
 * Preset application lives in the sibling `academorix/theme`
 * package's `ApplyThemePreset` action, which reads the preset row
 * and calls `updateGroup()` on this service.
 *
 * Audit trail is written by two `SettingsChangeEvent` listeners
 * shipped in this package — one persists to `activity_log` (via
 * `academorix/activity`), the other to `audits` (via
 * `academorix/audit`). No configuration knobs; both fire on every
 * successful update.
 *
 * Bound to {@see SettingsService} as a request-scoped singleton
 * via `#[Bind]` + `#[Scoped]`.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Bind(SettingsService::class)]
#[Scoped]
interface SettingsServiceInterface
{
    /**
     * Fetch the resolved values for a group at the current scope.
     *
     * The scope substrate walks the active node's materialised
     * path (`global → application → tenant → org → region →
     * branch → team → user`) and returns the first stored value
     * per key. Fields with no stored value fall back to the
     * Spatie Settings class's property default.
     *
     * @return array<string, mixed>
     *
     * @throws \InvalidArgumentException When the group is not registered.
     * @throws \Academorix\Scope\Exceptions\ScopeContextRequiredException When there's no active scope context.
     */
    public function getGroup(string $group): array;

    /**
     * Partial-update a group at the current scope's node.
     *
     * Merges `$values` over the existing resolved values, persists
     * only changed fields, and dispatches `SettingsChangeEvent`
     * (which the shipped listeners fan out to `activity_log` +
     * `audits`).
     *
     * @param  array<string, mixed>  $values
     * @return array<string, mixed>  The full merged result after write.
     *
     * @throws \InvalidArgumentException When the group is not registered.
     * @throws \Academorix\Scope\Exceptions\ScopeContextRequiredException When there's no active scope context.
     */
    public function updateGroup(string $group, array $values): array;

    /**
     * The full admin-UI schema, optionally filtered by a
     * required-permission string. When `null`, every group is
     * returned; the outer HTTP layer is responsible for filtering
     * by the caller's actual grants.
     *
     * @return list<array<string, mixed>>
     */
    public function getSchema(?string $permission = null): array;
}
