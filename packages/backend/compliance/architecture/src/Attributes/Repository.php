<?php

/**
 * @file packages/architecture/src/Attributes/Repository.php
 *
 * @description
 * Marker attribute: this class is a REPOSITORY — the data-access
 * layer. Only classes marked with this attribute (or implementing
 * {@see \Academorix\Architecture\Contracts\Repository}) are allowed
 * to import domain Model classes; every other class layer is
 * subject to the {@see \Academorix\Architecture\Rules\NoDirectModelAccessRule}.
 *
 * ## Placement
 *
 * Add to the CLASS declaration. Not repeatable — one attribute is
 * enough.
 *
 * ## Usage
 *
 * ```php
 * use Academorix\Architecture\Attributes\Repository;
 *
 * #[Repository]
 * final class UserRepository
 * {
 *     public function findByEmail(string $email): ?User
 *     {
 *         return User::query()->where('email', $email)->first();
 *     }
 * }
 * ```
 *
 * ## Interface alternative
 *
 * If you prefer marker interfaces to attributes, implement
 * {@see \Academorix\Architecture\Contracts\Repository} — the
 * resolver accepts either. In practice attributes read better on
 * `final` classes and interfaces are more useful when you also
 * need `instanceof` at runtime; the two are equally valid.
 *
 * @see \Academorix\Architecture\Contracts\Repository Interface alternative.
 */

declare(strict_types=1);

namespace Academorix\Architecture\Attributes;

use Attribute;

/**
 * Marker attribute — carries no payload.
 *
 * @final
 */
#[Attribute(Attribute::TARGET_CLASS)]
final class Repository
{
    public function __construct()
    {
        // Intentionally empty — marker attribute.
    }
}
