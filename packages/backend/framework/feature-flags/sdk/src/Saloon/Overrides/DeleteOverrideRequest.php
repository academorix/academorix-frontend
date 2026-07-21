<?php

declare(strict_types=1);

namespace Stackra\FeatureFlagsSdk\Saloon\Overrides;

use Saloon\Enums\Method;
use Saloon\Http\Request;

/**
 * `DELETE /api/v1/feature-flags/overrides/{id}` — soft-delete an override.
 *
 * @category FeatureFlagsSdk
 *
 * @since    0.1.0
 */
final class DeleteOverrideRequest extends Request
{
    /**
     * HTTP verb.
     *
     * @var Method
     */
    protected Method $method = Method::DELETE;

    /**
     * @param  string  $id  Override id.
     */
    public function __construct(
        private readonly string $id,
    ) {}

    /**
     * Return the request path.
     *
     * @return string
     */
    public function resolveEndpoint(): string
    {
        return "/api/v1/feature-flags/overrides/{$this->id}";
    }
}
