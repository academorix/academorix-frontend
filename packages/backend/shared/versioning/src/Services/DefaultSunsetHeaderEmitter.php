<?php

declare(strict_types=1);

namespace Stackra\Versioning\Services;

use Stackra\Versioning\Contracts\Data\ApiVersionInterface;
use Stackra\Versioning\Contracts\Repositories\ApiVersionRepositoryInterface;
use Stackra\Versioning\Contracts\Services\SunsetHeaderEmitterInterface;
use Stackra\Versioning\Enums\ApiVersionStatus;
use Illuminate\Container\Attributes\Singleton;
use Illuminate\Http\Response;

/**
 * Default {@see SunsetHeaderEmitterInterface} implementation.
 *
 * Emits RFC 8594 `Sunset` header + companion `Deprecation` header on
 * outbound responses when the resolved version is deprecated. The
 * `Sunset` header value is a RFC 5322 date (`Sun, 06 Nov 1994 08:49:37 GMT`).
 *
 * `#[Singleton]` — stateless.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[Singleton]
final class DefaultSunsetHeaderEmitter implements SunsetHeaderEmitterInterface
{
    public function __construct(
        private readonly ApiVersionRepositoryInterface $versions,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function emit(Response $response, string $apiVersionSlug): Response
    {
        $version = $this->versions->findBySlug($apiVersionSlug);
        if ($version === null) {
            return $response;
        }

        $status = $version->{ApiVersionInterface::ATTR_STATUS};
        if (! $this->isDeprecated($status)) {
            return $response;
        }

        $sunsetAt = $version->{ApiVersionInterface::ATTR_SUNSET_AT};
        if ($sunsetAt === null) {
            return $response;
        }

        $headerName        = (string) \config('versioning.headers.sunset', 'Sunset');
        $deprecationHeader = (string) \config('versioning.headers.deprecation', 'Deprecation');
        $apiVersionHeader  = (string) \config('versioning.headers.api_version', 'X-API-Version');

        // RFC 5322 formatted date for the Sunset header.
        $response->headers->set($headerName, $sunsetAt->format(\DATE_RFC7231));

        // The Deprecation header carries the deprecation date.
        $deprecatedAt = $version->{ApiVersionInterface::ATTR_DEPRECATED_AT};
        if ($deprecatedAt !== null) {
            $response->headers->set($deprecationHeader, $deprecatedAt->format(\DATE_RFC7231));
        }

        $response->headers->set($apiVersionHeader, $apiVersionSlug);

        return $response;
    }

    /**
     * Coerce a status (enum or raw string) and check whether it's
     * `deprecated`.
     */
    private function isDeprecated(mixed $status): bool
    {
        if ($status instanceof ApiVersionStatus) {
            return $status === ApiVersionStatus::Deprecated;
        }

        return (string) $status === ApiVersionStatus::Deprecated->value;
    }
}
