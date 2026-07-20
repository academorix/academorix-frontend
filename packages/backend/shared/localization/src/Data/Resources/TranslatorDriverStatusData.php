<?php

declare(strict_types=1);

namespace Academorix\Localization\Data\Resources;

use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for the platform-admin
 * `GET /api/v1/platform/translation-drivers/status` endpoint.
 *
 * Each entry describes ONE driver's current reachability +
 * configuration state — powers the ops dashboard tile.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class TranslatorDriverStatusData extends Data
{
    /**
     * @param  string       $name          Driver identifier.
     * @param  bool         $configured    Whether the driver has minimum config set (API key etc.).
     * @param  bool         $reachable     Whether the last healthcheck reached the endpoint.
     * @param  int          $latencyMs    Last healthcheck latency in milliseconds.
     * @param  string|null  $errorMessage Failure summary when `$reachable=false`.
     */
    public function __construct(
        public string $name,
        public bool $configured,
        public bool $reachable,
        public int $latencyMs,
        public ?string $errorMessage = null,
    ) {
    }
}
