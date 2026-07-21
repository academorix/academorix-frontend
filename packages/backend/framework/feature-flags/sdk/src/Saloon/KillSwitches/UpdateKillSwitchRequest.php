<?php

declare(strict_types=1);

namespace Stackra\FeatureFlagsSdk\Saloon\KillSwitches;

use Saloon\Contracts\Body\HasBody;
use Saloon\Enums\Method;
use Saloon\Http\Request;
use Saloon\Traits\Body\HasJsonBody;

/**
 * `PUT /api/v1/feature-flags/kill-switches/{id}` — update a kill switch.
 *
 * @category FeatureFlagsSdk
 *
 * @since    0.1.0
 */
final class UpdateKillSwitchRequest extends Request implements HasBody
{
    use HasJsonBody;

    /**
     * HTTP verb.
     *
     * @var Method
     */
    protected Method $method = Method::PUT;

    /**
     * @param  string                $id      Kill-switch id.
     * @param  array<string, mixed>  $patch   Wire-shape patch payload.
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
        return "/api/v1/feature-flags/kill-switches/{$this->id}";
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
