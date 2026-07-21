<?php

declare(strict_types=1);

namespace Stackra\Leads\Contracts\Services;

use Stackra\Leads\Enums\LeadStage;
use Stackra\Leads\Services\LeadStageTransitionValidator;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Container\Attributes\Scoped;

/**
 * Service contract — validates lead stage transitions against the
 * canonical state machine (blueprint `states.stage`).
 *
 * The machine, as designed:
 *
 *   NEW ─────────► CONTACTED ──────► QUALIFIED ──┐
 *                                                 ├─► TRIAL ─► WON  (terminal)
 *                                                 │
 *   any non-terminal ──────────────► LOST (terminal)
 *
 * Bound to the concrete via `#[Bind(LeadStageTransitionValidator::class)]`.
 * Consumers type-hint this interface; tests bind a fake through the
 * container.
 *
 * @category Leads
 *
 * @since    0.1.0
 */
#[Bind(LeadStageTransitionValidator::class)]
#[Scoped]
interface LeadStageTransitionValidatorInterface
{
    /**
     * Return `true` when `$from` → `$to` is permitted by the state
     * machine, `false` otherwise. Same-stage transitions
     * (`$from === $to`) always return `false` — every stage change is
     * a domain event.
     *
     * @param  LeadStage  $from  The current stage.
     * @param  LeadStage  $to    The desired next stage.
     */
    public function canTransition(LeadStage $from, LeadStage $to): bool;

    /**
     * Enforce a transition. Throws
     * {@see \Stackra\Leads\Exceptions\LeadInvalidStageTransitionException}
     * on any transition {@see canTransition()} refuses.
     *
     * @param  LeadStage  $from  The current stage.
     * @param  LeadStage  $to    The desired next stage.
     *
     * @throws \Stackra\Leads\Exceptions\LeadInvalidStageTransitionException  When the transition is refused.
     */
    public function assertTransition(LeadStage $from, LeadStage $to): void;

    /**
     * The set of stages reachable from `$from`. Empty when `$from` is
     * terminal ({@see LeadStage::Won} / {@see LeadStage::Lost}).
     *
     * @param  LeadStage  $from  The current stage.
     * @return list<LeadStage>   The permitted next stages.
     */
    public function nextStagesFrom(LeadStage $from): array;

    /**
     * `true` when `$stage` is terminal (won / lost). Terminal stages
     * cannot be transitioned out of.
     */
    public function isTerminal(LeadStage $stage): bool;
}
