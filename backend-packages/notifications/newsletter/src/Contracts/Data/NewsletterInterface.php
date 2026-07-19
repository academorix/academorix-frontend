<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Contracts\Data;

use Academorix\Newsletter\Models\Newsletter;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `newsletters` table.
 *
 * One editorial publication owned by a tenant. Carries the identity
 * (slug + name + cadence), branding + sender config, reputation
 * thresholds, and lifecycle state. Issues, subscriptions, campaigns,
 * and audiences all reference this row via `newsletter_id`.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Bind(Newsletter::class)]
interface NewsletterInterface
{
    /**
     * Table name.
     */
    public const string TABLE = 'newsletters';

    /**
     * Primary key column.
     */
    public const string PRIMARY_KEY = 'id';

    /**
     * Primary key type — string, prefixed ULID.
     */
    public const string KEY_TYPE = 'string';

    /**
     * ULID prefix — every generated id lands as `nlp_<ulid>`.
     */
    public const string ID_PREFIX = 'nlp';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID                     = 'id';
    public const string ATTR_TENANT_ID              = 'tenant_id';
    public const string ATTR_SLUG                   = 'slug';
    public const string ATTR_NAME                   = 'name';
    public const string ATTR_DESCRIPTION            = 'description';
    public const string ATTR_CADENCE                = 'cadence';
    public const string ATTR_STATUS                 = 'status';
    public const string ATTR_CONFIRMATION_REQUIRED  = 'confirmation_required';
    public const string ATTR_SENDER_CONFIG          = 'sender_config';
    public const string ATTR_BRAND                  = 'brand';
    public const string ATTR_REPUTATION_THRESHOLDS  = 'reputation_thresholds';
    public const string ATTR_REPUTATION_BREACH_STREAK = 'reputation_breach_streak';
    public const string ATTR_LAST_ISSUE_NUMBER      = 'last_issue_number';
    public const string ATTR_METADATA               = 'metadata';
    public const string ATTR_CREATED_BY             = 'created_by';
    public const string ATTR_UPDATED_BY             = 'updated_by';
    public const string ATTR_DELETED_BY             = 'deleted_by';
    public const string ATTR_CREATED_AT             = 'created_at';
    public const string ATTR_UPDATED_AT             = 'updated_at';
    public const string ATTR_DELETED_AT             = 'deleted_at';
}
