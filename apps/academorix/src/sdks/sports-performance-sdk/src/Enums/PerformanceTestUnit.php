<?php

declare(strict_types=1);

namespace Stackra\SportsPerformanceSdk\Enums;

/**
 * Wire-visible backed enum for `performance-test.unit`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category PerformanceSdk
 *
 * @since    0.1.0
 */
enum PerformanceTestUnit: string
{
    case Seconds = 'seconds';
    case Meters = 'meters';
    case Centimeters = 'centimeters';
    case MlPerKgPerMin = 'ml_per_kg_per_min';
    case Count = 'count';
    case Percent = 'percent';
    case Kilograms = 'kilograms';
    case Watts = 'watts';
}
