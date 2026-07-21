<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Reasons a polygon fails {@see \Academorix\Geofencing\Services\PolygonValidator}.
 *
 * Consumers of the fence-edit endpoint see the reason carried on the 422
 * response so the UI can point at the exact violation.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum PolygonValidationReason: string
{
    use Enum;

    #[Label('Not Closed')]
    #[Description('First and last vertex must be identical.')]
    case NotClosed = 'not_closed';

    #[Label('Too Few Vertices')]
    #[Description('Polygon must have at least 4 points (3 unique + repeat).')]
    case TooFewVertices = 'too_few_vertices';

    #[Label('Self-Intersecting')]
    #[Description('Simple polygon required — no self-crossing edges.')]
    case SelfIntersecting = 'self_intersecting';

    #[Label('Too Large')]
    #[Description('Polygon spans more than 10km diameter — beyond the tangent-plane approximation zone.')]
    case TooLarge = 'too_large';

    #[Label('Invalid Coordinates')]
    #[Description('At least one vertex has lat outside [-90, 90] or lng outside [-180, 180].')]
    case InvalidCoordinates = 'invalid_coordinates';

    #[Label('Invalid WKT')]
    #[Description('WKT parse failed.')]
    case InvalidWkt = 'invalid_wkt';

    #[Label('Invalid GeoJSON')]
    #[Description('GeoJSON schema violation.')]
    case InvalidGeoJson = 'invalid_geojson';
}
