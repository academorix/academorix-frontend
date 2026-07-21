<?php

declare(strict_types=1);

/**
 * User Context
 *
 * Provides contextual information for the Telemetry observability layer.
 * Captures and structures environment data for error reporting and tracing.
 *
 * @category Support
 *
 * @since    1.0.0
 */
namespace Stackra\Sentry\Contexts;

use Stackra\Sentry\Attributes\AsSentryContext;
use Stackra\Sentry\Contracts\SentryContext;
use Sentry\State\Scope;
use Throwable;

/**
 * User Context.
 *
 * Enriches Sentry error reports with authenticated user information.
 * This provider automatically attaches user identity data to errors,
 * enabling user-specific error tracking and debugging in Sentry.
 *
 * ## Context Added:
 * - **id**: User's unique identifier for tracking errors per user
 * - **email**: User's email address for contact and identification
 * - **username**: User's display name for human-readable identification
 *
 * ## Behavior:
 * - Only adds user context when a user is authenticated
 * - Gracefully handles missing email/name fields with null coalescing
 * - Does not add context for guest/unauthenticated requests
 *
 * ## Priority:
 * Runs with high priority (500) to ensure user context is available
 * early in the context enrichment pipeline, after environment context
 * but before business-specific context providers.
 *
 * ## Container Binding:
 * This class is automatically resolved from the container. It is stateless
 * and safe to share across requests in Laravel Octane environments. User data
 * is fetched fresh on each request via auth()->user(), not stored in properties.
 *
 * ## Octane Safety:
 * ✅ Safe - No mutable state, no request-specific data stored in properties
 * ✅ Safe - Fetches user from auth() facade on each call (request-scoped)
 * ✅ Safe - No side effects or external dependencies
 * ⚠️  Note - Relies on auth() facade being properly reset between Octane requests
 *
 * ## Privacy Considerations:
 * User email and name are sent to Sentry. Ensure this complies with your
 * privacy policy and data protection requirements (GDPR, etc.). Consider
 * using Sentry's data scrubbing features if needed.
 *
 * @see SentryContextInterface
 */
#[AsSentryContext(description: 'Adds authenticated user information to Sentry errors')]
class UserContext implements SentryContext
{
    /**
     * Provide authenticated user context to Sentry scope.
     *
     * This method is called automatically by the Sentry integration before
     * an error is sent to Sentry. It checks if a user is authenticated and,
     * if so, attaches their identity information to the error report.
     *
     * User context enables:
     * - Tracking which users are affected by specific errors
     * - Filtering errors by user in the Sentry dashboard
     * - Contacting affected users about issues
     * - Understanding user-specific error patterns
     *
     * The method safely handles missing user attributes (email, name) by
     * using null coalescing, ensuring partial data doesn't break reporting.
     *
     * @param Scope          $scope     The Sentry scope to enrich with user context
     * @param Throwable|null $throwable The exception being reported (unused here)
     */
    public function provide(Scope $scope, ?Throwable $throwable = null): void
    {
        // Only add user context if someone is authenticated
        // Guest requests will skip this entirely, which is correct behavior
        if (! auth()->check()) {
            return;
        }

        // Fetch the authenticated user from the current request
        // This is safe in Octane because auth() is request-scoped
        $user = auth()->user();

        if (! $user) {
            return;
        }

        // Set user context in Sentry with identity information
        // This appears in the "User" section of error reports in Sentry UI
        $scope->setUser([
            // User ID is the primary identifier for tracking errors per user
            // Cast to string/int as needed by your user model
            'id' => $user->id,
            // Email provides a way to contact affected users
            // Uses null coalescing in case email field doesn't exist or is null
            'email' => $user->email ?? null,
            // Username/name provides human-readable identification in Sentry UI
            // Uses null coalescing in case name field doesn't exist or is null
            'username' => $user->name ?? null,
        ]);
    }

    /**
     * Get the priority for this context provider.
     *
     * This provider uses high priority (500) to ensure user context is
     * added early in the pipeline, after environment context (1000) but
     * before business-specific context providers.
     *
     * Priority scale:
     * - 1000: Critical/foundational context (environment, system info)
     * - 500-999: High priority context (user, request)
     * - 100-499: Medium priority context (business logic)
     * - 1-99: Low priority context (optional metadata)
     *
     * @return int Priority value (higher = runs first)
     */
    public function priority(): int
    {
        // High priority - user context should be added early
        return 500;
    }
}
