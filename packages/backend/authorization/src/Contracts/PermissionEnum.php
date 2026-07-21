<?php

/**
 * @file packages/authorization/src/Contracts/PermissionEnum.php
 *
 * @description
 * Marker interface every domain-owned permission enum implements.
 *
 * ## Why a marker
 *
 * The `#[RequirePermission]` attribute accepts both string-backed
 * enums AND raw strings. Marking domain enums with this interface
 * documents intent + enables PHPStan / IDE to enforce that only
 * genuine permission enums are passed. It also unlocks the
 * `PermissionContributor` discovery path — the boot-time registry
 * iterates every `PermissionEnum` implementer and seeds the
 * spatie/laravel-permission database with fresh cases.
 *
 * ## What implementers look like
 *
 * ```php
 * use Stackra\Authorization\Contracts\PermissionEnum;
 *
 * enum UserPermission: string implements PermissionEnum
 * {
 *     case View   = 'user.view';
 *     case Create = 'user.create';
 *     case Update = 'user.update';
 *     case Delete = 'user.delete';
 * }
 * ```
 *
 * The `: string` backing is deliberate — spatie/laravel-permission
 * stores permission names as strings in the database, so the
 * enum's `->value` becomes the storage key. Enum authors are
 * responsible for keeping the values stable; renaming a case's
 * value is a breaking change that requires a permission migration.
 *
 * ## Naming convention
 *
 * `{domain}.{action}` — e.g. `user.view`, `role.assign`, `ai.chat`.
 * The dot separator lets the admin dashboard group permissions by
 * domain and keeps names greppable across the codebase.
 *
 * @see \Stackra\Authorization\Attributes\RequirePermission Consumer.
 * @see \Stackra\Authorization\Contracts\PermissionContributor Registry seam.
 */

declare(strict_types=1);

namespace Stackra\Authorization\Contracts;

/**
 * Marker interface for domain permission enums.
 *
 * Implementers MUST be `enum: string` (string-backed) so the
 * `->value` is a stable storage key.
 */
interface PermissionEnum
{
}
