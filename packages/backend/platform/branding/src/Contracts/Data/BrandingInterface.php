<?php

declare(strict_types=1);

namespace Stackra\Branding\Contracts\Data;

use Stackra\Branding\Models\Branding;
use Illuminate\Container\Attributes\Bind;

/**
 * Table shape for the `brandings` table.
 *
 * Theme + palette + logo profile per Tenant. Multiple profiles per
 * tenant supported (day/night, per-domain, seasonal). Exactly one row
 * per tenant with `is_default = true` — denormalised into
 * `tenants.branding` (JSONB) by TenantObserver on save.
 *
 * @category Branding
 *
 * @since    0.1.0
 */
#[Bind(Branding::class)]
interface BrandingInterface
{
    public const string TABLE = 'brandings';

    public const string PRIMARY_KEY = 'id';

    public const string KEY_TYPE = 'string';

    public const string ID_PREFIX = 'brd';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID               = 'id';
    public const string ATTR_TENANT_ID        = 'tenant_id';
    public const string ATTR_DOMAIN_ID        = 'domain_id';
    public const string ATTR_NAME             = 'name';
    public const string ATTR_IS_DEFAULT       = 'is_default';
    public const string ATTR_THEME            = 'theme';
    public const string ATTR_LOGO_URL         = 'logo_url';
    public const string ATTR_LOGO_DARK_URL    = 'logo_dark_url';
    public const string ATTR_FAVICON_URL      = 'favicon_url';
    public const string ATTR_PRIMARY_COLOR    = 'primary_color';
    public const string ATTR_SECONDARY_COLOR  = 'secondary_color';
    public const string ATTR_ACCENT_COLOR     = 'accent_color';
    public const string ATTR_BACKGROUND_COLOR = 'background_color';
    public const string ATTR_SURFACE_COLOR    = 'surface_color';
    public const string ATTR_TEXT_COLOR       = 'text_color';
    public const string ATTR_FONT_STACK       = 'font_stack';
    public const string ATTR_CUSTOM_FONT_URL  = 'custom_font_url';
    public const string ATTR_CSS_VARIABLES    = 'css_variables';
    public const string ATTR_METADATA         = 'metadata';
    public const string ATTR_TRANSLATIONS     = 'translations';
    public const string ATTR_CREATED_BY       = 'created_by';
    public const string ATTR_UPDATED_BY       = 'updated_by';
    public const string ATTR_DELETED_BY       = 'deleted_by';
    public const string ATTR_CREATED_AT       = 'created_at';
    public const string ATTR_UPDATED_AT       = 'updated_at';
    public const string ATTR_DELETED_AT       = 'deleted_at';
}
