<?php

declare(strict_types=1);

namespace Academorix\Geography\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * The deciding source of a resolved geolocation.
 *
 * ## Cases
 *
 *  * {@see self::MaxMind} — the local GeoLite2 city database resolved
 *    the IP. Primary source; low-latency; no outbound traffic.
 *  * {@see self::IpApi}   — ip-api.com resolved the IP after MaxMind
 *    returned nothing or was unavailable. Fallback source; rate-limited
 *    by the vendor (45 req/min per source IP on the free tier).
 *  * {@see self::Cache}   — the resolution came from the local Redis
 *    cache. Neither MaxMind nor ip-api.com was consulted this request.
 *
 * Consumers filter their metrics by source to spot MaxMind DB drift
 * (a sudden surge of `ip_api` decisions means the primary source is
 * failing) and to distinguish billable ip-api.com hits from cache hits.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum GeolocationSource: string
{
    use Enum;

    /**
     * MaxMind GeoLite2 — the primary local database.
     */
    #[Label('MaxMind GeoLite2')]
    #[Description('Local GeoLite2-City database (primary source).')]
    case MaxMind = 'maxmind';

    /**
     * ip-api.com — the fallback public API.
     */
    #[Label('ip-api.com')]
    #[Description('ip-api.com public API (fallback source).')]
    case IpApi = 'ip_api';

    /**
     * The response was served from the local Redis cache.
     */
    #[Label('Cache')]
    #[Description('Response served from the local Redis cache. No outbound traffic.')]
    case Cache = 'cache';
}
