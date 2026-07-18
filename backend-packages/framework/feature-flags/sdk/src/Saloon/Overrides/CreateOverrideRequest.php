<?php

declare(strict_types=1);

namespace Academorix\FeatureFlagsSdk\Saloon\Overrides;

use Academorix\FeatureFlagsSdk\Data\FeatureOverrideData;
use Saloon\Contracts\Body\HasBody;
use Saloon\Enums\Method;
use Saloon\Http\Request;
use Saloon\Traits\Body\HasJsonBody;

/**
 * `POST /api/v1/feature-flags/overrides` — create an override.
 *
 * @category FeatureFlagsSdk
 *
 * @since    0.1.0
 */
final class CreateOverrideRequest extends Request implements HasBody
{
    use HasJsonBody;

    /**
     * HTTP verb.
     *
     * @var Method
     */
    protected Method $method = Method::POST;

    /**
     * @param  FeatureOverrideData  $data  Wire DTO carrying the payload.
     */
    public function __construct(
        private readonly FeatureOverrideData $data,
    ) {}

    /**
     * Return the request path.
     *
     * @return string
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/feature-flags/overrides';
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
