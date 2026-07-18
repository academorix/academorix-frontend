<?php

declare(strict_types=1);

namespace Academorix\FeatureFlagsSdk\Connectors;

use Saloon\Http\Auth\TokenAuthenticator;
use Saloon\Http\Connector;

/**
 * Saloon connector for the feature-flags admin API.
 *
 * @category FeatureFlagsSdk
 *
 * @since    0.1.0
 */
final class FeatureFlagsConnector extends Connector
{
    /**
     * @param  string  $baseUrl  Base URL of the admin API.
     * @param  string  $token    Bearer token for the Sanctum guard.
     */
    public function __construct(
        private readonly string $baseUrl,
        private readonly string $token,
    ) {}

    /**
     * Return the base URL for every Saloon request routed through this connector.
     *
     * @return string
     */
    public function resolveBaseUrl(): string
    {
        return $this->baseUrl;
    }

    /**
     * Default authenticator applied to every request.
     *
     * @return TokenAuthenticator
     */
    protected function defaultAuth(): TokenAuthenticator
    {
        return new TokenAuthenticator($this->token);
    }

    /**
     * Default HTTP headers applied to every request.
     *
     * @return array<string, string>
     */
    protected function defaultHeaders(): array
    {
        return [
            'Accept'       => 'application/json',
            'Content-Type' => 'application/json',
        ];
    }
}
