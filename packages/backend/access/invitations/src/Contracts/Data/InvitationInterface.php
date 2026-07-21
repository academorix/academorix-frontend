<?php

declare(strict_types=1);

namespace Stackra\Invitations\Contracts\Data;

use Stackra\Invitations\Models\Invitation;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `invitations` table.
 *
 * One token-based invitation targeting a polymorphic host (Tenant,
 * Team, Athlete, Federation, TrialSession, ...) issued by a
 * polymorphic inviter (User, ServiceAccount, or the system). Every
 * column referenced by the module goes through the `ATTR_*`
 * constants below.
 *
 * @category Invitations
 *
 * @since    0.1.0
 */
#[Bind(Invitation::class)]
interface InvitationInterface
{
    public const string TABLE = 'invitations';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'inv';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                  = 'id';
    public const string ATTR_APPLICATION_ID      = 'application_id';
    public const string ATTR_TENANT_ID           = 'tenant_id';
    public const string ATTR_TARGET_TYPE         = 'target_type';
    public const string ATTR_TARGET_ID           = 'target_id';
    public const string ATTR_INVITER_TYPE        = 'inviter_type';
    public const string ATTR_INVITER_ID          = 'inviter_id';
    public const string ATTR_EMAIL               = 'email';
    public const string ATTR_CHANNEL             = 'channel';
    public const string ATTR_ROLE_KEY            = 'role_key';
    public const string ATTR_GRANTS              = 'grants';
    public const string ATTR_MESSAGE             = 'message';
    public const string ATTR_STATE               = 'state';
    public const string ATTR_TOKEN_HASH          = 'token_hash';
    public const string ATTR_TOKEN_PREFIX        = 'token_prefix';
    public const string ATTR_EXPIRES_AT          = 'expires_at';
    public const string ATTR_RESEND_COUNT        = 'resend_count';
    public const string ATTR_LAST_RESENT_AT      = 'last_resent_at';
    public const string ATTR_SENT_AT             = 'sent_at';
    public const string ATTR_DELIVERED_AT        = 'delivered_at';
    public const string ATTR_OPENED_AT           = 'opened_at';
    public const string ATTR_CLICKED_AT          = 'clicked_at';
    public const string ATTR_ACCEPTED_AT         = 'accepted_at';
    public const string ATTR_ACCEPTED_BY_USER_ID = 'accepted_by_user_id';
    public const string ATTR_DECLINED_AT         = 'declined_at';
    public const string ATTR_DECLINED_REASON     = 'declined_reason';
    public const string ATTR_EXPIRED_AT          = 'expired_at';
    public const string ATTR_REVOKED_AT          = 'revoked_at';
    public const string ATTR_REVOKED_BY_USER_ID  = 'revoked_by_user_id';
    public const string ATTR_REVOKED_REASON      = 'revoked_reason';
    public const string ATTR_BOUNCE_KIND         = 'bounce_kind';
    public const string ATTR_BOUNCE_REASON       = 'bounce_reason';
    public const string ATTR_METADATA            = 'metadata';
    public const string ATTR_CREATED_BY          = 'created_by';
    public const string ATTR_UPDATED_BY          = 'updated_by';
    public const string ATTR_DELETED_BY          = 'deleted_by';
    public const string ATTR_CREATED_AT          = 'created_at';
    public const string ATTR_UPDATED_AT          = 'updated_at';
    public const string ATTR_DELETED_AT          = 'deleted_at';
}
