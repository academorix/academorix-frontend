<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Which geometry mode the evaluator ran against.
 *
 * Lowercase backing values match observability labels (R9).
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum GeofenceMode: string
{
    use Enum;

    #[Label('Polygon')]
    #[Description('Fenceable has a geofence_polygon — evaluator ran point-in-polygon + distance-to-polygon.')]
    case Polygon = 'polygon';

    #[Label('Radius')]
    #[Description('Fenceable has no polygon — evaluator fell back to haversine against location_point.')]
    case Radius = 'radius';
}
