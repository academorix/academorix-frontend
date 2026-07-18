<?php

declare(strict_types=1);

/**
 * @file packages/crud/src/Attributes/UseData.php
 *
 * @description
 * `#[UseData]` — the declarative binding between a class (typically
 * a Service or a CRUD Controller) and the Spatie
 * {@see \Spatie\LaravelData\Data} DTO classes that transport data
 * across its boundary.
 *
 * ## Two shapes: monoclass vs. triclass
 *
 * A single-line CRUD surface reuses one Data class for validation
 * on input AND serialisation on output:
 *
 *   #[UseData(UserData::class)]
 *
 * A CRUD surface with distinct create / update / read semantics
 * (different fields required on create than on update, different
 * shape on the wire than in the DB) supplies specific classes:
 *
 *   #[UseData(
 *       class:    UserData::class,          // default (also the output)
 *       store:    CreateUserData::class,    // validated on POST
 *       update:   UpdateUserData::class,    // validated on PUT/PATCH
 *       resource: UserResourceData::class,  // shape returned on the wire
 *   )]
 *
 * Backward-compatible: existing `#[UseData(UserData::class)]` calls
 * work unchanged — every slot falls back to `$class` when unset.
 *
 * ## Consumers
 *
 *   - Base HTTP controllers via
 *     {@see \Academorix\Routing\Concerns\InteractsWithDataTransformation}
 *     — reads `$class` for the generic transform helpers.
 *   - {@see \Academorix\Crud\Controllers\CrudController} via
 *     {@see \Academorix\Crud\Concerns\Controller\InteractsWithCrudDeclarations}
 *     — reads the per-slot accessors (`forStore()`, `forUpdate()`,
 *     `forResource()`) so `store()` / `update()` / `index()` /
 *     `show()` each pick up the right class.
 *
 * ## Discovery
 *
 * The attribute is compile-time discovered by
 * `olvlvl/composer-attribute-collector` for cross-controller
 * catalogues and cache priming; individual controllers read their
 * own attribute at request time via reflection (cheap and stateless
 * — one `ReflectionClass::getAttributes()` call per controller
 * lifetime).
 *
 * @category Attributes
 *
 * @since    1.0.0
 */

namespace Academorix\Crud\Attributes;

use Attribute;
use Spatie\LaravelData\Data;

#[Attribute(Attribute::TARGET_CLASS)]
final readonly class UseData
{
    /**
     * @param class-string<Data> $class Default Data class. Used
     *   for every slot (store / update / resource) that isn't
     *   overridden. Required.
     * @param class-string<Data>|null $store Optional Data class
     *   validating the create/POST payload. Defaults to `$class`.
     * @param class-string<Data>|null $update Optional Data class
     *   validating the update/PUT/PATCH payload. Defaults to `$class`.
     * @param class-string<Data>|null $resource Optional Data class
     *   used to serialise a model to the wire. Defaults to `$class`.
     */
    public function __construct(
        public string $class,
        public ?string $store = null,
        public ?string $update = null,
        public ?string $resource = null,
    ) {
    }

    /**
     * Data class validating store/POST payloads.
     *
     * @return class-string<Data>
     */
    public function forStore(): string
    {
        return $this->store ?? $this->class;
    }

    /**
     * Data class validating update/PUT/PATCH payloads.
     *
     * @return class-string<Data>
     */
    public function forUpdate(): string
    {
        return $this->update ?? $this->class;
    }

    /**
     * Data class serialising models on the response.
     *
     * @return class-string<Data>
     */
    public function forResource(): string
    {
        return $this->resource ?? $this->class;
    }
}
