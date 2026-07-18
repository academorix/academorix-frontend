<?php

declare(strict_types=1);

/**
 * @file packages/crud/src/Concerns/Controller/InteractsWithCrudDeclarations.php
 *
 * @description
 * Reads the two attributes a CRUD controller declares —
 * {@see \Academorix\Crud\Attributes\UseData} and
 * {@see \Academorix\Crud\Attributes\UsePolicy} — and exposes cached
 * resolvers the base {@see \Academorix\Crud\Controllers\CrudController}
 * uses inside `store()` / `update()` / `index()` / `show()` /
 * `destroy()`.
 *
 * ## Why this is a per-package trait, not on the Routing base
 *
 * `packages/routing`'s `Controller` already ships
 * `InteractsWithDataTransformation` (reads `#[UseData]` for the
 * generic transform helpers). The CRUD contract is a superset: it
 * needs THREE possible Data classes (`store`, `update`, `resource`)
 * and a `#[UsePolicy]` binding that only makes sense in a
 * CRUD-aware context. Keeping the CRUD-specific resolvers here
 * — not in Routing — preserves layer isolation: routing knows
 * nothing about the CRUD attribute vocabulary.
 *
 * ## Attribute reading strategy
 *
 * `ReflectionClass::getAttributes()` at request time. Options
 * considered and rejected:
 *
 *   - **olvlvl `Attributes::forClass()`** — requires the manifest
 *     to be primed and adds a coupling to the collector. Runtime
 *     reflection is O(1) per controller instance and doesn't
 *     depend on composer state.
 *   - **`DiscoversAttributes` contract** — the contract's
 *     `forClass(attr)` returns "all classes carrying attr" — the
 *     inverse of what we want ("all attrs on this class"). Using
 *     it here would either iterate a large list or force a
 *     contract change; not worth it for one reflection call per
 *     controller lifetime.
 *
 * Both attribute reads are cached on the trait's private state so
 * repeated calls within the same request are free.
 *
 * ## Failure modes
 *
 * A concrete controller that extends {@see CrudController} but omits
 * `#[UseData]` gets a loud `RuntimeException` on the first call to
 * `storeData()` / `updateData()` / `resourceData()`. That's the
 * right failure mode — the controller has no way to serialise
 * anything without a Data class, so failing early beats returning
 * garbage.
 *
 * `#[UsePolicy]` is entirely optional; its absence returns `null`
 * and the base controller silently skips policy authorization.
 *
 * @category Concerns
 *
 * @since    1.0.0
 */

namespace Academorix\Crud\Concerns\Controller;

use Academorix\Crud\Attributes\UseData;
use Academorix\Crud\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Model;
use ReflectionClass;
use RuntimeException;
use Spatie\LaravelData\Data;

/**
 * Reads `#[UseData]` + `#[UsePolicy]` off the concrete controller
 * class and caches the results for the request lifetime.
 *
 * Consumed by {@see \Academorix\Crud\Controllers\CrudController}.
 */
trait InteractsWithCrudDeclarations
{
    /**
     * Cached `#[UseData]` instance. `null` means "not yet read"
     * OR "attribute absent" — {@see $useDataResolved} disambiguates.
     */
    private ?UseData $useDataAttribute = null;

    /**
     * Whether we've attempted to read `#[UseData]` yet. Prevents
     * repeated reflection when the attribute is genuinely absent.
     */
    private bool $useDataResolved = false;

    /**
     * Cached `#[UsePolicy]` instance. Same disambiguation as above.
     */
    private ?UsePolicy $usePolicyAttribute = null;

    /**
     * Whether we've attempted to read `#[UsePolicy]` yet.
     */
    private bool $usePolicyResolved = false;

    // -------------------------------------------------------------------
    // #[UseData] resolution
    // -------------------------------------------------------------------

    /**
     * Retrieve the `#[UseData]` attribute on the concrete controller,
     * or `null` when it's absent.
     */
    protected function resolveUseData(): ?UseData
    {
        if ($this->useDataResolved) {
            return $this->useDataAttribute;
        }

        $this->useDataResolved = true;
        $this->useDataAttribute = $this->readClassAttribute(UseData::class);

        return $this->useDataAttribute;
    }

    /**
     * Data class validating create/POST payloads.
     *
     * @return class-string<Data>
     *
     * @throws RuntimeException When `#[UseData]` is absent.
     */
    protected function storeDataClass(): string
    {
        return $this->requireUseData()->forStore();
    }

    /**
     * Data class validating update/PUT/PATCH payloads.
     *
     * @return class-string<Data>
     *
     * @throws RuntimeException When `#[UseData]` is absent.
     */
    protected function updateDataClass(): string
    {
        return $this->requireUseData()->forUpdate();
    }

    /**
     * Data class used to serialise models on the response wire.
     *
     * @return class-string<Data>
     *
     * @throws RuntimeException When `#[UseData]` is absent.
     */
    protected function resourceDataClass(): string
    {
        return $this->requireUseData()->forResource();
    }

    /**
     * Enforce that the concrete controller declared `#[UseData]`.
     *
     * @throws RuntimeException Named error pointing the operator at
     *   the offending controller class.
     */
    private function requireUseData(): UseData
    {
        $attribute = $this->resolveUseData();

        if ($attribute === null) {
            throw new RuntimeException(sprintf(
                'CRUD controller [%s] must declare #[Academorix\Crud\Attributes\UseData(...)] '
                . '— every store/update/resource action reads its Data class from that attribute.',
                static::class,
            ));
        }

        return $attribute;
    }

    // -------------------------------------------------------------------
    // #[UsePolicy] resolution
    // -------------------------------------------------------------------

    /**
     * Retrieve the `#[UsePolicy]` attribute on the concrete controller,
     * or `null` when it's absent or its `enabled` flag is `false`.
     */
    protected function resolveUsePolicy(): ?UsePolicy
    {
        if ($this->usePolicyResolved) {
            return $this->usePolicyAttribute;
        }

        $this->usePolicyResolved = true;
        $attribute = $this->readClassAttribute(UsePolicy::class);

        // Treat a disabled attribute the same as an absent one — the
        // base controller's `authorizeWhenPolicied()` shortcut on null.
        $this->usePolicyAttribute = ($attribute !== null && $attribute->enabled)
            ? $attribute
            : null;

        return $this->usePolicyAttribute;
    }

    /**
     * The Eloquent model class the policy authorizes against.
     *
     * Returns `null` when `#[UsePolicy]` is absent OR disabled — the
     * base controller interprets `null` as "skip policy authorization
     * for this action; route-level middleware handles it."
     *
     * @return class-string<Model>|null
     */
    protected function policyModel(): ?string
    {
        return $this->resolveUsePolicy()?->model;
    }

    // -------------------------------------------------------------------
    // Reflection helper
    // -------------------------------------------------------------------

    /**
     * Read one class-level attribute off `static::class` and
     * materialise it.
     *
     * PHP's `ReflectionClass::getAttributes(name)` returns a list of
     * matching ReflectionAttribute instances. CRUD attributes are all
     * `TARGET_CLASS` singletons — we take the first hit and
     * instantiate it. Returns `null` when no match is found.
     *
     * @template T of object
     *
     * @param class-string<T> $attributeClass
     * @return T|null
     */
    private function readClassAttribute(string $attributeClass): ?object
    {
        $reflection = new ReflectionClass(static::class);
        $matches = $reflection->getAttributes($attributeClass);

        if ($matches === []) {
            return null;
        }

        /** @var T $instance */
        $instance = $matches[0]->newInstance();

        return $instance;
    }
}
