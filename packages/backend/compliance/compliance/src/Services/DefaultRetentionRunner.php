<?php

declare(strict_types=1);

namespace Stackra\Compliance\Services;

use Stackra\Compliance\Contracts\Data\RetentionRunInterface;
use Stackra\Compliance\Contracts\Repositories\RetentionRunRepositoryInterface;
use Stackra\Compliance\Contracts\Services\RetentionRunnerInterface;
use Stackra\Compliance\Events\RetentionSweepCompleted;
use Stackra\Compliance\Events\RetentionSweepStarted;
use Stackra\Compliance\Models\RetentionRun;
use Illuminate\Container\Attributes\Scoped;

/**
 * Default retention runner.
 *
 * The default implementation writes a `RetentionRun` row and fires
 * the start / complete events. Production apps override the binding
 * to walk registered modules' retention.json + apply LegalHoldGate.
 *
 * `#[Scoped]` — a real runner holds a per-tenant working set.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Scoped]
final class DefaultRetentionRunner implements RetentionRunnerInterface
{
    public function __construct(
        private readonly RetentionRunRepositoryInterface $runs,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function runForTenant(string $tenantId, string $trigger = 'nightly', ?string $triggeredBy = null): RetentionRun
    {
        $run = $this->runs->create([
            RetentionRunInterface::ATTR_TENANT_ID    => $tenantId,
            RetentionRunInterface::ATTR_STARTED_AT   => \now(),
            RetentionRunInterface::ATTR_STATUS       => 'running',
            RetentionRunInterface::ATTR_TRIGGER      => $trigger,
            RetentionRunInterface::ATTR_TRIGGERED_BY => $triggeredBy,
        ]);

        RetentionSweepStarted::dispatch($run);

        // The default runner performs no actual sweep — production
        // apps override this method to walk registered contributors.
        $run->{RetentionRunInterface::ATTR_STATUS}      = 'completed';
        $run->{RetentionRunInterface::ATTR_FINISHED_AT} = \now();
        $run->save();

        RetentionSweepCompleted::dispatch($run);

        return $run;
    }
}
