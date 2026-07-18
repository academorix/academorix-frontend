<?php

declare(strict_types=1);

namespace Academorix\Settings\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Which scope a {@see \Academorix\Settings\Models\SettingValue}
 * belongs to in the resolver's cascade.
 *
 * The resolver walks user → tenant → system deepest-first. `org` and
 * `branch` levels are reserved for the scope module wave and are
 * deliberately absent here.
 *
 * ## Cases
 *
 *  * {@see self::System} — platform default seeded by the discovery
 *    pass. `scope_id` is always NULL.
 *  * {@see self::Tenant} — per-tenant override. `scope_id` = tenant id.
 *  * {@see self::User}   — per-user override. `scope_id` = user id.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum SettingScopeKind: string
{
    use Enum;

    #[Label('System')]
    #[Description('Platform default. Seeded from #[SettingField] defaults; scope_id is NULL.')]
    case System = 'system';

    #[Label('Tenant')]
    #[Description('Per-tenant override. scope_id references the tenant id.')]
    case Tenant = 'tenant';

    #[Label('User')]
    #[Description('Per-user override. scope_id references the user id.')]
    case User = 'user';
}
