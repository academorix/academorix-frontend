<?php

declare(strict_types=1);

/**
 * Sentry Service Provider.
 *
 * Bootstraps the Sentry error tracking sub-package into the Laravel
 * application. Configures the Sentry release version from the current
 * git commit hash.
 *
 * Attribute-based discovery of context providers is handled at compile
 * time by {@see SentryCompiler} — no runtime scanning in this provider.
 *
 * ## Middleware
 *
 * The `SentryContext` middleware auto-registers via
 * `#[AsMiddleware]` — discovered by
 * {@see \Academorix\Routing\Providers\RoutingServiceProvider}.
 *
 * @category Providers
 *
 * @since    1.0.0
 *
 * @see \Academorix\Sentry\Compiler\SentryCompiler
 * @see \Academorix\Sentry\Services\SentryContextRegistry
 */

namespace Academorix\Sentry\Providers;

use Override;
use Academorix\Foundation\Enums\ContainerToken;
use Academorix\ServiceProvider\Attributes\AsModule;
use Academorix\ServiceProvider\Providers\ServiceProvider;
use Academorix\Support\Str;
use Throwable;
use Academorix\ServiceProvider\Attributes\LoadsResources;

/**
 * Sentry module service provider.
 *
 * Priority 20 (Foundation level) — loads early so error tracking
 * context is available for all downstream exceptions.
 *
 * ## Boot Behaviour
 * - Auto-configures SENTRY_RELEASE from git commit hash
 */
#[AsModule(name: 'TelemetrySentry', priority: 20)]
#[LoadsResources()]
class SentryServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * Calls parent register for base functionality, then auto-configures
     * the Sentry release version from the current git commit hash.
     */
    #[Override]
    public function register(): void
    {
        parent::register();

        $this->configureSentryRelease();
    }

    /**
     * Configure Sentry release version from git commit hash.
     *
     * Automatically sets SENTRY_RELEASE if not already configured.
     * Format: {APP_NAME}@{GIT_COMMIT_HASH}
     * Example: template_app@a1b2c3d
     *
     * This enables:
     * - Release tracking in Sentry
     * - Commit-level error tracking
     * - Deploy tracking
     * - Source map association
     */
    protected function configureSentryRelease(): void
    {
        if (! $this->app->bound(ContainerToken::SENTRY->value) || config('sentry.release')) {
            return;
        }

        try {
            $gitHashRaw = shell_exec('git rev-parse --short HEAD 2>/dev/null');
            $gitHash = $gitHashRaw !== null && $gitHashRaw !== false ? trim($gitHashRaw) : '';

            if ($gitHash !== '' && $gitHash !== '0') {
                $appName = config('app.name', 'app');
                $release = Str::format('%s@%s', $appName, $gitHash);

                config(['sentry.release' => $release]);
            }
        } catch (Throwable) {
            // Silently fail if git is not available.
            // Expected in some deployment environments (Docker, etc.).
        }
    }
}
