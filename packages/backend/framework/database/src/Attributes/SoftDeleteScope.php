<?php

declare(strict_types=1);

/**
 * Soft Delete Scope Attribute
 *
 * PHP 8 attribute for compile-time metadata annotation in the Framework module.
 * Discovered by the compiler to configure runtime behavior automatically.
 *
 * @category Attributes
 *
 * @since    1.0.0
 */
namespace Stackra\Database\Attributes;

use Attribute;

/**
 * SoftDeleteScope Attribute for Repository Classes.
 *
 * Controls whether soft-deleted records are included in repository
 * queries by default. When `includeDeleted` is true, the repository
 * will call `withTrashed()` on all queries automatically.
 *
 * ```php
 * // Default: exclude soft-deleted records
 * #[SoftDeleteScope]
 * class UserRepository extends Repository {}
 *
 * // Include soft-deleted records by default (e.g., admin panels):
 * #[SoftDeleteScope(includeDeleted: true)]
 * class AdminUserRepository extends Repository {}
 * ```
 *
 * @category Attributes
 *
 * @since    2.0.0
 *
 * @see \Illuminate\Database\Eloquent\SoftDeletes
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class SoftDeleteScope
{
    /**
     * @param  bool  $includeDeleted  Whether to include soft-deleted records by default.
     */
    public function __construct(
        public bool $includeDeleted = false,
    ) {}
}
