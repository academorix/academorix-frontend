<?php

declare(strict_types=1);

/**
 * Horizon Service Provider.
 *
 * Configures Laravel Horizon for production-ready queue monitoring.
 * Extends the vendor Horizon provider and integrates via the
 * AsModuleProvider trait for module lifecycle management.
 *
 * @category Providers
 *
 * @since    1.0.0
 *
 * @see \Stackra\Horizon\Compiler\HorizonCompiler
 * @see https://laravel.com/docs/horizon
 */

namespace Stackra\Horizon\Providers;

use Illuminate\Support\Facades\Gate;
use Laravel\Horizon\Horizon;
use Laravel\Horizon\HorizonServiceProvider as BaseHorizonServiceProvider;
use Override;
use Stackra\ServiceProvider\Attributes\AsModule;
use Stackra\ServiceProvider\Concerns\AsModuleProvider;
use Stackra\ServiceProvider\Contracts\ServiceProviderInterface;
use Stackra\ServiceProvider\Attributes\LoadsResources;

/**
 * Horizon module service provider.
 *
 * Extends the vendor base provider — uses AsModuleProvider trait
 * instead of extending the Stackra ServiceProvider base class.
 *
 * ## Environment Variables
 *
 * Read through {@see config()} — never directly. Definitions live
 * in `config/horizon-notifications.php`; the provider merges the
 * file at boot (via {@see mergeConfigFrom()}) so operators + the
 * config cache both see the same key surface.
 *
 * - `HORIZON_MAIL_NOTIFICATIONS` → `horizon-notifications.mail`
 * - `HORIZON_SLACK_WEBHOOK`     → `horizon-notifications.slack.webhook`
 * - `HORIZON_SLACK_CHANNEL`     → `horizon-notifications.slack.channel` (default `#horizon`)
 * - `HORIZON_SMS_NOTIFICATIONS` → `horizon-notifications.sms`
 */
#[AsModule(name: 'TelemetryHorizon')]
#[LoadsResources()]
class HorizonServiceProvider extends BaseHorizonServiceProvider implements ServiceProviderInterface
{
    use AsModuleProvider;

    /**
     * Bootstrap any application services.
     *
     * Module boot phase runs automatically via the Application.
     * This method handles Horizon-specific configuration only.
     */
    #[Override]
    public function boot(): void
    {
        parent::boot();

        $this->configureAuthentication();
        $this->configureNotifications();
    }

    /**
     * Configure Horizon dashboard authentication.
     *
     * Local: all authenticated users allowed.
     * Production: requires 'view-horizon' permission or admin/developer role.
     */
    protected function configureAuthentication(): void
    {
        Horizon::auth(function ($request): bool {
            if (app()->environment('local')) {
                return true;
            }

            $user = $request->user();

            if (! $user) {
                return false;
            }

            if ($user->can('view-horizon')) {
                return true;
            }

            if ($user->hasRole('admin')) {
                return true;
            }

            return (bool) $user->hasRole('developer');
        });
    }

    /**
     * Configure Horizon notification channels from the config.
     *
     * Values live in `config/horizon-notifications.php` (merged
     * here via {@see mergeConfigFrom()}). Reading via `config()`
     * instead of `env()` honours the Octane-safe config cache —
     * see `.kiro/steering/octane-first-di.md` §Rules-don't #4.
     *
     * Migrated on 2026-07-21 (Phase E5) — the previous version
     * read `env(...)` directly inside boot, which bypasses the
     * cache and re-parses `.env` per Octane worker restart.
     *
     * @see https://laravel.com/docs/horizon#notifications
     */
    protected function configureNotifications(): void
    {
        // Package-level defaults + env-driven values live in
        // config/horizon-notifications.php. Merging here is
        // idempotent — safe on Octane worker restarts.
        $this->mergeConfigFrom(
            __DIR__.'/../../config/horizon-notifications.php',
            'horizon-notifications',
        );

        /** @var string|null $mailTo */
        $mailTo = config('horizon-notifications.mail');
        /** @var string|null $slackWebhook */
        $slackWebhook = config('horizon-notifications.slack.webhook');
        /** @var string $slackChannel */
        $slackChannel = config('horizon-notifications.slack.channel', '#horizon');
        /** @var string|null $smsTo */
        $smsTo = config('horizon-notifications.sms');

        if ($mailTo) {
            Horizon::routeMailNotificationsTo($mailTo);
        }

        if ($slackWebhook) {
            Horizon::routeSlackNotificationsTo($slackWebhook, $slackChannel);
        }

        if ($smsTo) {
            Horizon::routeSmsNotificationsTo($smsTo);
        }
    }

    /**
     * Register the Horizon gate for dashboard access.
     */
    protected function gate(): void
    {
        Gate::define('viewHorizon', function ($user): bool {
            if (app()->environment('local')) {
                return true;
            }

            if ($user->can('view-horizon')) {
                return true;
            }

            if ($user->hasRole('admin')) {
                return true;
            }

            return (bool) $user->hasRole('developer');
        });
    }
}
