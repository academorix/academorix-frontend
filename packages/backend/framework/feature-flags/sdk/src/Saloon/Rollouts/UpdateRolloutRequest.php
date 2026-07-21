<?php

declare(strict_types=1);

namespace Stackra\FeatureFlagsSdk\Saloon\Rollouts;

use Saloon\Contracts\Body\HasBody;
use Saloon\Enums\Method;
use Saloon\Http\Request;
use Saloon\Traits\Body\HasJsonBody;

/**
 * `PUT /api/v1/feature-flags/rollouts/{id}` — update a rollout.
 *
 * @category FeatureFlagsSdk
 *
 * @since    0.1.0
 */
final class UpdateRolloutRequest extends Request implements HasBody
{
    use HasJsonBody;

    /**
     * HTTP verb.
     *
     * @var Method
     */
    protected Method $method = Method::PUT;

    /**
     * @param  string                $id     Rollout id.
     * @param  array<string, mixed>  $patch  Patch payload.
     */
    public function __construct(
        private readonly string $id,
        private readonly array $patch,
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

    /**
     * Return the JSON body.
     *
     * @return array<string, mixed>
     */
    protected function defaultBody(): array
    {
        return $this->patch;
    }
}
