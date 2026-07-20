<?php

declare(strict_types=1);

/**
 * Chart Type Enumeration
 *
 * Defines the set of allowed values for Chart Type within the Settings module.
 * Supported values include: Bar, Line, Pie, Doughnut.
 *
 * @category Enums
 *
 * @since    1.0.0
 */
namespace Academorix\Settings\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Enum;

/**
 * Chart Type Enum.
 *
 * Supported chart visualization types for dashboard widgets and reports.
 *
 * @method static BAR()      Returns the BAR enum instance
 * @method static LINE()     Returns the LINE enum instance
 * @method static PIE()      Returns the PIE enum instance
 * @method static DOUGHNUT() Returns the DOUGHNUT enum instance
 * @method static AREA()     Returns the AREA enum instance
 *
 * @since 1.0.0
 */
enum ChartType: string
{
    use Enum;

    /**
     * Bar chart — vertical or horizontal bars for categorical comparisons.
     */
    #[Label('Bar')]
    #[Description('Bar chart for categorical comparisons using vertical or horizontal bars.')]
    case Bar = 'bar';

    /**
     * Line chart — data points connected by lines for trend visualization.
     */
    #[Label('Line')]
    #[Description('Line chart for trend visualization with data points connected by lines.')]
    case Line = 'line';

    /**
     * Pie chart — circular chart divided into proportional slices.
     */
    #[Label('Pie')]
    #[Description('Pie chart for proportional data visualization using circular slices.')]
    case Pie = 'pie';

    /**
     * Doughnut chart — a pie chart with a hollow center.
     */
    #[Label('Doughnut')]
    #[Description('Doughnut chart for proportional data visualization with a hollow center.')]
    case Doughnut = 'doughnut';

    /**
     * Area chart — a line chart with the area below filled.
     */
    #[Label('Area')]
    #[Description('Area chart for trend visualization with the area below the line filled.')]
    case Area = 'area';
}
