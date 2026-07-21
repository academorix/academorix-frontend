<?php

declare(strict_types=1);

namespace Stackra\Sentry\Examples;

use Stackra\Sentry\Attributes\AsSentryContext;
use Sentry\State\Scope;

/**
 * ## UserContext Example
 *
 * This example shows how to use the `#[AsSentryContext]` attribute to
 * automatically enrich Sentry error reports with custom context data.
 *
 * ### Features demonstrated:
 * 1.  **Automatic Discovery**: The context provider is registered without manual configuration.
 * 2.  **Scope Integration**: Use the `priority` property to control when this context is added.
 * 3.  **Encapsulation**: Keep your Sentry context logic self-contained in its own class.
 *
 * ### How it works:
 * When an error occurs and is reported to Sentry, Telemetry iterates through all
 * discovered `#[AsSentryContext]` classes and applies their logic to the
 * Sentry Scope.
 */
#[AsSentryContext(
    enabled: true,
    priority: 100
)]
class UserContext
{
    /**
     * Applies the context data to the Sentry scope.
     *
     * @param Scope $scope
     * @return void
     */
    public function __invoke(Scope $scope): void
    {
        if (auth()->check()) {
            $user = auth()->user();

            $scope->setUser([
                'id' => $user->id,
                'email' => $user->email,
                'username' => $user->name,
                'ip_address' => request()->ip(),
            ]);

            $scope->setTag('user_type', $user->is_admin ? 'admin' : 'regular');
        }
    }
}
