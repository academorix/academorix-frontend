<?php

declare(strict_types=1);

namespace Academorix\FeatureFlagsSdk\Saloon\KillSwitches;

use Academorix\FeatureFlagsSdk\Data\FeatureKillSwitchData;
use Saloon\Contracts\Body\HasBody;
use Saloon\Enums\Method;
use Saloon\Http\Request;
use Saloon\Traits\Body\HasJsonBody;

/**
 * `POST /api/v1/feature-flags/kill-switches` — create a kill switch.
 *
 * @category FeatureFlagsSdk
 *
 * @since    0.1.0
 */
final class CreateKillSwitchRequest extends Request implements HasBody
{
    use HasJsonBody;

    /**
     * HTTP verb.
     *
     * @var Method
     */
    protected Method $method = Method::POST;

    /**
     * @param  FeatureKillSwitchData  $data  Wire DTO carrying the payload.
     */
    public function __construct(
        private readonly FeatureKillSwitchData $data,
    ) {}

    /**
     * Return the request path.
     *
     * @return string
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/feature-flags/kill-switches';
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
