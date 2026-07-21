<?php

/**
 * @file packages/authorization/src/Contracts/RoleEnum.php
 *
 * @description
 * Marker interface every domain-owned role enum implements.
 *
 * ## Why an enum-first shape
 *
 * The original access-module contract shipped an array of
 * associative arrays for roles — one entry per role, keyed by
 * `name` / `guard` / `permissions` / `description` / `system`.
 * That worked, but broke symmetry with permissions (which had
 * always been enum-class-strings), forced consumers to reach for
 * string keys, and left no place to hang new metadata (icon,
 * sort order, colour) without a signature change everywhere.
 *
 * The current shape (ADR 0009) makes both permissions AND roles
 * `list<class-string<EnumType>>` on the domain provider:
 *
 * ```php
 * protected array $permissions = [UserPermission::class];
 * protected array $roles       = [UserRole::class];
 * ```
 *
 * A `RoleEnum` implementer is a normal PHP 8.1 string-backed
 * enum that also carries per-case metadata (guard, granted
 * permissions, description, system flag). The four accessors on
 * this interface project each case into whatever persistence
 * layer consumes it — currently `spatie/laravel-permission`'s
 * `roles` table, via the hydrator in `packages/access`.
 *
 * ## Example implementation
 *
 * ```php
 * use Stackra\Authorization\Concerns\HasRoleMetadata;
 * use Stackra\Authorization\Contracts\RoleEnum;
 * use Stackra\Authorization\Enums\Guard;
 * use Stackra\Authorization\Attributes\RoleMeta;
 * use Stackra\Users\Enums\UserPermission;
 *
 * enum UserRole: string implements RoleEnum
 * {
 *     use HasRoleMetadata;
 *
 *     #[RoleMeta(
 *         guard: Guard::Api,
 *         permissions: [UserPermission::View, UserPermission::Manage],
 *         description: 'Full user management access',
 *         system: true,
 *     )]
 *     case Admin = 'admin';
 *
 *     #[RoleMeta(
 *         guard: Guard::Api,
 *         permissions: [UserPermission::View],
 *         description: 'Read-only user directory access',
 *     )]
 *     case Viewer = 'viewer';
 * }
 * ```
 *
 * ## Persistence key
 *
 * The role's storage key is the enum case's `->value` (e.g.
 * `'admin'`). Renaming a case value is a breaking change that
 * requires a role migration — treat case values as stable public
 * API the same way you would a database column name.
 *
 * @see \Stackra\Authorization\Concerns\HasRoleMetadata Default trait implementation.
 * @see \Stackra\Authorization\Attributes\RoleMeta Per-case metadata attribute.
 * @see \Stackra\Authorization\Contracts\PermissionEnum Symmetric permission-enum marker.
 */

declare(strict_types=1);

namespace Stackra\Authorization\Contracts;

use Stackra\Authorization\Enums\Guard;
use BackedEnum;

/**
 * Marker interface for domain role enums.
 *
 * Implementers MUST be `enum: string` (string-backed) so the
 * `->value` is a stable storage key. The four accessors below
 * are provided by the {@see \Stackra\Authorization\Concerns\HasRoleMetadata}
 * trait — domain enums simply implement this interface + `use`
 * the trait; no method boilerplate needed.
 */
interface RoleEnum extends BackedEnum
{
    /**
     * The authentication guard this role applies to.
     *
     * Determines the `guard_name` column value written to
     * spatie/laravel-permission's `roles` table. A given role
     * name (e.g. `admin`) may exist for multiple guards; each is
     * a separate row.
     */
    public function guard(): Guard;

    /**
     * The permissions this role grants.
     *
     * Every entry MUST be either a {@see PermissionEnum} case OR
     * a raw string (used when the permission is provided by a
     * third-party package that doesn't ship an enum). The access
     * registry hydrator resolves enum entries via `->value`.
     *
     * @return list<PermissionEnum|string>
     */
    public function permissions(): array;

    /**
     * Optional dashboard label. `null` means "no description".
     *
     * Returned exactly as authored; the admin surface is
     * responsible for localisation.
     */
    public function description(): ?string;

    /**
     * When `true`, admin surfaces MUST prevent editing / deletion
     * of this role. Reserve for foundational roles like
     * `super_admin`, `owner`, and any role a compliance policy
     * requires to remain unmodified.
     */
    public function isSystem(): bool;
}
