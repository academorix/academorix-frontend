<?php

declare(strict_types=1);

namespace Stackra\PlatformIntegrationsSdk\Enums;

/**
 * Wire-visible backed enum for `tenant-integration.last_sync_status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category IntegrationsSdk
 *
 * @since    0.1.0
 */
enum TenantIntegrationLastSyncStatus: string
{
    case Unknown = 'unknown';
    case Success = 'success';
    case Partial = 'partial';
    case Failed = 'failed';
}
