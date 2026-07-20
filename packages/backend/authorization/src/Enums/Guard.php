<?php

/**
 * @file packages/authorization/src/Enums/Guard.php
 *
 * @description
 * The set of authentication guards this package understands.
 * Named after Laravel's `auth.php` guard keys.
 *
 * ## Why an enum
 *
 * Guards are referenced as string keys in Laravel's config. That
 * makes them fragile — a typo (`'web'` vs `'weeb'`) fails silently
 * because the Auth facade falls back to the default guard. The
 * enum:
 *
 *   - Constrains guard references to a finite, IDE-visible set.
 *   - Enables PHPStan to verify guard usage across the codebase.
 *   - Provides a single source of truth for guard names when we
 *     eventually add more (SPA, mobile, MCP token).
 *
 * ## Guard semantics
 *
 *   - `Web` — cookie/session-based, used by the Blade admin
 *     surface (Horizon, Filament, custom admin panels).
 *   - `Api` — bearer-token based (`sanctum` by default), used by
 *     the JSON API surface. This is the default guard for
 *     `#[RequirePermission]` and friends.
 *
 * @see \Academorix\Authorization\Attributes\RequirePermission Consumers of this enum.
 */

declare(strict_types=1);

namespace Academorix\Authorization\Enums;

use Academorix\Enum\Enum;

enum Guard: string
{
    use Enum;

    /**
     * Cookie/session-backed guard. Used by web / admin surfaces.
     */
    case Web = 'web';

    /**
     * Bearer-token-backed guard. Used by the JSON API surface.
     * Default for controller authorization attributes.
     */
    case Api = 'api';

    /**
     * Tenant-user guard as configured in a Laravel Sanctum-based
     * app. Present so `packages/access` can persist role /
     * permission rows under the exact `guard_name` values the
     * `auth.guards.sanctum` config entry advertises.
     */
    case Sanctum = 'sanctum';

    /**
     * Platform-admin guard as configured in an
     * `auth.guards.platform_admin` entry. Isolates platform-scoped
     * roles / permissions from the tenant tree.
     */
    case PlatformAdmin = 'platform_admin';
}
