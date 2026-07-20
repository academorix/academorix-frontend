<?php

declare(strict_types=1);

namespace Academorix\Attribution\Contracts\Services;

use Academorix\Attribution\Data\UtmParametersData;
use Academorix\Attribution\Services\UtmExtractor;
use Illuminate\Container\Attributes\Bind;

/**
 * UTM parameter extractor.
 *
 * Concrete: {@see UtmExtractor}.
 *
 * @category Attribution
 *
 * @since    0.1.0
 */
#[Bind(UtmExtractor::class)]
interface UtmExtractorInterface
{
    /**
     * Extract UTM parameters from a query-parameters array.
     *
     * @param  array<string, mixed>  $query
     */
    public function fromQuery(array $query): UtmParametersData;

    /**
     * Extract UTM parameters from a full URL.
     */
    public function fromUrl(string $url): UtmParametersData;
}
