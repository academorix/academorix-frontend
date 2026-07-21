<?php

/**
 * @file packages/architecture/src/Contracts/Repository.php
 *
 * @description
 * Marker interface — repositories can implement this to declare
 * themselves to the {@see \Stackra\Architecture\Support\LayerResolver}
 * without carrying the {@see \Stackra\Architecture\Attributes\Repository}
 * attribute.
 *
 * ## Interface vs attribute
 *
 * The two mechanisms are equivalent as far as the resolver is
 * concerned. Choose based on:
 *
 *   - **Interface** — when you also want runtime polymorphism
 *     (`instanceof Repository`, tagged container binding).
 *   - **Attribute** — when the class is `final` (no more marker
 *     interfaces to hang off) and you just want the compile-time
 *     signal.
 *
 * Nothing prevents you from using BOTH; the resolver only checks
 * that at least one is present.
 *
 * @see \Stackra\Architecture\Attributes\Repository  Attribute alternative.
 */

declare(strict_types=1);

namespace Stackra\Architecture\Contracts;

/**
 * Empty marker interface — no methods to implement.
 *
 * Kept in a `Contracts` namespace so it composes with any
 * concrete repository classes each app defines. Deliberately NOT
 * generic; parametric constraints belong on the concrete class,
 * not on the marker.
 */
interface Repository
{
}
