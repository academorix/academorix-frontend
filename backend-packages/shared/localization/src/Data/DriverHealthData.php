<?php

declare(strict_types=1);

namespace Academorix\Localization\Data;

use Spatie\LaravelData\Data;

/**
 * Result of a
 * {@see \Academorix\Localization\Contracts\Services\TranslatorDriverInterface::healthcheck()}
 * call — a non-billable reachability probe. Powers the driver-status
 * endpoint and the `localization:describe` command.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
final class DriverHealthData extends Data
{
    /**
     * @param  string       $driver          Driver identifier.
     * @param  bool         $reachable       Whether the probe reached the driver's endpoint.
     * @param  int          $latencyMs      Wall-clock latency of the probe in milliseconds.
     * @param  string|null  $errorMessage   Human-readable failure summary when `$reachable=false`.
     */
    public function __construct(
        public string $driver,
        public bool $reachable,
        public int $latencyMs,
        public ?string $errorMessage = null,
    ) {
    }
}
