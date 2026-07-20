<?php

declare(strict_types=1);

/**
 * User Context Provider.
 *
 * Adds authenticated user information to Nightwatch via
 * `Context::add('user', [...])`. Skips gracefully when no
 * user is authenticated.
 *
 * ## Context Added
 * - id, email, name (when authenticated)
 *
 * ## Octane Safety
 * ✅ Safe — fetches user from `auth()` on each call.
 *
 * @category Contexts
 *
 * @since    1.0.0
 */

namespace Academorix\Nightwatch\Contexts;

use Academorix\Nightwatch\Attributes\AsNightwatchContext;
use Academorix\Nightwatch\Contracts\NightwatchContext;

/**
 * Provides authenticated user data as Nightwatch context.
 *
 * High priority (500) — runs after environment context (1000)
 * but before business-specific providers.
 */
#[AsNightwatchContext(description: 'Adds authenticated user information')]
class UserContext implements NightwatchContext
{
    /**
     * {@inheritDoc}
     */
    public function key(): string
    {
        return 'user';
    }

    /**
     * {@inheritDoc}
     */
    public function data(): array
    {
        if (! auth()->check()) {
            return [];
        }

        $user = auth()->user();

        if (! $user) {
            return [];
        }

        return [
            'id' => $user->id,
            'email' => $user->email ?? null,
            'name' => $user->name ?? null,
        ];
    }

    /**
     * {@inheritDoc}
     */
    public function priority(): int
    {
        return 500;
    }
}
