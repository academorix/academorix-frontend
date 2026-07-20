<?php

declare(strict_types=1);

namespace Academorix\PlatformReportingSdk\Enums;

/**
 * Wire-visible backed enum for `report-definition.audience_scope`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category ReportingSdk
 *
 * @since    0.1.0
 */
enum ReportDefinitionAudienceScope: string
{
    case TenantAdmin = 'tenant_admin';
    case BranchManager = 'branch_manager';
    case Hr = 'hr';
    case Finance = 'finance';
    case Coach = 'coach';
    case Public = 'public';
}
