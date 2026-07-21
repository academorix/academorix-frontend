<?php

declare(strict_types=1);

namespace Stackra\FeatureFlagsSdk\Saloon\Rollouts;

use Saloon\Enums\Method;
use Saloon\Http\Request;

/**
 * `DELETE /api/v1/feature-flags/rollouts/{id}` — soft-delete a rollout.
 *
 * @category FeatureFlagsSdk
 *
 * @since    0.1.0
 */
final class DeleteRolloutRequest extends Request
{
    /**
     * HTTP verb.
     *
     * @var Method
     */
    protected Method $method = Method::DELETE;

    /**
     * @param  string  $id  Rollout id.
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
        return "/api/v1/feature-flags/rollouts/{$this->id}";
    }
}
