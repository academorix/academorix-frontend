<?php

/**
 * @file src/Settings/PaginationSettings.php
 *
 * @description
 * Cross-cutting pagination defaults. Ported from the recurring
 * `DEFAULT_PER_PAGE = 25` / `MAX_PER_PAGE = 100` pattern seen
 * in 6+ old-codebase modules (Access, Auth, Entitlements,
 * Subscription, User, plus Geography controllers). Pulled up to
 * `foundation` so every module reads from a single source of
 * truth instead of shipping its own pair of constants.
 *
 * ## Group key
 *
 * `pagination` — stored under `scope_values.namespace='settings'`
 * with keys `pagination.per_page_default` and
 * `pagination.per_page_max`.
 *
 * ## Scope
 *
 * `System` — tenants inherit the platform defaults. When a
 * deployment needs a tenant override (say, a plan-based higher
 * cap) the calling code should read via
 * `Scope::resolve('settings', 'pagination.per_page_max')` at
 * the tenant node, which cascades to the system value when the
 * tenant has no stored override.
 */

declare(strict_types=1);

namespace Academorix\Foundation\Settings;

use Academorix\Settings\Attributes\AsSetting;
use Academorix\Settings\Attributes\SettingField;
use Academorix\Settings\Enums\ControlType;
use Academorix\Settings\Enums\SettingScope;

/**
 * Platform-wide pagination defaults.
 *
 * ## Usage
 *
 * ```php
 * // Inside an action:
 * $perPage = (int) $request->query(
 *     'per_page',
 *     $settings->get('pagination.per_page_default')
 * );
 *
 * $max = (int) $settings->get('pagination.per_page_max');
 * $perPage = min($perPage, $max);
 * ```
 *
 * ## Rationale for the 25/100 defaults
 *
 * - 25 rows/page keeps the first paint under 40 KB for a typical
 *   API row payload (tenant listing, activity feed).
 * - 100 rows/page is the hard ceiling any operator would ever
 *   set — beyond that, admin UIs get sluggish on cheap laptops
 *   and cursor-based paginators pay more IO than they save.
 */
#[AsSetting(
    // The group key is what lands in `scope_values.key` as a
    // dot-prefix. Keeping it short + snake_case matches every
    // other framework setting we ship.
    group: 'pagination',
    label: 'Pagination',
    description: 'Platform-wide default and maximum page sizes for paginated endpoints.',
    icon: 'list',
    // `System` scope — one platform-wide value. Tenant-level
    // overrides are still possible via a Scope::write against a
    // tenant node, but that's an opt-in escape hatch, not a
    // default cascade tier.
    scope: SettingScope::System,
    sortOrder: 100,
)]
final class PaginationSettings
{
    /**
     * Default page size used when the caller doesn't send
     * `?per_page=`. 25 rows is a reasonable middle ground:
     * small enough for the first paint to stay snappy, large
     * enough that the average admin view fits on a single page
     * without an immediate second fetch.
     */
    #[SettingField(
        controlType: ControlType::Number,
        label: 'Default page size',
        description: 'Number of rows returned by paginated endpoints when the caller does not supply an explicit `per_page` value.',
        // Laravel validation is applied on PUT — bounds keep an
        // accidental `0` or negative from silently disabling
        // pagination altogether.
        validation: ['integer', 'min:1', 'max:1000'],
        min: 1,
        max: 1000,
        step: 1,
        sortOrder: 10,
    )]
    public int $per_page_default = 25;

    /**
     * Hard cap on the caller-supplied `?per_page=` value. Reject
     * anything larger with a 422 in the request-handling
     * middleware; falling back silently to the cap is the
     * documented convention across every module.
     */
    #[SettingField(
        controlType: ControlType::Number,
        label: 'Maximum page size',
        description: 'Hard ceiling on the caller-supplied `per_page` value. Requests exceeding this are clamped down (or 422-rejected, per the endpoint).',
        validation: ['integer', 'min:1', 'max:10000'],
        min: 1,
        max: 10000,
        step: 1,
        sortOrder: 20,
    )]
    public int $per_page_max = 100;
}
