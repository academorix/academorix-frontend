<?php

/**
 * @file packages/authorization/src/Attributes/RoleMeta.php
 *
 * @description
 * Per-case metadata attribute for {@see \Stackra\Authorization\Contracts\RoleEnum}
 * implementations. Each `case` in a role enum carries one instance
 * of this attribute; the {@see \Stackra\Authorization\Concerns\HasRoleMetadata}
 * trait reads the attribute at call time via reflection and
 * projects each named parameter into the corresponding accessor
 * method.
 *
 * ## Why a single per-case attribute (not four)
 *
 * The `stackra/enum` package's `Metable` machinery uses one
 * attribute per named property (`#[Name('...')]`, `#[Description('...')]`,
 * ...). That shape scales to arbitrary property sets but is
 * verbose when every case ships the same four values.
 *
 * Roles have a fixed, four-value metadata surface (guard,
 * permissions, description, system) — a single attribute with
 * four named parameters is denser and reads better on-site. The
 * trade-off: adding a fifth property means bumping this
 * attribute's constructor signature + the trait's accessor set,
 * which is acceptable because role metadata evolves slowly.
 *
 * ## Structure
 *
 * ```php
 * #[RoleMeta(
 *     guard: Guard::Api,
 *     permissions: [UserPermission::View, UserPermission::Manage],
 *     description: 'Full user management access',
 *     system: true,
 * )]
 * case Admin = 'admin';
 * ```
 *
 * All parameters are optional except `guard` — the default
 * `permissions` list is empty, `description` is `null`, `system`
 * is `false`.
 *
 * @see \Stackra\Authorization\Contracts\RoleEnum Consumer interface.
 * @see \Stackra\Authorization\Concerns\HasRoleMetadata Default trait impl.
 */

declare(strict_types=1);

namespace Stackra\Authorization\Attributes;

use Stackra\Authorization\Contracts\PermissionEnum;
use Stackra\Authorization\Enums\Guard;
use Attribute;

/**
 * Per-case metadata for role enums. Attach ONE instance to every
 * case of a {@see \Stackra\Authorization\Contracts\RoleEnum}
 * implementer.
 */
#[Attribute(Attribute::TARGET_CLASS_CONSTANT)]
final readonly class RoleMeta
{
    /**
     * @param  Guard                                $guard
     *   The authentication guard the role applies to. Written
     *   to spatie/laravel-permission's `guard_name` column.
     *
     * @param  list<PermissionEnum|string>          $permissions
     *   The permissions this role grants. Enum entries resolve
     *   via `->value` at hydration time. Raw strings are
     *   passed through unchanged (used when the permission is
     *   provided by a third-party package that doesn't ship an
     *   enum).
     *
     * @param  string|null                          $description
     *   Optional dashboard label. `null` means "no description".
     *
     * @param  bool                                 $system
     *   When `true`, admin surfaces MUST prevent editing /
     *   deletion of this role. Defaults to `false`.
     */
    public function __construct(
        public Guard $guard,
        public array $permissions = [],
        public ?string $description = null,
        public bool $system = false,
    ) {
    }
}
