<?php

declare(strict_types=1);

namespace Stackra\Notifications\Push\Services;

use Stackra\Notifications\Push\Contracts\Services\PushTransportManagerInterface;
use Stackra\Notifications\Push\Contracts\Services\TokenValidatorInterface;
use Illuminate\Container\Attributes\Cache;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\Singleton;
use Illuminate\Contracts\Cache\Repository;
use Throwable;

/**
 * Default {@see TokenValidatorInterface} — delegates to the transport
 * manager's `validateToken()` and caches the outcome for a short TTL to
 * prevent duplicate provider hits.
 *
 * `#[Singleton]` — stateless; container-injected framework services are
 * request-safe.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[Singleton]
final class DefaultTokenValidator implements TokenValidatorInterface
{
    public function __construct(
        private readonly PushTransportManagerInterface $manager,
        #[Cache] private readonly Repository $cache,
        #[Config('notifications-push.token_validation.enabled')]
        private readonly bool $enabled,
        #[Config('notifications-push.token_validation.cache_ttl_seconds')]
        private readonly int $cacheTtlSeconds,
    ) {
    }

    /**
     * {@inheritDoc}
     *
     * When `token_validation.enabled` is `false`, always returns `true` — the
     * app deliberately accepts any submitted token (bad tokens waste send
     * budget, but skipping validation is a supported operator escape hatch).
     */
    public function validate(string $provider, string $platform, string $token): bool
    {
        if (! $this->enabled) {
            return true;
        }

        $cacheKey = \sprintf(
            'notifications-push.token-validation.%s.%s',
            $provider,
            \hash('sha256', $token),
        );

        return (bool) $this->cache->remember(
            $cacheKey,
            $this->cacheTtlSeconds,
            function () use ($provider, $platform, $token): bool {
                try {
                    return $this->manager->driver($provider)->validateToken($token, $platform);
                } catch (Throwable) {
                    // Fail-open: provider errors during validation do NOT
                    // block registration. The subsequent SendPushJob will
                    // catch and expire the token if the provider truly
                    // rejects it. This matches the blueprint's "unknown
                    // provider errors on validation are non-blocking".
                    return true;
                }
            },
        );
    }
}
