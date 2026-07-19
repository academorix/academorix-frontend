<?php

declare(strict_types=1);

namespace Academorix\Attribution\Services;

use Academorix\Attribution\Contracts\Services\UtmExtractorInterface;
use Academorix\Attribution\Data\UtmParametersData;
use Illuminate\Container\Attributes\Singleton;

/**
 * Extract UTM tracking parameters from a URL or query-string array.
 *
 * The Google Analytics UTM spec — `utm_source`, `utm_medium`,
 * `utm_campaign`, `utm_term`, `utm_content` — plus the LinkedIn /
 * Facebook / Twitter extensions (`utm_id`, `utm_source_platform`,
 * `utm_creative_format`). Extraction is case-insensitive on the key
 * (some ad platforms upper-case) but preserves the value verbatim.
 *
 * Every extracted value is trimmed and clamped to 191 chars (matching
 * `attribution_touchpoints.utm_*` column widths). Empty strings are
 * dropped.
 *
 * `#[Singleton]` — stateless string manipulation.
 *
 * @category Attribution
 *
 * @since    0.1.0
 */
#[Singleton]
final class UtmExtractor implements UtmExtractorInterface
{
    /**
     * UTM parameter names, case-normalized to snake_case.
     *
     * @var list<string>
     */
    private const array UTM_KEYS = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'utm_id',
        'utm_source_platform',
        'utm_creative_format',
        'utm_marketing_tactic',
    ];

    /**
     * Max UTM value length. Matches the `attribution_touchpoints`
     * column definition. Long values are truncated (never rejected)
     * so a badly-crafted campaign URL still tracks the campaign.
     */
    private const int MAX_LENGTH = 191;

    /**
     * {@inheritDoc}
     */
    public function fromQuery(array $query): UtmParametersData
    {
        // Lower-case + trim every key so `UTM_SOURCE` lands as
        // `utm_source`.
        $normalized = [];
        foreach ($query as $key => $value) {
            if (! is_string($key)) {
                continue;
            }
            $normalized[strtolower(trim($key))] = $value;
        }

        return new UtmParametersData(
            source:            $this->pick($normalized, 'utm_source'),
            medium:            $this->pick($normalized, 'utm_medium'),
            campaign:          $this->pick($normalized, 'utm_campaign'),
            term:              $this->pick($normalized, 'utm_term'),
            content:           $this->pick($normalized, 'utm_content'),
            id:                $this->pick($normalized, 'utm_id'),
            sourcePlatform:    $this->pick($normalized, 'utm_source_platform'),
            creativeFormat:    $this->pick($normalized, 'utm_creative_format'),
            marketingTactic:   $this->pick($normalized, 'utm_marketing_tactic'),
        );
    }

    /**
     * {@inheritDoc}
     */
    public function fromUrl(string $url): UtmParametersData
    {
        $parts = parse_url($url);
        if ($parts === false || ! isset($parts['query']) || $parts['query'] === '') {
            return new UtmParametersData();
        }
        $query = [];
        parse_str($parts['query'], $query);

        return $this->fromQuery($query);
    }

    /**
     * Fetch a normalised UTM value from the query array.
     */
    private function pick(array $query, string $key): ?string
    {
        $raw = $query[$key] ?? null;
        if (! is_string($raw)) {
            return null;
        }
        $trimmed = trim($raw);
        if ($trimmed === '') {
            return null;
        }

        // Truncate to the column width.
        if (mb_strlen($trimmed) > self::MAX_LENGTH) {
            $trimmed = mb_substr($trimmed, 0, self::MAX_LENGTH);
        }

        return $trimmed;
    }
}
