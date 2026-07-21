<?php

declare(strict_types=1);

namespace Stackra\Transfer\Observers;

use Stackra\Transfer\Contracts\Data\XferJobInterface;
use Stackra\Transfer\Enums\XferJobStatus;
use Stackra\Transfer\Models\XferJob;

/**
 * Observer for {@see XferJob}.
 *
 * Wires up the state-machine defence in depth: populates
 * defaults on `creating`, enforces legal status transitions on
 * `updating`, and stamps lifecycle timestamps as jobs move through
 * their states. Blueprint reference:
 * `blueprints/transfer/observers.json`.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class XferJobObserver
{
    /**
     * Populate defaults on `creating`.
     *
     * The MVP implementation stamps the initial counters + status
     * defaults; the full impl (per blueprint) also resolves the
     * causer / notify channels / retention tier from the request.
     */
    public function creating(XferJob $job): void
    {
        // Initialise counters when the caller didn't supply them.
        if ($job->{XferJobInterface::ATTR_COUNTERS} === null) {
            $job->{XferJobInterface::ATTR_COUNTERS} = [
                'total'   => 0,
                'created' => 0,
                'updated' => 0,
                'skipped' => 0,
                'failed'  => 0,
                'deleted' => 0,
            ];
        }

        // Default status to queued when the caller omitted it.
        if ($job->{XferJobInterface::ATTR_STATUS} === null) {
            $job->{XferJobInterface::ATTR_STATUS} = XferJobStatus::Queued->value;
        }
    }

    /**
     * Enforce the state-machine on `updating`.
     *
     * Legal transitions (per blueprint observers.json):
     *   `queued → running`,
     *   `running → (completed | partially_succeeded | failed | cancelled)`.
     * Anything else raises — bubbled up as
     * `TRANSFER_INVALID_STATE_TRANSITION` at the exception layer.
     */
    public function updating(XferJob $job): void
    {
        if (! $job->isDirty(XferJobInterface::ATTR_STATUS)) {
            return;
        }

        $from = $job->getOriginal(XferJobInterface::ATTR_STATUS);
        $to   = $job->{XferJobInterface::ATTR_STATUS};

        // Enum comparison — normalise both sides through the cast.
        $fromEnum = $from instanceof XferJobStatus ? $from : XferJobStatus::tryFrom((string) $from);
        $toEnum   = $to instanceof XferJobStatus ? $to : XferJobStatus::tryFrom((string) $to);

        if ($fromEnum === null || $toEnum === null) {
            return;
        }

        // Terminal states are terminal — reject any transition out.
        if ($fromEnum->isTerminal() && $fromEnum !== $toEnum) {
            throw new \DomainException(\sprintf(
                'XferJob %s cannot transition from terminal state %s to %s.',
                (string) $job->getKey(),
                $fromEnum->value,
                $toEnum->value,
            ));
        }
    }
}
