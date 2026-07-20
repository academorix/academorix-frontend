<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Attributes;

use Attribute;

/**
 * Class-level marker for models that carry a geofence.
 *
 * The compile-time compiler discovers `#[Geofenceable]`-marked classes via
 * `Academorix\Foundation\Contracts\DiscoversAttributes` and registers each
 * against the fenceable morph map via `Relation::enforceMorphMap()`. Boot
 * fails on duplicate aliases OR on aliases whose target class doesn't
 * implement the {@see \Academorix\Geofencing\Contracts\Geofenceable}
 * interface.
 *
 * ```php
 * #[Geofenceable(alias: 'branch')]
 * final class Branch extends Model implements \Academorix\Geofencing\Contracts\Geofenceable
 * {
 *     use \Academorix\Geofencing\Concerns\HasGeofence;
 * }
 * ```
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class Geofenceable
{
    /**
     * @param  string  $alias  snake_case identifier persisted to `geofence_checks.fenceable_type`. MUST match `^[a-z][a-z0-9_]+$`.
     */
    public function __construct(
        public string $alias,
    ) {
    }
}
