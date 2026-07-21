<?php

declare(strict_types=1);

namespace Stackra\Geofencing\Attributes;

use Attribute;

/**
 * Class-level marker for models that call the evaluator on their own behalf.
 *
 * Same discovery pipeline as {@see Geofenceable} but registered against the
 * subject morph map. There is NO required interface — subjects don't have
 * any evaluator surface; they're just polymorphic targets for the audit
 * trail's "what caused this evaluation" pointer.
 *
 * ```php
 * #[GeofenceSubjectAlias(alias: 'staff_clockin')]
 * final class StaffClockIn extends Model
 * {
 * }
 * ```
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class GeofenceSubjectAlias
{
    /**
     * @param  string  $alias  snake_case identifier persisted to `geofence_checks.subject_type`. MUST match `^[a-z][a-z0-9_]+$`.
     */
    public function __construct(
        public string $alias,
    ) {
    }
}
