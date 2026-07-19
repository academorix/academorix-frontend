<?php

declare(strict_types=1);

/**
 * SettingScope Enum.
 *
 * Defines the hierarchy scopes for settings groups. Determines how a
 * group participates in the resolution chain: system → tenant → user.
 *
 * @category Enums
 *
 * @since    1.0.0
 */

namespace Academorix\Settings\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Enum;

/**
 * Settings hierarchy scope levels.
 */
enum SettingScope: string
{
    use Enum;

    /** Single global instance — no tenant/user overrides. */
    #[Label('System')]
    #[Description('Single global instance with no tenant or user overrides.')]
    case System = 'system';

    /** Supports tenant-level overrides via `tenant_{id}.{group}` keys. */
    #[Label('Tenant')]
    #[Description('Supports tenant-level overrides via tenant-scoped keys.')]
    case Tenant = 'tenant';

    /** Supports user-level preferences via `user_{id}.{group}` keys. */
    #[Label('User')]
    #[Description('Supports user-level preferences via user-scoped keys.')]
    case User = 'user';
}
