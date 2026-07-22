<?php

declare(strict_types=1);

namespace Stackra\Notifications\Push\Contracts\Data;

use Stackra\Notifications\Push\Models\PushSubscription;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `push_subscriptions` table.
 *
 * One device token registration per user + application. `device_token` is
 * RESTRICTED tier — AES-256 encrypted at rest via `encrypted` cast, never
 * returned by any API response, only decrypted server-side inside SendPushJob
 * for the provider call. `device_token_fingerprint` (SHA-256 of the token) is
 * the non-secret admin-visible identifier used for duplicate detection +
 * support diagnostics.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[Bind(PushSubscription::class)]
interface PushSubscriptionInterface
{
    public const string TABLE = 'push_subscriptions';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'psub';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                        = 'id';
    public const string ATTR_TENANT_ID                 = 'tenant_id';
    public const string ATTR_USER_ID                   = 'user_id';
    public const string ATTR_PROVIDER                  = 'provider';
    public const string ATTR_PLATFORM                  = 'platform';
    public const string ATTR_DEVICE_TOKEN              = 'device_token';
    public const string ATTR_DEVICE_TOKEN_FINGERPRINT  = 'device_token_fingerprint';
    public const string ATTR_DEVICE_NAME               = 'device_name';
    public const string ATTR_APP_VERSION               = 'app_version';
    public const string ATTR_OS_VERSION                = 'os_version';
    public const string ATTR_LOCALE                    = 'locale';
    public const string ATTR_TIMEZONE                  = 'timezone';
    public const string ATTR_IS_ACTIVE                 = 'is_active';
    public const string ATTR_LAST_SEEN_AT              = 'last_seen_at';
    public const string ATTR_EXPIRES_AT                = 'expires_at';
    public const string ATTR_INVALID_TOKEN_REPORTED_AT = 'invalid_token_reported_at';
    public const string ATTR_METADATA                  = 'metadata';
    public const string ATTR_CREATED_BY                = 'created_by';
    public const string ATTR_UPDATED_BY                = 'updated_by';
    public const string ATTR_DELETED_BY                = 'deleted_by';
    public const string ATTR_CREATED_AT                = 'created_at';
    public const string ATTR_UPDATED_AT                = 'updated_at';
    public const string ATTR_DELETED_AT                = 'deleted_at';
}
