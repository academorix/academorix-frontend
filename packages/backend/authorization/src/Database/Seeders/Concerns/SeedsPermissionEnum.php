<?php

declare(strict_types=1);

/**
 * @file packages/authorization/src/Database/Seeders/Concerns/SeedsPermissionEnum.php
 *
 * @description
 * Level-2 composition of {@see \Academorix\Database\Concerns\Enumable}
 * that pre-fills every permission-specific detail: the target model
 * (spatie's {@see \Spatie\Permission\Contracts\Permission}), the
 * lookup key shape (`name` + `guard_name`), and the post-seed cache
 * flush against {@see \Spatie\Permission\PermissionRegistrar}.
 *
 * Every module that ships permissions collapses its seeder to three
 * lines of intent — declare `#[AsSeeder(priority: ...)]`, use this
 * trait, return the enum class-strings. Zero boilerplate about
 * spatie models, cache invalidation, or guard resolution.
 *
 * ## Contract
 *
 *   - Subclass provides {@see permissionEnums()} — the list of
 *     enums to project. Every enum MUST implement
 *     {@see \Academorix\Authorization\Contracts\PermissionEnum}
 *     and, per platform convention, expose a `guard(): Guard`
 *     method returning the {@see Guard} case each permission
 *     binds to.
 *   - Optionally override {@see guardFor()} to compute the guard
 *     for a specific case when the enum lacks a native `guard()`
 *     method (see the fallback documented on {@see guardFor()}).
 *
 * @category Concerns
 *
 * @since    0.1.0
 */

namespace Academorix\Authorization\Database\Seeders\Concerns;

use Academorix\Authorization\Contracts\PermissionEnum;
use Academorix\Authorization\Enums\Guard;
use Academorix\Database\Concerns\Enumable;
use Spatie\Permission\Contracts\Permission as PermissionContract;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Throwable;
use UnitEnum;

/**
 * Seeder mixin that projects any list of {@see PermissionEnum}
 * enums into spatie/laravel-permission's `permissions` table.
 *
 * ## Usage
 *
 * ```php
 * use Academorix\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum;
 * use Academorix\ServiceProvider\Attributes\AsSeeder;
 * use Illuminate\Database\Seeder;
 *
 * #[AsSeeder(priority: 44, environments: [])]
 * final class VersioningPermissionSeeder extends Seeder
 * {
 *     use SeedsPermissionEnum;
 *
 *     protected function permissionEnums(): array
 *     {
 *         return [VersioningPermission::class];
 *     }
 * }
 * ```
 *
 * @category Concerns
 *
 * @since    0.1.0
 */
trait SeedsPermissionEnum
{
    use Enumable;

    /**
     * The permission enum class-strings this seeder projects.
     * Every returned class MUST implement {@see PermissionEnum}
     * and MUST be a string-backed enum (`enum X: string`).
     *
     * @return list<class-string<PermissionEnum>>
     */
    abstract protected function permissionEnums(): array;

    /**
     * Bridge {@see Enumable}'s contract — the generic loop iterates
     * whatever {@see permissionEnums()} returns.
     *
     * @return list<class-string<PermissionEnum>>
     */
    protected function enums(): array
    {
        return $this->permissionEnums();
    }

    /**
     * The spatie {@see PermissionContract} model class the loop
     * writes to. Reads from `config('permission.models.permission')`
     * so downstream apps can substitute a custom permission model.
     */
    protected function modelClass(): string
    {
        /** @var class-string $model */
        $model = \config('permission.models.permission', Permission::class);

        return $model;
    }

    /**
     * The `updateOrCreate` lookup keys for one permission case:
     * `name` + `guard_name`. The pair is unique in spatie's schema,
     * so a rerun updates in-place instead of duplicating.
     *
     * @param  UnitEnum  $case
     *   Backed enum case; assumed to be a {@see PermissionEnum}
     *   instance with a string `->value` and (per platform
     *   convention) a `guard()` method returning a {@see Guard}.
     * @return array<string, mixed>  Composite lookup keys.
     */
    protected function keysFor(UnitEnum $case): array
    {
        return [
            'name' => $case->value,
            'guard_name' => $this->guardFor($case)->value,
        ];
    }

    /**
     * Resolve the {@see Guard} for one permission case.
     *
     * Default implementation: if the enum has a native `guard()`
     * method returning a {@see Guard}, delegate to it. Otherwise
     * fall back to {@see Guard::Sanctum} — the tenant-user guard
     * every domain permission binds to by default. Consumers that
     * need a different fallback override this method.
     *
     * @param  UnitEnum  $case  Permission case whose guard to resolve.
     */
    protected function guardFor(UnitEnum $case): Guard
    {
        if (\method_exists($case, 'guard')) {
            /** @var mixed $guard */
            $guard = $case->guard();

            if ($guard instanceof Guard) {
                return $guard;
            }
        }

        return Guard::Sanctum;
    }

    /**
     * Post-seed hook — invalidate spatie's cached permission
     * table so the newly-seeded rows are visible on the very
     * next request.
     *
     * Swallows exceptions because the registrar may not be bound
     * in test environments that stub the permission stack; the
     * seed itself has already completed successfully by this point.
     */
    protected function after(): void
    {
        try {
            \app(PermissionRegistrar::class)->forgetCachedPermissions();
        } catch (Throwable) {
            // Fail-soft — the seed rows are already persisted; a
            // missing registrar (test stub, uninstalled package) is
            // not a reason to surface an error.
        }
    }
}
