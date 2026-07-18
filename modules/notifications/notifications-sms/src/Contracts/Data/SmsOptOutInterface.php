<?php

declare(strict_types=1);

namespace Academorix\Notifications\Sms\Contracts\Data;

use Academorix\Notifications\Sms\Models\SmsOptOut;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `sms_opt_outs` table.
 *
 * TCPA + CASL evidence-grade opt-out records. `tenant_id` is nullable so a
 * row with `tenant_id = NULL` is a platform-wide opt-out (known bad numbers,
 * spam-trap short codes). Tenant admins own their tenant's rows.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[Bind(SmsOptOut::class)]
interface SmsOptOutInterface
{
    public const string TABLE = 'sms_opt_outs';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'sopt';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                   = 'id';
    public const string ATTR_TENANT_ID            = 'tenant_id';
    public const string ATTR_PHONE                = 'phone';
    public const string ATTR_PHONE_COUNTRY_CODE   = 'phone_country_code';
    public const string ATTR_REASON               = 'reason';
    public const string ATTR_PROVIDER             = 'provider';
    public const string ATTR_SOURCE_DELIVERY_ID   = 'source_delivery_id';
    public const string ATTR_INBOUND_MESSAGE_BODY = 'inbound_message_body';
    public const string ATTR_IS_SYSTEM            = 'is_system';
    public const string ATTR_OPTED_OUT_AT         = 'opted_out_at';
    public const string ATTR_EXPIRES_AT           = 'expires_at';
    public const string ATTR_METADATA             = 'metadata';
    public const string ATTR_CREATED_BY           = 'created_by';
    public const string ATTR_UPDATED_BY           = 'updated_by';
    public const string ATTR_DELETED_BY           = 'deleted_by';
    public const string ATTR_CREATED_AT           = 'created_at';
    public const string ATTR_UPDATED_AT           = 'updated_at';
    public const string ATTR_DELETED_AT           = 'deleted_at';
}
