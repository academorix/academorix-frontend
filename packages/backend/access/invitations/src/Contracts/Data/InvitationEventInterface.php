<?php

declare(strict_types=1);

namespace Stackra\Invitations\Contracts\Data;

use Stackra\Invitations\Models\InvitationEvent;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `invitation_events` table.
 *
 * Append-only audit funnel log — one row per state transition or
 * transport signal for an invitation (`sent`, `delivered`, `opened`,
 * `clicked`, `accepted`, `declined`, `expired`, `revoked`, `bounced`,
 * `resent`, `preflight_failed`). `signal_id` + `transport` uniquely
 * identify a mail-transport webhook signal to enforce idempotency.
 *
 * @category Invitations
 *
 * @since    0.1.0
 */
#[Bind(InvitationEvent::class)]
interface InvitationEventInterface
{
    public const string TABLE = 'invitation_events';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'ive';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID             = 'id';
    public const string ATTR_INVITATION_ID  = 'invitation_id';
    public const string ATTR_TENANT_ID      = 'tenant_id';
    public const string ATTR_EVENT          = 'event';
    public const string ATTR_OCCURRED_AT    = 'occurred_at';
    public const string ATTR_ACTOR_TYPE     = 'actor_type';
    public const string ATTR_ACTOR_ID       = 'actor_id';
    public const string ATTR_TRANSPORT      = 'transport';
    public const string ATTR_SIGNAL_ID      = 'signal_id';
    public const string ATTR_IP_ADDRESS     = 'ip_address';
    public const string ATTR_USER_AGENT     = 'user_agent';
    public const string ATTR_COUNTRY_CODE   = 'country_code';
    public const string ATTR_CITY           = 'city';
    public const string ATTR_ERROR_CODE     = 'error_code';
    public const string ATTR_ERROR_MESSAGE  = 'error_message';
    public const string ATTR_METADATA       = 'metadata';
    public const string ATTR_CREATED_AT     = 'created_at';
}
