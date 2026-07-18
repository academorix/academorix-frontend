<?php

/**
 * @file packages/authorization/src/Contracts/PermissionContributor.php
 *
 * @deprecated Since ADR 0009 — permissions are now declared via a
 *   `protected array $permissions = [...]` property on the domain
 *   service provider (list of `class-string<PermissionEnum>`), not
 *   via a contributor. This interface remains ONLY so the
 *   partially-ported `packages/access` module keeps compiling
 *   during the migration. Do NOT add new implementations.
 *
 * @description
 * The seam every domain package uses to register its permissions
 * into the shared registry / spatie/laravel-permission database.
 *
 * ## Two shapes of contribution
 *
 *   - **Enum contributors** — a class that returns a list of
 *     {@see PermissionEnum} class-strings. The registry expands
 *     each into its cases and seeds them. This is the primary
 *     path — every domain package that ships permissions exposes
 *     its enum this way.
 *
 *   - **Metadata contributors** — a class that returns a list of
 *     structured `PermissionDefinition` value objects (name +
 *     description + group + guard). Used when a permission needs
 *     admin-dashboard metadata that doesn't fit on an enum case.
 *
 * Concrete registries iterate every contributor at boot and
 * write the union to the database via
 * `spatie/laravel-permission`'s Permission model.
 *
 * ## Wiring
 *
 * Contributors are discovered via the container tag
 * `authorization.permission-contributors`. Domain packages tag
 * their contributor from their own service provider:
 *
 * ```php
 * $this->app->tag(
 *     [MyDomainPermissionContributor::class],
 *     PermissionContributor::CONTAINER_TAG,
 * );
 * ```
 *
 * The full `packages/access` package will register a listener on
 * the boot lifecycle that iterates the tag and seeds the database.
 * The lightweight `packages/authorization` package (this file)
 * ships the contract only — no runtime enforcement here.
 *
 * @see PermissionEnum The enum contract implementers return.
 */

declare(strict_types=1);

namespace Academorix\Authorization\Contracts;

interface PermissionContributor
{
    /**
     * Container tag under which contributors register themselves.
     * Exposed as a constant so consumer packages don't have to
     * duplicate the magic string.
     */
    public const string CONTAINER_TAG = 'authorization.permission-contributors';

    /**
     * The permission enum class-strings this contributor exposes.
     *
     * Each returned FQCN MUST implement {@see PermissionEnum} and
     * be a string-backed enum. The registry expands each enum's
     * cases into individual permissions in the database.
     *
     * @return list<class-string<PermissionEnum>>
     */
    public function permissions(): array;
}
