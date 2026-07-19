<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Observers;

use Academorix\Geofencing\Contracts\Data\GeofenceCheckInterface;
use Academorix\Geofencing\Models\GeofenceCheck;
use Illuminate\Container\Attributes\Config;

/**
 * Observer for {@see GeofenceCheck}.
 *
 * The immutability guard on `saving` lives on the MODEL — the observer here
 * covers metadata defaults + morph-map strictness. Cross-tenant defence on
 * `supersedes_check_id` also lives here.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
final class GeofenceCheckObserver
{
    public function __construct(
        #[Config('geofencing.morph_map.strict')] private readonly bool $strictMorphMap,
    ) {
    }

    /**
     * `creating` — default metadata to `[]` + validate supersedes chain
     * integrity. Alias enforcement is a boot-time morph-map check via the
     * upcoming CompileMorphAliases listener; the observer only guards the
     * row-integrity rules that survive after boot.
     */
    public function creating(GeofenceCheck $check): void
    {
        // Default metadata to `{}` when null — the jsonb column tolerates
        // null but downstream consumers expect a hash.
        if ($check->getAttribute(GeofenceCheckInterface::ATTR_METADATA) === null) {
            $check->setAttribute(GeofenceCheckInterface::ATTR_METADATA, []);
        }

        // Supersedes chain integrity — same tenant, same fenceable pair.
        $supersedesId = $check->getAttribute(GeofenceCheckInterface::ATTR_SUPERSEDES_CHECK_ID);
        if ($supersedesId !== null) {
            $original = GeofenceCheck::withTrashed()->find($supersedesId);
            if ($original !== null) {
                if ($original->{GeofenceCheckInterface::ATTR_TENANT_ID}
                    !== $check->getAttribute(GeofenceCheckInterface::ATTR_TENANT_ID)
                ) {
                    throw new \RuntimeException(
                        'Refusing to create an override row that supersedes a check in a different tenant.',
                    );
                }
                if ($original->{GeofenceCheckInterface::ATTR_FENCEABLE_TYPE}
                    !== $check->getAttribute(GeofenceCheckInterface::ATTR_FENCEABLE_TYPE)
                ) {
                    throw new \RuntimeException(
                        'Refusing to create an override row that supersedes a check with a different fenceable.',
                    );
                }
                if ($original->{GeofenceCheckInterface::ATTR_FENCEABLE_ID}
                    !== $check->getAttribute(GeofenceCheckInterface::ATTR_FENCEABLE_ID)
                ) {
                    throw new \RuntimeException(
                        'Refusing to create an override row that supersedes a check with a different fenceable id.',
                    );
                }
            }
        }
    }
}
