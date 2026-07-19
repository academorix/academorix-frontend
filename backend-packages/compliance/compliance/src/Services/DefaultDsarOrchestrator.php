<?php

declare(strict_types=1);

namespace Academorix\Compliance\Services;

use Academorix\Compliance\Contracts\Data\DsarInterface;
use Academorix\Compliance\Contracts\Services\DsarOrchestratorInterface;
use Academorix\Compliance\Enums\DsarState;
use Academorix\Compliance\Events\DsarAssembled;
use Academorix\Compliance\Events\DsarCollectionStarted;
use Academorix\Compliance\Events\DsarDelivered;
use Academorix\Compliance\Events\DsarRejected;
use Academorix\Compliance\Events\DsarTriaged;
use Academorix\Compliance\Exceptions\DsarStateInvalidException;
use Academorix\Compliance\Models\Dsar;
use DateTimeInterface;
use Illuminate\Container\Attributes\Scoped;

/**
 * Default DSAR state-machine controller.
 *
 * Every transition validates the from-state against the allowed
 * predecessors + fires the matching event on success.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Scoped]
final class DefaultDsarOrchestrator implements DsarOrchestratorInterface
{
    /**
     * {@inheritDoc}
     */
    public function triage(Dsar $dsar): Dsar
    {
        $this->assertFromState($dsar, [DsarState::Received->value]);

        $dsar->{DsarInterface::ATTR_STATE} = DsarState::Triaging->value;
        $dsar->save();

        DsarTriaged::dispatch($dsar);

        return $dsar;
    }

    /**
     * {@inheritDoc}
     */
    public function startCollection(Dsar $dsar): Dsar
    {
        $this->assertFromState($dsar, [DsarState::Triaging->value]);

        $dsar->{DsarInterface::ATTR_STATE}       = DsarState::Collecting->value;
        $dsar->{DsarInterface::ATTR_VERIFIED_AT} = \now();
        $dsar->save();

        DsarCollectionStarted::dispatch($dsar);

        return $dsar;
    }

    /**
     * {@inheritDoc}
     */
    public function assemble(Dsar $dsar): Dsar
    {
        $this->assertFromState($dsar, [DsarState::Collecting->value]);

        $dsar->{DsarInterface::ATTR_STATE} = DsarState::Assembling->value;
        $dsar->save();

        DsarAssembled::dispatch($dsar);

        return $dsar;
    }

    /**
     * {@inheritDoc}
     */
    public function deliver(Dsar $dsar, string $downloadSignature, DateTimeInterface $expiresAt): Dsar
    {
        $this->assertFromState($dsar, [DsarState::Assembling->value]);

        $dsar->{DsarInterface::ATTR_STATE}               = DsarState::Delivered->value;
        $dsar->{DsarInterface::ATTR_DELIVERED_AT}        = \now();
        $dsar->{DsarInterface::ATTR_DOWNLOAD_SIGNATURE}  = $downloadSignature;
        $dsar->{DsarInterface::ATTR_DOWNLOAD_EXPIRES_AT} = $expiresAt;
        $dsar->save();

        DsarDelivered::dispatch($dsar);

        return $dsar;
    }

    /**
     * {@inheritDoc}
     */
    public function reject(Dsar $dsar, string $reason): Dsar
    {
        // Rejection is allowed from any non-terminal state.
        $currentState = $this->stateValue($dsar);
        if (\in_array($currentState, [DsarState::Delivered->value, DsarState::Rejected->value], strict: true)) {
            throw new DsarStateInvalidException(\sprintf(
                'DSAR is already terminal in state "%s".',
                $currentState,
            ));
        }

        $dsar->{DsarInterface::ATTR_STATE}            = DsarState::Rejected->value;
        $dsar->{DsarInterface::ATTR_REJECTED_AT}      = \now();
        $dsar->{DsarInterface::ATTR_REJECTION_REASON} = $reason;
        $dsar->save();

        DsarRejected::dispatch($dsar, $reason);

        return $dsar;
    }

    /**
     * Enforce a state-machine precondition.
     *
     * @param  list<string>  $allowedFromStates
     *
     * @throws DsarStateInvalidException
     */
    private function assertFromState(Dsar $dsar, array $allowedFromStates): void
    {
        $current = $this->stateValue($dsar);
        if (! \in_array($current, $allowedFromStates, strict: true)) {
            throw new DsarStateInvalidException(\sprintf(
                'DSAR state transition from "%s" is not permitted; expected one of [%s].',
                $current,
                \implode(', ', $allowedFromStates),
            ));
        }
    }

    /**
     * Read the DSAR's state as its scalar value.
     */
    private function stateValue(Dsar $dsar): string
    {
        $state = $dsar->{DsarInterface::ATTR_STATE};

        return $state instanceof DsarState ? $state->value : (string) $state;
    }
}
