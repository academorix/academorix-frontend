<?php

declare(strict_types=1);

namespace Stackra\Attribution\Contracts\Services;

use Stackra\Attribution\Data\UtmParametersData;
use Stackra\Attribution\Services\UtmExtractor;
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
