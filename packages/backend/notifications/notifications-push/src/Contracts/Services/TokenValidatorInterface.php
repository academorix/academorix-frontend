<?php

declare(strict_types=1);

namespace Academorix\Notifications\Push\Contracts\Services;

use Academorix\Notifications\Push\Services\DefaultTokenValidator;
use Illuminate\Container\Attributes\Bind;

/**
 * Token validator seam.
 *
 * The observer's `creating` hook calls {@see validate()} to dry-run the token
 * against its provider before persisting the subscription. The default
 * {@see DefaultTokenValidator} delegates to the transport manager's
 * `validateToken()` and caches the outcome for `token_validation.cache_ttl_seconds`
 * to prevent duplicate provider hits when the same token is registered twice
 * in quick succession.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[Bind(DefaultTokenValidator::class)]
interface TokenValidatorInterface
{
    /**
     * Whether the token is currently valid on the provider.
     */
    public function validate(string $provider, string $platform, string $token): bool;
}
