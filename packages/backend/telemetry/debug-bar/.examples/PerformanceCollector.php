<?php

declare(strict_types=1);

namespace Stackra\Debugbar\Examples;

use DebugBar\DataCollector\DataCollector;
use DebugBar\DataCollector\Renderable;
use Stackra\Debugbar\Attributes\AsCollector;

/**
 * ## PerformanceCollector Example
 *
 * This example demonstrates how to create a custom Debugbar collector using the `#[AsCollector]` attribute.
 * By using this attribute, the collector will be automatically discovered and registered
 * with the Debugbar, eliminating the need for manual registration in a Service Provider.
 *
 * ### Features demonstrated:
 * 1.  **Automatic Discovery**: The `#[AsCollector]` attribute marks this class for scanning.
 * 2.  **Custom Naming**: Using the `name` parameter to define how it appears in the Debugbar.
 * 3.  **Priority**: Setting the registration order relative to other collectors.
 * 4.  **Data Collection**: Implementing the standard `DataCollector` interface.
 *
 * ### How to use:
 * Simply place your collector classes in a directory scanned by the Telemetry package
 * (usually `app/Collectors` or within your package structure), and they will
 * appear in your Debugbar automatically.
 */
#[AsCollector(
    name: 'performance',
    enabled: true,
    priority: 100,
    config: [
        'icon' => 'time',
        'tooltip' => 'Application Performance Metrics',
    ]
)]
class PerformanceCollector extends DataCollector implements Renderable
{
    /**
     * Collects the data to be displayed in the Debugbar.
     *
     * @return array<string, mixed>
     */
    public function collect(): array
    {
        return [
            'memory_peak' => memory_get_peak_usage(true),
            'execution_time' => microtime(true) - $_SERVER['REQUEST_TIME_FLOAT'],
            'boot_time' => defined('LARAVEL_START') ? LARAVEL_START - $_SERVER['REQUEST_TIME_FLOAT'] : 0,
        ];
    }

    /**
     * Returns the unique name of the collector.
     *
     * @return string
     */
    public function getName(): string
    {
        return 'performance';
    }

    /**
     * Returns the widget configuration for rendering the collected data.
     *
     * @return array<string, mixed>
     */
    public function getWidgets(): array
    {
        return [
            'performance' => [
                'icon' => 'time',
                'widget' => 'PhpDebugBar.Widgets.VariableListWidget',
                'map' => 'performance',
                'default' => '{}',
            ],
        ];
    }
}
