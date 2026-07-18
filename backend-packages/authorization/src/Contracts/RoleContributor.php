<?php

/**
 * @file packages/authorization/src/Contracts/RoleContributor.php
 *
 * @deprecated Since ADR 0009 — roles are now declared via a
 *   `protected array $roles = [...]` property on the domain
 *   service provider (list of `class-string<RoleEnum>`), and
 *   each role case carries a `#[RoleMeta]` attribute in place of
 *   the old associative-array shape. See
 *   {@see \Academorix\Authorization\Contracts\RoleEnum} and
 *   {@see \Academorix\Authorization\Concerns\HasRoleMetadata}.
 *   This interface remains ONLY so the partially-ported
 *   `packages/access` module keeps compiling during the
 *   migration. Do NOT add new implementations.
 *
 * @description
 * The seam every domain package uses to register its ROLES into
 * the shared registry / spatie/laravel-permission database.
 *
 * Mirrors {@see PermissionContributor} — the only differences
 * are the container tag name + the return shape.
 *
 * ## Role definition shape
 *
 * Roles are not enums (their permission sets vary per role and
 * per environment), so the returned shape is a list of arrays:
 *
 * ```php
 * public function roles(): array
 * {
 *     return [
 *         [
 *             'name'        => 'coach',
 *             'guard'       => Guard::Api,
 *             'permissions' => [
 *                 UserPermission::View,
 *                 UserPermission::Update,
 *                 AthletePermission::View,
 *             ],
 *             'description' => 'Team-level coach — read athletes + manage own team.',
 *             'system'      => false,   // NOT protected from admin edits
 *         ],
 *     ];
 * }
 * ```
 *
 * The full `packages/access` package converts each entry into a
 * spatie/laravel-permission `Role` row on boot.
 *
 * ## Wiring
 *
 * Contributors register themselves against the container tag
 * `authorization.role-contributors`. See {@see self::CONTAINER_TAG}.
 */

declare(strict_types=1);

namespace Academorix\Authorization\Contracts;

interface RoleContributor
{
    /**
     * Container tag under which contributors register themselves.
     */
    public const string CONTAINER_TAG = 'authorization.role-contributors';

    /**
     * The role definitions this contributor exposes.
     *
     * Each entry is an associative array with:
     *
     *   - `name` (string, required) — role slug (`admin`, `coach`, ...)
     *   - `guard` (Guard, required) — auth guard the role applies to
     *   - `permissions` (list<PermissionEnum|string>, required) —
     *     the permission set the role grants
     *   - `description` (string|null, optional) — dashboard label
     *   - `system` (bool, optional, default false) — when `true`
     *     the admin dashboard prevents editing / deletion of the
     *     role. Use for foundational roles like `super_admin`,
     *     `owner`.
     *
     * @return list<array{
     *     name: string,
     *     guard: \Academorix\Authorization\Enums\Guard,
     *     permissions: list<\Academorix\Authorization\Contracts\PermissionEnum|string>,
     *     description?: string,
     *     system?: bool,
     * }>
     */
    public function roles(): array;
}
