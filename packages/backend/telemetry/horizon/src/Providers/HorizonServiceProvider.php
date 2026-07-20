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
 * @see \Academorix\Horizon\Compiler\HorizonCompiler
 * @see https://laravel.com/docs/horizon
 */

namespace Academorix\Horizon\Providers;

use Illuminate\Support\Facades\Gate;
use Laravel\Horizon\Horizon;
use Laravel\Horizon\HorizonServiceProvider as BaseHorizonServiceProvider;
use Override;
use Academorix\ServiceProvider\Attributes\AsModule;
use Academorix\ServiceProvider\Concerns\AsModuleProvider;
use Academorix\ServiceProvider\Contracts\ServiceProviderInterface;
use Academorix\ServiceProvider\Attributes\LoadsResources;

/**
 * Horizon module service provider.
 *
 * Extends the vendor base provider — uses AsModuleProvider trait
 * instead of extending the Academorix ServiceProvider base class.
 *
 * ## Environment Variables
 * - HORIZON_MAIL_NOTIFICATIONS: Email address for notifications
 * - HORIZON_SLACK_WEBHOOK: Slack webhook URL
 * - HORIZON_SLACK_CHANNEL: Slack channel (default: #horizon)
 * - HORIZON_SMS_NOTIFICATIONS: SMS phone number
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
     * Configure Horizon notification channels from environment variables.
     *
     * @see https://laravel.com/docs/horizon#notifications
     */
    protected function configureNotifications(): void
    {
        $mailTo = env('HORIZON_MAIL_NOTIFICATIONS');
        $slackWebhook = env('HORIZON_SLACK_WEBHOOK');
        $slackChannel = env('HORIZON_SLACK_CHANNEL', '#horizon');
        $smsTo = env('HORIZON_SMS_NOTIFICATIONS');

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
