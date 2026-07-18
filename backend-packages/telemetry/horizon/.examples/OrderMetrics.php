<?php

declare(strict_types=1);

namespace Academorix\Horizon\Examples;

use Academorix\Horizon\Attributes\AsMetric;

/**
 * ## OrderMetrics Example
 *
 * This example shows how to use the `#[AsMetric]` attribute to automatically
 * register custom metrics with Laravel Horizon.
 *
 * ### Features demonstrated:
 * 1.  **Automatic Discovery**: Metrics are registered without manual config.
 * 2.  **Naming**: Define the metric identity via the `name` property.
 * 3.  **Priority**: Control registration order if necessary.
 *
 * ### How it works:
 * Horizon metrics typically track queue performance. By marking a class
 * with `#[AsMetric]`, you enable Telemetry to hook into the Horizon
 * dashboard data collection process.
 */
#[AsMetric(
    name: 'throughput',
    enabled: true,
    priority: 100
)]
class OrderMetrics
{
    /**
     * Logic to calculate or retrieve the metric value.
     *
     * @return mixed
     */
    public function getValue(): mixed
    {
        // Example logic to retrieve some queue metric
        return 42;
    }
}
