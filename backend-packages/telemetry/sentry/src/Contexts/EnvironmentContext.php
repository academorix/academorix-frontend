<?php

declare(strict_types=1);

/**
 * Environment Context
 *
 * Provides contextual information for the Telemetry observability layer.
 * Captures and structures environment data for error reporting and tracing.
 *
 * @category Support
 *
 * @since    1.0.0
 */
namespace Academorix\Sentry\Contexts;

use Illuminate\Container\Attributes\Config;
use Academorix\Sentry\Attributes\AsSentryContext;
use Academorix\Sentry\Contracts\SentryContext;
use Sentry\State\Scope;
use Throwable;

/**
 * Environment Context.
 *
 * Enriches Sentry error reports with environment and application metadata.
 * This provider adds critical system information as tags to every error,
 * enabling better filtering and debugging in the Sentry dashboard.
 *
 * ## Context Added:
 * - **environment**: Current application environment (local, staging, production)
 * - **php_version**: PHP runtime version for compatibility tracking
 * - **laravel_version**: Laravel framework version for framework-specific issues
 * - **app_name**: Application name from config for multi-app deployments
 *
 * ## Priority:
 * Runs with highest priority (1000) to ensure environment context is always
 * available first, as other providers may depend on this foundational data.
 *
 * ## Container Binding:
 * This class is automatically resolved from the container with dependency
 * injection support. It is stateless and safe to share across requests in
 * Laravel Octane environments.
 *
 * ## Octane Safety:
 * ✅ Safe - No mutable state, no request-specific data stored
 * ✅ Safe - Only reads from global config and constants
 * ✅ Safe - No side effects or external dependencies
 *
 * @see SentryContextInterface
 */
#[AsSentryContext(description: 'Adds environment and application metadata to Sentry errors')]
class EnvironmentContext implements SentryContext
{
    /**
     * Create a new environment context provider instance.
     *
     * @param string $appName Application name from config
     */
    public function __construct(
        #[Config('app.name')]
        protected readonly string $appName,
    ) {}

    /**
     * Provide environment and application context to Sentry scope.
     *
     * This method is called automatically by the Sentry integration before
     * an error is sent to Sentry. It adds environment metadata as tags,
     * which appear in the Sentry UI and can be used for filtering and
     * grouping errors.
     *
     * Tags added:
     * - environment: Helps filter errors by deployment environment
     * - php_version: Identifies PHP version-specific issues
     * - laravel_version: Tracks framework version for compatibility
     * - app_name: Distinguishes between multiple apps in same Sentry project
     *
     * @param Scope          $scope     The Sentry scope to enrich with context
     * @param Throwable|null $throwable The exception being reported (unused here)
     */
    public function provide(Scope $scope, ?Throwable $throwable = null): void
    {
        // Add current environment (local, staging, production, etc.)
        // This is the most critical tag for filtering errors by deployment stage
        $scope->setTag('environment', (string) app()->environment());

        // Add PHP version to track version-specific bugs or compatibility issues
        // Useful when debugging issues that only occur on certain PHP versions
        $scope->setTag('php_version', PHP_VERSION);

        // Add Laravel framework version for framework-specific issue tracking
        // Helps identify if errors are related to specific Laravel versions
        $scope->setTag('laravel_version', (string) app()->version());

        // Add application name from config for multi-application deployments
        // Useful when multiple apps share the same Sentry project
        $scope->setTag('app_name', $this->appName);
    }

    /**
     * Get the priority for this context provider.
     *
     * Higher priority providers run first. This provider uses the highest
     * priority (1000) to ensure environment context is always available
     * before other providers run, as they may depend on this foundational
     * information.
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
        // Highest priority - environment context should always be added first
        return 1000;
    }
}
