<?php

declare(strict_types=1);

namespace Stackra\Localization\Strategies;

use Stackra\Localization\Attributes\AsLocaleResolutionStrategy;
use Stackra\Localization\Contracts\Services\LocaleResolutionStrategyInterface;
use Illuminate\Container\Attributes\Auth;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Illuminate\Http\Request;

/**
 * Resolve the active locale from the authenticated user's stored
 * preference (`profile.preferred_locale`).
 *
 * Reads the guard from `config('activity.causer.guard')` /
 * defaults to `sanctum` so tenant-user requests read the tenant
 * guard. Falls through cleanly for anonymous requests.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsLocaleResolutionStrategy(name: 'user')]
#[Scoped]
final class UserPreferenceStrategy implements LocaleResolutionStrategyInterface
{
    /**
     * @param  AuthFactory  $auth  Guard factory.
     */
    public function __construct(
        #[Auth] private readonly AuthFactory $auth,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function resolve(Request $request): ?string
    {
        try {
            $user = $this->auth->guard()->user();
        } catch (\Throwable) {
            // Fail-soft — auth manager throws when no default guard
            // is bound (e.g. under console commands). Skip.
            return null;
        }

        if ($user === null) {
            return null;
        }

        // Read preferred_locale via property access; return null
        // when the attribute is absent so downstream strategies
        // continue the chain.
        $preferred = null;
        if (\method_exists($user, 'getAttribute')) {
            $preferred = $user->getAttribute('preferred_locale');
        }

        if (\is_string($preferred) && $preferred !== '') {
            return $preferred;
        }

        return null;
    }

    /**
     * {@inheritDoc}
     */
    public function name(): string
    {
        return 'user';
    }
}
