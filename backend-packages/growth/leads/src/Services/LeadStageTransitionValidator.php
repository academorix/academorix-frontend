<?php

declare(strict_types=1);

namespace Academorix\Leads\Services;

use Academorix\Leads\Contracts\Services\LeadStageTransitionValidatorInterface;
use Academorix\Leads\Enums\LeadStage;
use Academorix\Leads\Exceptions\LeadInvalidStageTransitionException;
use Illuminate\Container\Attributes\Scoped;

/**
 * Concrete implementation of the lead-stage state machine.
 *
 * The transition table is a compile-time constant — no config, no
 * runtime discovery, no DB. This service is stateless: it's marked
 * `#[Scoped]` (rather than `#[Singleton]`) purely to align with the
 * package-wide default; every method is pure.
 *
 * ## Transitions
 *
 *  * `NEW → CONTACTED | LOST`
 *  * `CONTACTED → QUALIFIED | LOST`
 *  * `QUALIFIED → TRIAL | WON | LOST`
 *  * `TRIAL → WON | LOST`
 *  * `WON` / `LOST` — terminal, no outgoing transitions.
 *
 * `WON` requires the conversion path
 * ({@see \Academorix\Leads\Actions\Tenant\ConvertAction}) — it is NOT
 * reachable via a naked `PATCH /leads/{id}`.
 *
 * @category Leads
 *
 * @since    0.1.0
 */
#[Scoped]
final class LeadStageTransitionValidator implements LeadStageTransitionValidatorInterface
{
    /**
     * The state-machine table — every non-terminal source stage maps
     * to the set of legal target stages.
     *
     * Keyed by the source stage's backing value so `match` can
     * dispatch on it in constant time.
     *
     * @var array<string, list<LeadStage>>
     */
    private const array TRANSITIONS = [
        'NEW' => [
            LeadStage::Contacted,
            LeadStage::Lost,
        ],
        'CONTACTED' => [
            LeadStage::Qualified,
            LeadStage::Lost,
        ],
        'QUALIFIED' => [
            LeadStage::Trial,
            LeadStage::Won,
            LeadStage::Lost,
        ],
        'TRIAL' => [
            LeadStage::Won,
            LeadStage::Lost,
        ],
        // WON + LOST are terminal — no entries.
    ];

    /**
     * {@inheritDoc}
     */
    public function canTransition(LeadStage $from, LeadStage $to): bool
    {
        // Same-stage is never a valid transition — every change is a
        // domain event.
        if ($from === $to) {
            return false;
        }

        $allowed = self::TRANSITIONS[$from->value] ?? [];

        return \in_array($to, $allowed, strict: true);
    }

    /**
     * {@inheritDoc}
     */
    public function assertTransition(LeadStage $from, LeadStage $to): void
    {
        if ($this->canTransition($from, $to)) {
            return;
        }

        // The context captured here appears on the exception's JSON
        // envelope so the FE can render "cannot move from Won to New"
        // without a translation round-trip.
        throw (new LeadInvalidStageTransitionException(\sprintf(
            'Lead stage transition %s → %s is not permitted.',
            $from->value,
            $to->value,
        )))->withContext([
            'from' => $from->value,
            'to'   => $to->value,
        ]);
    }

    /**
     * {@inheritDoc}
     */
    public function nextStagesFrom(LeadStage $from): array
    {
        return self::TRANSITIONS[$from->value] ?? [];
    }

    /**
     * {@inheritDoc}
     */
    public function isTerminal(LeadStage $stage): bool
    {
        return $stage === LeadStage::Won || $stage === LeadStage::Lost;
    }
}
