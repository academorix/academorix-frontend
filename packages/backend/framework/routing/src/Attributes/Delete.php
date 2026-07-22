<?php


/**
 * Delete Attribute
 *
 * PHP 8 attribute for compile-time metadata annotation in the Framework module.
 * Discovered by the compiler to configure runtime behavior automatically.
 *
 * @category Attributes
 *
 * @since    1.0.0
 */

declare(strict_types=1);

namespace Stackra\Routing\Attributes;

use Attribute;
use BackedEnum;
use Stackra\Foundation\Enums\PolicyAbility;
use Spatie\RouteAttributes\Attributes\Delete as SpatieDelete;

/**
 * DELETE Endpoint Attribute.
 *
 * Extends Spatie's Delete attribute to add OpenAPI documentation and authorization.
 */
#[Attribute(Attribute::TARGET_METHOD)]
class Delete extends SpatieDelete
{
    public int $responseCode;

    public function __construct(
        // Routing (Spatie)
        string $uri,
        ?string $name = null,
        array|string $middleware = [],
        array|string $withoutMiddleware = [],
        // OpenAPI
        public ?string $summary = null,
        public ?string $description = null,
        public array $tags = [],
        public array $parameters = [],
        public ?string $responseSchema = null,
        int|BackedEnum $responseCode = 204,
        // Authorization
        public ?array $permissions = null,
        public string $permissionLogic = 'all',
        public PolicyAbility|string|null $ability = null,
        public ?string $modelClass = null,
        public ?string $role = null,
    ) {
        // Convert BackedEnum to value
        $this->responseCode = $responseCode instanceof BackedEnum ? $responseCode->value : $responseCode;

        parent::__construct(
            uri: $uri,
            name: $name,
            middleware: $middleware,
            withoutMiddleware: $withoutMiddleware
        );
    }
}
