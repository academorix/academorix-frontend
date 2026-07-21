<?php

/**
 * @file packages/authorization/src/Concerns/HasRoleMetadata.php
 *
 * @description
 * Default trait providing the four
 * {@see \Stackra\Authorization\Contracts\RoleEnum} accessors
 * (`guard()`, `permissions()`, `description()`, `isSystem()`) by
 * reading the {@see \Stackra\Authorization\Attributes\RoleMeta}
 * attribute attached to each enum case.
 *
 * ## Reflection cost
 *
 * The `#[RoleMeta]` attribute is read once per case per worker
 * via lazy static memoisation. Under Octane / long-lived workers,
 * subsequent lookups are pure array reads.
 *
 * ## Default values
 *
 * When a case is missing the `#[RoleMeta]` attribute (e.g.
 * during a partial refactor), every accessor falls back to a
 * sane default:
 *
 *   - `guard()`       → `Guard::Api`
 *   - `permissions()` → `[]`
 *   - `description()` → `null`
 *   - `isSystem()`    → `false`
 *
 * That way a missing attribute doesn't crash the seeder; the
 * role is written with the API guard and no permissions until
 * the attribute is added.
 *
 * @see \Stackra\Authorization\Contracts\RoleEnum Interface this trait satisfies.
 * @see \Stackra\Authorization\Attributes\RoleMeta Per-case attribute read by this trait.
 */

declare(strict_types=1);

namespace Stackra\Authorization\Concerns;

use Stackra\Authorization\Attributes\RoleMeta;
use Stackra\Authorization\Contracts\PermissionEnum;
use Stackra\Authorization\Enums\Guard;
use ReflectionClassConstant;
use ReflectionEnum;

/**
 * Default trait implementation of {@see \Stackra\Authorization\Contracts\RoleEnum}.
 *
 * Use on any string-backed enum that also implements `RoleEnum`.
 */
trait HasRoleMetadata
{
    /**
     * Per-class, per-case cache of the resolved metadata.
     *
     * Keyed by fully-qualified enum class and case name — under
     * Octane every case pays the reflection cost exactly once
     * per worker lifetime. The value is a struct-like array
     * shape rather than a `RoleMeta` instance to avoid a
     * reflection re-instantiation on every accessor call.
     *
     * @var array<class-string, array<string, array{
     *     guard: Guard,
     *     permissions: list<PermissionEnum|string>,
     *     description: string|null,
     *     system: bool,
     * }>>
     */
    private static array $roleMetaCache = [];

    /**
     * @inheritDoc
     */
    public function guard(): Guard
    {
        return $this->roleMetadata()['guard'];
    }

    /**
     * @inheritDoc
     */
    public function permissions(): array
    {
        return $this->roleMetadata()['permissions'];
    }

    /**
     * @inheritDoc
     */
    public function description(): ?string
    {
        return $this->roleMetadata()['description'];
    }

    /**
     * @inheritDoc
     */
    public function isSystem(): bool
    {
        return $this->roleMetadata()['system'];
    }

    /**
     * Resolve the memoised metadata struct for this case.
     *
     * @return array{
     *     guard: Guard,
     *     permissions: list<PermissionEnum|string>,
     *     description: string|null,
     *     system: bool,
     * }
     */
    private function roleMetadata(): array
    {
        /** @var class-string $enumClass */
        $enumClass = static::class;
        $caseName  = $this->name;

        if (isset(self::$roleMetaCache[$enumClass][$caseName])) {
            return self::$roleMetaCache[$enumClass][$caseName];
        }

        self::$roleMetaCache[$enumClass][$caseName] = self::readRoleMeta($enumClass, $caseName);

        return self::$roleMetaCache[$enumClass][$caseName];
    }

    /**
     * Reflect the `#[RoleMeta]` attribute for a single case; return
     * defaults when the attribute is absent.
     *
     * @param class-string $enumClass
     * @param string       $caseName
     *
     * @return array{
     *     guard: Guard,
     *     permissions: list<PermissionEnum|string>,
     *     description: string|null,
     *     system: bool,
     * }
     */
    private static function readRoleMeta(string $enumClass, string $caseName): array
    {
        try {
            $reflection = new ReflectionEnum($enumClass);
            $constant   = $reflection->getCase($caseName);
            $attributes = $constant->getAttributes(RoleMeta::class);
        } catch (\ReflectionException) {
            // Enum or case missing — fall through to defaults.
            $attributes = [];
        }

        if ($attributes === []) {
            return [
                'guard'       => Guard::Api,
                'permissions' => [],
                'description' => null,
                'system'      => false,
            ];
        }

        /** @var RoleMeta $meta */
        $meta = $attributes[0]->newInstance();

        return [
            'guard'       => $meta->guard,
            'permissions' => $meta->permissions,
            'description' => $meta->description,
            'system'      => $meta->system,
        ];
    }
}
