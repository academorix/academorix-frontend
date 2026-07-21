<?php

declare(strict_types=1);

namespace Stackra\Localization\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Which strategy in the resolution chain produced the active locale.
 *
 * Emitted on the `LocaleResolved` event so telemetry can graph the
 * distribution of resolution paths across a tenant fleet.
 *
 * ## Cases
 *
 *  * {@see self::Query}          — `?locale=` query parameter.
 *  * {@see self::Header}         — `X-Locale` request header.
 *  * {@see self::User}           — authenticated user's stored preference.
 *  * {@see self::Tenant}         — tenant's default locale.
 *  * {@see self::AcceptLanguage} — parsed `Accept-Language` header.
 *  * {@see self::Subdomain}      — subdomain hint (`fr.example.com`).
 *  * {@see self::AppDefault}     — config fallback.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum LocaleResolutionSource: string
{
    use Enum;

    #[Label('Query parameter')]
    #[Description('The `?locale=` query parameter was set on the incoming request.')]
    case Query = 'query';

    #[Label('Request header')]
    #[Description('The `X-Locale` request header was set on the incoming request.')]
    case Header = 'header';

    #[Label('User preference')]
    #[Description('The authenticated user\'s stored preferred_locale profile field.')]
    case User = 'user';

    #[Label('Tenant default')]
    #[Description('The tenant\'s TenantLocale row with is_default=true.')]
    case Tenant = 'tenant';

    #[Label('Accept-Language')]
    #[Description('The Accept-Language header, matched against the tenant\'s enabled locales with quality-value awareness.')]
    case AcceptLanguage = 'accept_language';

    #[Label('Subdomain')]
    #[Description('The request Host header included a subdomain matching the configured subdomain pattern.')]
    case Subdomain = 'subdomain';

    #[Label('App default')]
    #[Description('The final fallback — config(\'localization.default_locale\').')]
    case AppDefault = 'app_default';
}
