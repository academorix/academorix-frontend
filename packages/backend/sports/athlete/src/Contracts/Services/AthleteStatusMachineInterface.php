<?php

declare(strict_types=1);

namespace Academorix\Athlete\Contracts\Services;

use Academorix\Athlete\Enums\AthleteStatus;
use Academorix\Athlete\Models\Athlete;
use Academorix\Athlete\Services\AthleteStatusMachine;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for athlete-status transition validation + application.
 *
 * The AthleteStatus enum has five states: `Active`, `Paused`,
 * `Graduated`, `Withdrawn`, `Archived`. Not every state transition
 * is legal — for example, `Archived` is terminal and `Withdrawn`
 * cannot become `Active` again (a re-enrollment creates a fresh row
 * per the blueprint's data model).
 *
 * The state machine centralises the "may I transition?" logic so
 * every lifecycle Action reads from the same table. It also
 * applies the transition — setting the target columns
 * (`withdrawn_at`, `withdrawn_by_user_id`, `withdrawal_reason`,
 * `graduated_at`, `paused_at`, `paused_reason`) atomically.
 *
 * @category Athlete
 *
 * @since    0.1.0
 */
#[Bind(AthleteStatusMachine::class)]
interface AthleteStatusMachineInterface
{
    /**
     * True when `$athlete` may transition from its current status to
     * `$target`. Reads only — no side effects.
     */
    public function canTransitionTo(Athlete $athlete, AthleteStatus $target): bool;

    /**
     * Apply the transition — persists the target status + the derived
     * lifecycle columns (`withdrawn_at`, `paused_at`, ...).
     *
     * @param  array<string, mixed>  $context  Optional per-transition
     *                                         payload — carries reasons /
     *                                         actor id / notes.
     *
     * @throws \Academorix\Athlete\Exceptions\AthleteStatusTransitionInvalidException
     *         When the source→target pair is not allowed.
     * @throws \Academorix\Athlete\Exceptions\AthleteWithdrawalReasonRequiredException
     *         When transitioning to Withdrawn without a reason.
     * @throws \Academorix\Athlete\Exceptions\AthletePauseReasonRequiredException
     *         When transitioning to Paused without a reason.
     */
    public function transition(Athlete $athlete, AthleteStatus $target, array $context = []): Athlete;

    /**
     * Return the set of statuses reachable from the athlete's current status.
     *
     * @return list<AthleteStatus>
     */
    public function reachableStatuses(Athlete $athlete): array;
}
