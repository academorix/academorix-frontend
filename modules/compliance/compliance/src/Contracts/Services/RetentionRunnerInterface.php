<?php

declare(strict_types=1);

namespace Academorix\Compliance\Contracts\Services;

use Academorix\Compliance\Models\RetentionRun;
use Academorix\Compliance\Services\DefaultRetentionRunner;
use Illuminate\Container\Attributes\Bind;

/**
 * The canonical retention orchestrator.
 *
 * Every tenant sweep flows through here — the runner reads each
 * module's `retention.json` + the inline `#[RetentionPolicy]`
 * attributes + the LegalHoldGate, then writes one `RetentionRun`
 * row per tenant.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Bind(DefaultRetentionRunner::class)]
interface RetentionRunnerInterface
{
    /**
     * Run the retention sweep for one tenant. Returns the
     * `RetentionRun` audit row.
     *
     * @param  string       $tenantId     Owning tenant.
     * @param  string       $trigger      `nightly` / `manual`.
     * @param  string|null  $triggeredBy  Actor id for manual runs.
     */
    public function runForTenant(string $tenantId, string $trigger = 'nightly', ?string $triggeredBy = null): RetentionRun;
}
