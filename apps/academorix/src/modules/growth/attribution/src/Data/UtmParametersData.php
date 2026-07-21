<?php

declare(strict_types=1);

namespace Stackra\Attribution\Data;

use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * UTM parameter payload extracted from a request URL.
 *
 * @category Attribution
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class UtmParametersData extends Data
{
    /**
     * @param  string|null  $source           utm_source — traffic origin (`google`, `newsletter`).
     * @param  string|null  $medium           utm_medium — marketing medium (`cpc`, `email`, `social`).
     * @param  string|null  $campaign         utm_campaign — campaign name.
     * @param  string|null  $term             utm_term — paid keyword.
     * @param  string|null  $content          utm_content — creative variant identifier.
     * @param  string|null  $id               utm_id — GA4 campaign id.
     * @param  string|null  $sourcePlatform   utm_source_platform — ad platform (`google_ads`, `meta_ads`).
     * @param  string|null  $creativeFormat   utm_creative_format — ad creative format (`display`, `video`, `carousel`).
     * @param  string|null  $marketingTactic  utm_marketing_tactic — high-level tactic (`brand`, `remarketing`).
     */
    public function __construct(
        public ?string $source = null,
        public ?string $medium = null,
        public ?string $campaign = null,
        public ?string $term = null,
        public ?string $content = null,
        public ?string $id = null,
        public ?string $sourcePlatform = null,
        public ?string $creativeFormat = null,
        public ?string $marketingTactic = null,
    ) {
    }

    /**
     * True when every UTM slot is empty — the request carried no
     * campaign info at all. Callers use this to decide whether to
     * persist an `attribution_touchpoints` row.
     */
    public function isEmpty(): bool
    {
        return $this->source === null
            && $this->medium === null
            && $this->campaign === null
            && $this->term === null
            && $this->content === null
            && $this->id === null
            && $this->sourcePlatform === null
            && $this->creativeFormat === null
            && $this->marketingTactic === null;
    }
}
