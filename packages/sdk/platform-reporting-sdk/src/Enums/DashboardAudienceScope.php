<?php

declare(strict_types=1);

namespace Academorix\PlatformReportingSdk\Enums;

/**
 * Wire-visible backed enum for `dashboard.audience_scope`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category ReportingSdk
 *
 * @since    0.1.0
 */
enum DashboardAudienceScope: string
{
    case Private = 'private';
    case SharedWithRole = 'shared_with_role';
    case SharedWithTenant = 'shared_with_tenant';
    case Public = 'public';
}
