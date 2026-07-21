<?php

declare(strict_types=1);

namespace Stackra\Notifications\InApp\Contracts\Data;

use Stackra\Notifications\InApp\Models\InAppMessageRead;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `in_app_message_reads` table.
 *
 * Per-user read / dismissed state for an {@see InAppMessageInterface}
 * row. One row per `(in_app_message_id, addressee_id)` tracking:
 *
 *   - `read_at`      — first-view timestamp (viewed in a modal /
 *                       expanded in the drawer).
 *   - `dismissed_at` — user clicked dismiss on the bell UI.
 *
 * Kept as a sibling table (rather than columns on
 * `in_app_messages`) so the message row itself stays immutable and
 * concurrency-safe under fan-out to N recipients.
 *
 * @category NotificationsInApp
 *
 * @since    0.1.0
 */
#[Bind(InAppMessageRead::class)]
interface InAppMessageReadInterface
{
    /**
     * Table name.
     */
    public const string TABLE = 'in_app_message_reads';

    /**
     * Primary key column.
     */
    public const string PRIMARY_KEY = 'id';

    /**
     * Primary key type — string, prefixed ULID.
     */
    public const string KEY_TYPE = 'string';

    /**
     * ULID prefix — every generated id lands as `iar_<ulid>`.
     */
    public const string ID_PREFIX = 'iar';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                = 'id';
    public const string ATTR_TENANT_ID         = 'tenant_id';
    public const string ATTR_IN_APP_MESSAGE_ID = 'in_app_message_id';
    public const string ATTR_ADDRESSEE_ID      = 'addressee_id';
    public const string ATTR_ADDRESSEE_TYPE    = 'addressee_type';
    public const string ATTR_READ_AT           = 'read_at';
    public const string ATTR_DISMISSED_AT      = 'dismissed_at';
    public const string ATTR_METADATA          = 'metadata';
    public const string ATTR_CREATED_BY        = 'created_by';
    public const string ATTR_UPDATED_BY        = 'updated_by';
    public const string ATTR_CREATED_AT        = 'created_at';
    public const string ATTR_UPDATED_AT        = 'updated_at';
}
