<?php

declare(strict_types=1);

namespace Academorix\Integrations\Contracts\Data;

use Academorix\Integrations\Models\TenantIntegration;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `tenant_integrations` table.
 *
 * One row per (Tenant × integration kind × provider). Config blob is
 * encrypted at rest via the {@see \Academorix\Integrations\Casts\IntegrationConfig}
 * cast. Partial-unique on `(tenant_id, kind, is_active) WHERE
 * is_active = TRUE` — at most one ACTIVE integration per kind per
 * tenant.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[Bind(TenantIntegration::class)]
interface TenantIntegrationInterface
{
    public const string TABLE = 'tenant_integrations';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'wit';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID               = 'id';
    public const string ATTR_TENANT_ID        = 'tenant_id';
    public const string ATTR_KIND             = 'kind';
    public const string ATTR_PROVIDER         = 'provider';
    public const string ATTR_NAME             = 'name';
    public const string ATTR_CONFIG           = 'config';
    public const string ATTR_IS_ACTIVE        = 'is_active';
    public const string ATTR_LAST_SYNC_AT     = 'last_sync_at';
    public const string ATTR_LAST_SYNC_STATUS = 'last_sync_status';
    public const string ATTR_LAST_SYNC_ERROR  = 'last_sync_error';
    public const string ATTR_NEXT_SYNC_AT     = 'next_sync_at';
    public const string ATTR_SYNC_CURSOR      = 'sync_cursor';
    public const string ATTR_METADATA         = 'metadata';
    public const string ATTR_CREATED_BY       = 'created_by';
    public const string ATTR_UPDATED_BY       = 'updated_by';
    public const string ATTR_DELETED_BY       = 'deleted_by';
    public const string ATTR_CREATED_AT       = 'created_at';
    public const string ATTR_UPDATED_AT       = 'updated_at';
    public const string ATTR_DELETED_AT       = 'deleted_at';
}
