<?php

declare(strict_types=1);

namespace Stackra\Attribution\Services;

use Stackra\Attribution\Contracts\Services\ReferrerNormalizerInterface;
use Stackra\Attribution\Data\NormalizedReferrerData;
use Illuminate\Container\Attributes\Singleton;

/**
 * Normalize an HTTP Referer header into a canonical domain +
 * search-engine classification.
 *
 * The Referer string comes in with lots of noise — protocol, www.
 * prefix, port, path, query, fragment. This service collapses it to
 * a canonical host + classifies it against a known engine catalogue
 * (google / bing / duckduckgo / yandex / yahoo / baidu). Unknown
 * hosts land in the `direct` / `referral` buckets.
 *
 * `#[Singleton]` — stateless.
 *
 * @category Attribution
 *
 * @since    0.1.0
 */
#[Singleton]
final class ReferrerNormalizer implements ReferrerNormalizerInterface
{
    /**
     * Known search engines. Value is the canonical name used in the
     * `attribution_touchpoints.referrer_engine` column.
     *
     * @var array<string, string>
     */
    private const array SEARCH_ENGINES = [
        'google.com'        => 'google',
        'google.co.uk'      => 'google',
        'google.co.jp'      => 'google',
        'google.de'         => 'google',
        'google.fr'         => 'google',
        'google.com.au'     => 'google',
        'bing.com'          => 'bing',
        'duckduckgo.com'    => 'duckduckgo',
        'yandex.com'        => 'yandex',
        'yandex.ru'         => 'yandex',
        'yahoo.com'         => 'yahoo',
        'search.yahoo.com'  => 'yahoo',
        'baidu.com'         => 'baidu',
        'ecosia.org'        => 'ecosia',
        'startpage.com'     => 'startpage',
        'brave.com'         => 'brave',
    ];

    /**
     * Known social platforms. Same shape.
     *
     * @var array<string, string>
     */
    private const array SOCIAL_PLATFORMS = [
        'facebook.com'       => 'facebook',
        'l.facebook.com'     => 'facebook',
        'm.facebook.com'     => 'facebook',
        'lm.facebook.com'    => 'facebook',
        'instagram.com'      => 'instagram',
        'l.instagram.com'    => 'instagram',
        'twitter.com'        => 'twitter',
        'x.com'              => 'twitter',
        't.co'               => 'twitter',
        'linkedin.com'       => 'linkedin',
        'lnkd.in'            => 'linkedin',
        'tiktok.com'         => 'tiktok',
        'youtube.com'        => 'youtube',
        'youtu.be'           => 'youtube',
        'reddit.com'         => 'reddit',
        'pinterest.com'      => 'pinterest',
        'threads.net'        => 'threads',
        'whatsapp.com'       => 'whatsapp',
        'wa.me'              => 'whatsapp',
    ];

    /**
     * {@inheritDoc}
     */
    public function normalize(?string $referer): NormalizedReferrerData
    {
        if ($referer === null || trim($referer) === '') {
            return new NormalizedReferrerData(
                raw: null,
                host: null,
                path: null,
                type: 'direct',
                engine: null,
            );
        }

        $parts = parse_url($referer);
        if ($parts === false || ! isset($parts['host'])) {
            // Malformed referer — treat as direct rather than
            // rejecting outright (analytics platforms surface these).
            return new NormalizedReferrerData(
                raw: $referer,
                host: null,
                path: null,
                type: 'direct',
                engine: null,
            );
        }

        $host = strtolower((string) $parts['host']);
        // Strip leading `www.` — every campaign renders the same
        // whether the visitor came from `www.google.com` or
        // `google.com`.
        if (str_starts_with($host, 'www.')) {
            $host = substr($host, 4);
        }
        $path = $parts['path'] ?? null;

        $engine = self::SEARCH_ENGINES[$host] ?? null;
        if ($engine !== null) {
            return new NormalizedReferrerData(
                raw: $referer,
                host: $host,
                path: $path,
                type: 'search',
                engine: $engine,
            );
        }

        $social = self::SOCIAL_PLATFORMS[$host] ?? null;
        if ($social !== null) {
            return new NormalizedReferrerData(
                raw: $referer,
                host: $host,
                path: $path,
                type: 'social',
                engine: $social,
            );
        }

        return new NormalizedReferrerData(
            raw: $referer,
            host: $host,
            path: $path,
            type: 'referral',
            engine: null,
        );
    }
}
