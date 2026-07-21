<?php

declare(strict_types=1);

namespace Academorix\Attribution\Contracts\Services;

use Academorix\Attribution\Data\NormalizedReferrerData;
use Academorix\Attribution\Services\ReferrerNormalizer;
use Illuminate\Container\Attributes\Bind;

/**
 * Referrer-string normaliser.
 *
 * Concrete: {@see ReferrerNormalizer}.
 *
 * @category Attribution
 *
 * @since    0.1.0
 */
#[Bind(ReferrerNormalizer::class)]
interface ReferrerNormalizerInterface
{
    /**
     * Normalize an HTTP Referer string into a canonical shape.
     */
    public function normalize(?string $referer): NormalizedReferrerData;
}
