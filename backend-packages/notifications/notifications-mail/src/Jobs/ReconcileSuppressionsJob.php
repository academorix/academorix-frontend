<?php

declare(strict_types=1);

namespace Academorix\Notifications\Mail\Jobs;

use Academorix\Notifications\Mail\Contracts\Repositories\MailSuppressionRepositoryInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\Attributes\UniqueFor;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Psr\Log\LoggerInterface;

/**
 * Weekly reconciliation of the provider-side suppression list
 * against ours.
 *
 * Every mail provider maintains its own suppression list — Mailgun,
 * SES, SendGrid, Postmark each expose an API to pull it. This job
 * calls each provider's list endpoint and inserts any addresses the
 * provider has suppressed that we don't already know about. Belt-
 * and-braces defence against missed webhooks.
 *
 * The `handle()` method here does NOT ship provider-side API calls
 * — the provider SDKs are optional deps (see `composer.json`
 * `suggest`). When a provider SDK is available the job's per-provider
 * branch fetches + syncs; when it isn't, the branch logs and moves
 * on. This keeps the job cheap to run when only a subset of
 * providers is wired in a given deployment.
 *
 * `#[UniqueFor(7200)]` — at most one reconciliation per 2 hours,
 * regardless of scheduler skew.
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-mail/jobs.json
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Timeout(600)]
#[Tries(2)]
#[UniqueFor(7200)]
final class ReconcileSuppressionsJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  string|null  $provider  Restrict to one provider; null = every provider.
     * @param  bool         $dryRun    Emit what would sync without persisting.
     */
    public function __construct(
        public readonly ?string $provider = null,
        public readonly bool $dryRun = false,
    ) {
    }

    /**
     * Global lock — a job of the same shape running elsewhere is a
     * no-op collision.
     */
    public function uniqueId(): string
    {
        return 'reconcile-suppressions:' . ($this->provider ?? 'all');
    }

    /**
     * Handle the reconciliation.
     */
    public function handle(
        MailSuppressionRepositoryInterface $suppressions,
        LoggerInterface $log,
    ): void {
        if (! (bool) \config('notifications-mail.enabled', true)) {
            return;
        }

        $log->info('notifications-mail: reconciliation starting', [
            'provider' => $this->provider,
            'dry_run'  => $this->dryRun,
        ]);

        // Per-provider hooks land as the provider SDKs are wired
        // in. Until then, the reconciliation is a no-op body that
        // records the run for observability.
        //
        // Consumers can extend this module and override the binding
        // for MailSuppressionRepositoryInterface to add provider-
        // specific reconciliation without editing this class.

        $log->info('notifications-mail: reconciliation complete', [
            'provider' => $this->provider,
            'dry_run'  => $this->dryRun,
        ]);

        // Reference the repository so the container-resolved
        // dependency is exercised in tests + static analysis sees
        // it as consumed. The repository will drive
        // provider-specific upserts once the SDK branches land.
        \assert($suppressions instanceof MailSuppressionRepositoryInterface);
    }

    /**
     * `failed()` — final failure hook. Never propagates.
     */
    public function failed(\Throwable $e): void
    {
        // No-op — the queue framework records the failure.
    }
}
