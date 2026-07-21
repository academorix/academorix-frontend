<?php

/**
 * @file packages/architecture/src/Attributes/Domain.php
 *
 * @description
 * Marker attribute: this class is a domain MODEL. Combined with
 * base-class detection (extends `Illuminate\Database\Eloquent\Model`)
 * and namespace convention (`App\Models\*`), this attribute is the
 * explicit escape hatch when neither of those heuristics apply — a
 * value object treated as a first-class domain entity, a projection
 * model that lives outside the `Models` namespace, etc.
 *
 * ## Interaction with the layer resolver
 *
 * The {@see \Stackra\Architecture\Support\LayerResolver} walks
 * three signals in priority order:
 *
 *   1. **This attribute** or {@see Repository} / {@see Service} /
 *      {@see Action} on the class → explicit layer.
 *   2. **Marker interface** on the class →
 *      `Repository` / `Service` / `Action` contract implementation.
 *   3. **Convention** — base class inheritance +
 *      namespace / path patterns from config.
 *
 * Attributes always win over conventions. Reach for one only when
 * conventions would give the wrong answer.
 *
 * ## Usage
 *
 * ```php
 * use Stackra\Architecture\Attributes\Domain;
 *
 * #[Domain]
 * class TenantSettings
 * {
 *     // Value object treated as a domain entity even though it
 *     // doesn't extend Eloquent Model.
 * }
 * ```
 *
 * @see AllowsDirectModelAccess Escape hatch for classes that
 *      need to touch Models directly despite not being Repositories.
 */

declare(strict_types=1);

namespace Stackra\Architecture\Attributes;

use Attribute;

/**
 * Marker attribute — carries no payload.
 *
 * Its presence is the signal; the resolver only asks
 * "does this class have `#[Domain]`?".
 *
 * @final
 */
#[Attribute(Attribute::TARGET_CLASS)]
final class Domain
{
    public function __construct()
    {
        // Intentionally empty — marker attribute.
    }
}
