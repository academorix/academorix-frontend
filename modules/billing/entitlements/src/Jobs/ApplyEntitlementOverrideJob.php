<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Jobs;

use Academorix\Entitlements\Contracts\Data\EntitlementInterface;
use Academorix\Entitlements\Contracts\Repositories\EntitlementRepositoryInterface;
use Academorix\Entitlements\Enums\EntitlementSource;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Apply a platform-admin override to an entitlement, writing the
 * audit trail via the model observer.
 *
 * Kept as a queued job so the API surface returns 202 Accepted
 * instantly; the actual override write commits asynchronously with
 * retries + logging.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[Queue('default')]
#[Timeout(60)]
#[Tries(3)]
final class ApplyEntitlementOverrideJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  array<string, mixed>  $newValue  Kind-dependent shape.
     */
    public function __construct(
        public readonly string $entitlementId,
        public readonly array $newValue,
        public readonly ?string $notes = null,
    ) {
    }

    /**
     * Handle the override.
     */
    public function handle(EntitlementRepositoryInterface $entitlements): void
    {
        $entitlement = $entitlements->find($this->entitlementId);
        if ($entitlement === null) {
            return;
        }

        $entitlement->update([
            EntitlementInterface::ATTR_VALUE  => $this->newValue,
            EntitlementInterface::ATTR_SOURCE => EntitlementSource::Override->value,
            EntitlementInterface::ATTR_NOTES  => $this->notes,
        ]);
    }

    /**
     * `failed()` — invoked when every retry is exhausted.
     */
    public function failed(\Throwable $e): void
    {
    }
}
