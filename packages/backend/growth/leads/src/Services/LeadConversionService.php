<?php

declare(strict_types=1);

namespace Academorix\Leads\Services;

use Academorix\Leads\Contracts\Data\LeadActivityInterface;
use Academorix\Leads\Contracts\Data\LeadInterface;
use Academorix\Leads\Contracts\Repositories\LeadActivityRepositoryInterface;
use Academorix\Leads\Contracts\Services\LeadConversionServiceInterface;
use Academorix\Leads\Contracts\Services\LeadStageTransitionValidatorInterface;
use Academorix\Leads\Enums\LeadActivityType;
use Academorix\Leads\Enums\LeadStage;
use Academorix\Leads\Events\LeadConverted;
use Academorix\Leads\Exceptions\LeadConversionAthletesRequiredException;
use Academorix\Leads\Models\Lead;
use Illuminate\Container\Attributes\Auth;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Support\Facades\DB;

/**
 * Concrete implementation of {@see LeadConversionServiceInterface}.
 *
 * Orchestrates the lead → WON path:
 *
 *   1. Validate transition current → WON via the state machine.
 *   2. Ensure `athlete_names` is non-empty (blueprint invariant —
 *      cannot materialise athletes without their identities).
 *   3. Wrap the whole operation in a database transaction.
 *   4. Update the row (`stage = WON`, `converted_at = now()`) and
 *      write a `stage_change` LeadActivity row for the audit trail.
 *   5. Fire `LeadConverted` — the sports module's
 *      `MaterialiseAthletesOnLeadConverted` listener picks it up
 *      after commit and creates the athlete + guardian rows.
 *
 * Idempotency: if the lead is already WON with a stamped
 * `converted_at`, the service returns the row untouched.
 *
 * @category Leads
 *
 * @since    0.1.0
 */
#[Scoped]
final class LeadConversionService implements LeadConversionServiceInterface
{
    public function __construct(
        private readonly LeadActivityRepositoryInterface $activities,
        private readonly LeadStageTransitionValidatorInterface $transitions,
        private readonly Dispatcher $events,
        #[Auth('sanctum')] private readonly AuthFactory $auth,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function convert(Lead $lead): Lead
    {
        // Idempotency guard — already converted rows are a no-op.
        if ($lead->getAttribute(LeadInterface::ATTR_STAGE) === LeadStage::Won
            && $lead->getAttribute(LeadInterface::ATTR_CONVERTED_AT) !== null) {
            return $lead;
        }

        /** @var LeadStage $currentStage */
        $currentStage = $lead->getAttribute(LeadInterface::ATTR_STAGE);

        // Refuse when the state machine says WON is not reachable.
        $this->transitions->assertTransition($currentStage, LeadStage::Won);

        // Blueprint invariant — cannot materialise athletes without
        // their identities. Reject early with a translated error.
        $athleteNames = $lead->getAttribute(LeadInterface::ATTR_ATHLETE_NAMES) ?? [];

        if ($athleteNames === []) {
            throw (new LeadConversionAthletesRequiredException(
                'Cannot convert a lead without at least one athlete name.',
            ))->withContext([
                'lead_id' => (string) $lead->getKey(),
            ]);
        }

        $now = \now();

        // The whole conversion is one atomic write — stage flip +
        // activity row land together or not at all.
        DB::transaction(function () use ($lead, $currentStage, $now): void {
            $lead->forceFill([
                LeadInterface::ATTR_STAGE        => LeadStage::Won,
                LeadInterface::ATTR_CONVERTED_AT => $now,
            ])->save();

            $this->activities->create([
                LeadActivityInterface::ATTR_LEAD_ID     => (string) $lead->getKey(),
                LeadActivityInterface::ATTR_TYPE        => LeadActivityType::StageChange,
                LeadActivityInterface::ATTR_BODY        => \sprintf(
                    'Stage %s → %s (converted)',
                    $currentStage->value,
                    LeadStage::Won->value,
                ),
                LeadActivityInterface::ATTR_METADATA    => [
                    'from'  => $currentStage->value,
                    'to'    => LeadStage::Won->value,
                    'event' => 'conversion',
                ],
                LeadActivityInterface::ATTR_ACTOR_ID    => $this->currentActorId(),
                LeadActivityInterface::ATTR_OCCURRED_AT => $now,
            ]);
        });

        // Downstream materialisation — the sports listener creates
        // athletes + guardians after commit and writes back
        // converted_athlete_ids via its own event.
        $this->events->dispatch(new LeadConverted(
            leadId: (string) $lead->getKey(),
            tenantId: (string) $lead->getAttribute(LeadInterface::ATTR_TENANT_ID),
            ownerId: (string) ($lead->getAttribute(LeadInterface::ATTR_OWNER_ID) ?? ''),
            source: (string) $lead->getAttribute(LeadInterface::ATTR_SOURCE)?->value,
            convertedAthleteIds: '', // filled in by the sports listener.
            attributionSnapshot: (array) ($lead->getAttribute(LeadInterface::ATTR_ATTRIBUTION_SNAPSHOT) ?? []),
            estimatedLifetimeValueCents: (int) ($lead->getAttribute(LeadInterface::ATTR_ESTIMATED_LIFETIME_VALUE_CENTS) ?? 0),
            currency: (string) ($lead->getAttribute(LeadInterface::ATTR_CURRENCY) ?? ''),
            convertedAt: $now->toIso8601String(),
        ));

        return $lead->refresh();
    }

    /**
     * Resolve the current actor id (best-effort) — falls back to `null`
     * when the caller is anonymous (queue worker, system context).
     */
    private function currentActorId(): ?string
    {
        $user = $this->auth->guard('sanctum')->user();

        if ($user === null) {
            return null;
        }

        return (string) $user->getAuthIdentifier();
    }
}
