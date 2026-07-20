<?php

declare(strict_types=1);

namespace Academorix\FeatureFlagsSdk\Saloon\KillSwitches;

use Saloon\Enums\Method;
use Saloon\Http\Request;

/**
 * `DELETE /api/v1/feature-flags/kill-switches/{id}` — soft-delete a kill switch.
 *
 * @category FeatureFlagsSdk
 *
 * @since    0.1.0
 */
final class DeleteKillSwitchRequest extends Request
{
    /**
     * HTTP verb.
     *
     * @var Method
     */
    protected Method $method = Method::DELETE;

    /**
     * @param  string  $id  Kill-switch id.
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
        return "/api/v1/feature-flags/kill-switches/{$this->id}";
    }
}
