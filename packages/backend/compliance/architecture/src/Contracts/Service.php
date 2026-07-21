<?php

/**
 * @file packages/architecture/src/Contracts/Service.php
 *
 * @description
 * Marker interface for service-layer classes. Equivalent to
 * {@see \Stackra\Architecture\Attributes\Service} at the
 * resolver level; see that file's docblock for placement guidance.
 *
 * ## Rationale for a marker interface
 *
 * Even though this interface declares no methods, having a
 * dedicated Service marker lets the container use `tag()` binding
 * to iterate all services (e.g. for warm-up commands, service
 * discovery in tests, or generating a service-catalog page).
 * That's harder to do with attributes because they aren't part of
 * the runtime type system.
 *
 * @see \Stackra\Architecture\Attributes\Service
 */

declare(strict_types=1);

namespace Stackra\Architecture\Contracts;

/**
 * Empty marker interface — no methods to implement.
 */
interface Service
{
}
