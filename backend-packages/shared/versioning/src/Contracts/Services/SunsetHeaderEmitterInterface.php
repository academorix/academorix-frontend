<?php

declare(strict_types=1);

namespace Academorix\Versioning\Contracts\Services;

use Academorix\Versioning\Services\DefaultSunsetHeaderEmitter;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Http\Response;

/**
 * Emitter for the RFC 8594 `Sunset` header + companion `Deprecation`
 * header on outbound responses.
 *
 * Called by the `versioning.resolve` middleware after downstream
 * handlers produce the response. Only fires when the resolved
 * ApiVersion is in `deprecated` state — released versions get no
 * header, sunset versions get a 410 short-circuit before this hook
 * runs.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[Bind(DefaultSunsetHeaderEmitter::class)]
interface SunsetHeaderEmitterInterface
{
    /**
     * Decorate the outbound response with `Sunset` (RFC 8594) and
     * `Deprecation` headers when `$apiVersionSlug` is deprecated.
     *
     * @param  Response  $response         The outbound response.
     * @param  string    $apiVersionSlug   Version the request targeted.
     * @return Response  The same response, decorated in-place.
     */
    public function emit(Response $response, string $apiVersionSlug): Response;
}
