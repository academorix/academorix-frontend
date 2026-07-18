<?php


/**
 * Patch Attribute
 *
 * PHP 8 attribute for compile-time metadata annotation in the Framework module.
 * Discovered by the compiler to configure runtime behavior automatically.
 *
 * @category Attributes
 *
 * @since    1.0.0
 */
namespace Academorix\Routing\Attributes;

use Attribute;
use Academorix\Foundation\Enums\HttpStatusCode;
use Academorix\Foundation\Enums\PolicyAbility;
use Spatie\RouteAttributes\Attributes\Patch as SpatiePatch;

/**
 * PATCH Endpoint Attribute.
 *
 * Extends Spatie's Patch attribute to add OpenAPI documentation and authorization.
 */
#[Attribute(Attribute::TARGET_METHOD)]
class Patch extends SpatiePatch
{
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
        public ?string $requestSchema = null,
        public ?string $responseSchema = null,
        public string $responseType = 'object',
        public int $responseCode = HttpStatusCode::OK->value,
        // Authorization
        public ?array $permissions = null,
        public string $permissionLogic = 'all',
        public PolicyAbility|string|null $ability = null,
        public ?string $modelClass = null,
        public ?string $role = null,
    ) {
        parent::__construct(
            uri: $uri,
            name: $name,
            middleware: $middleware,
            withoutMiddleware: $withoutMiddleware
        );
    }
}
