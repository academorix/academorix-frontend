<?php

declare(strict_types=1);

namespace Academorix\FeatureFlagsSdk\Saloon\Rollouts;

use Academorix\FeatureFlagsSdk\Data\FeatureRolloutData;
use Saloon\Contracts\Body\HasBody;
use Saloon\Enums\Method;
use Saloon\Http\Request;
use Saloon\Traits\Body\HasJsonBody;

/**
 * `POST /api/v1/feature-flags/rollouts` — create a rollout.
 *
 * @category FeatureFlagsSdk
 *
 * @since    0.1.0
 */
final class CreateRolloutRequest extends Request implements HasBody
{
    use HasJsonBody;

    /**
     * HTTP verb.
     *
     * @var Method
     */
    protected Method $method = Method::POST;

    /**
     * @param  FeatureRolloutData  $data  Wire DTO carrying the payload.
     */
    public function __construct(
        private readonly FeatureRolloutData $data,
    ) {}

    /**
     * Return the request path.
     *
     * @return string
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/feature-flags/rollouts';
    }

    /**
     * Return the JSON body.
     *
     * @return array<string, mixed>
     */
    protected function defaultBody(): array
    {
        return $this->data->toArray();
    }
}
