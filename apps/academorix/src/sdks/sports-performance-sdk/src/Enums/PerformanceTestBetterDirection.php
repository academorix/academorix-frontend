<?php

declare(strict_types=1);

namespace Stackra\SportsPerformanceSdk\Enums;

/**
 * Wire-visible backed enum for `performance-test.better_direction`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category PerformanceSdk
 *
 * @since    0.1.0
 */
enum PerformanceTestBetterDirection: string
{
    case Higher = 'higher';
    case Lower = 'lower';
}
