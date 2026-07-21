<?php

declare(strict_types=1);

namespace Stackra\Athlete\Services;

use Stackra\Athlete\Contracts\Data\AthleteInterface;
use Stackra\Athlete\Contracts\Repositories\AthleteRepositoryInterface;
use Stackra\Athlete\Contracts\Services\AthleteStatusMachineInterface;
use Stackra\Athlete\Enums\AthleteStatus;
use Stackra\Athlete\Exceptions\AthletePauseReasonRequiredException;
use Stackra\Athlete\Exceptions\AthleteStatusTransitionInvalidException;
use Stackra\Athlete\Exceptions\AthleteWithdrawalReasonRequiredException;
use Stackra\Athlete\Models\Athlete;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Support\Facades\DB;

/**
 * Athlete state-machine — validates + applies status transitions.
 *
 * ## Allowed transitions
 *
 * ```
 *   Active    → Paused, Graduated, Withdrawn, Archived
 *   Paused    → Active, Withdrawn, Archived
 *   Graduated → Archived
 *   Withdrawn → Archived
 *   Archived  → (terminal — no exit)
 * ```
 *
 * Rationale:
 *
 * - **Withdrawn is terminal-adjacent** — re-enrolling a withdrawn
 *   athlete creates a fresh row (soft-terminal from a domain
 *   perspective; the row stays for compliance).
 * - **Archived is fully terminal** — every athlete winds up here
 *   after their lifecycle exits. The row's soft-delete guard fires
 *   from here.
 * - **Graduated is soft-terminal** — kept for alumni relations,
 *   never transitions back to active.
 *
 * `#[Scoped]` — reads current tenant scope through the repo.
 *
 * @category Athlete
 *
 * @since    0.1.0
 */
#[Scoped]
final class AthleteStatusMachine implements AthleteStatusMachineInterface
{
    /**
     * Transition table — source → allowed targets.
     *
     * @var array<string, list<AthleteStatus>>
     */
    private const array TRANSITIONS = [
        'active' => [
            'paused', 'graduated', 'withdrawn', 'archived',
        ],
        'paused' => [
            'active', 'withdrawn', 'archived',
        ],
        'graduated' => [
            'archived',
        ],
        'withdrawn' => [
            'archived',
        ],
        'archived' => [
            // terminal — no exit
        ],
    ];

    /**
     * @param  AthleteRepositoryInterface  $athletes  Persistence boundary.
     */
    public function __construct(
        private readonly AthleteRepositoryInterface $athletes,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function canTransitionTo(Athlete $athlete, AthleteStatus $target): bool
    {
        $current = $this->currentStatus($athlete);
        if ($current === $target) {
            // Idempotent no-op — the machine accepts a transition to the
            // current state as a valid but no-op operation.
            return true;
        }

        $allowed = self::TRANSITIONS[$current->value] ?? [];

        foreach ($allowed as $allowedValue) {
            if ($target->value === $allowedValue) {
                return true;
            }
        }

        return false;
    }

    /**
     * {@inheritDoc}
     */
    public function transition(Athlete $athlete, AthleteStatus $target, array $context = []): Athlete
    {
        $current = $this->currentStatus($athlete);

        if (! $this->canTransitionTo($athlete, $target)) {
            throw new AthleteStatusTransitionInvalidException(\sprintf(
                'Athlete %s cannot transition from %s to %s.',
                (string) $athlete->getKey(),
                $current->value,
                $target->value,
            ));
        }

        // Same state, same row — nothing to do.
        if ($current === $target) {
            return $athlete;
        }

        return DB::transaction(function () use ($athlete, $target, $context): Athlete {
            $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
            $attributes = [AthleteInterface::ATTR_STATUS => $target->value];

            // Apply per-target derived columns.
            switch ($target) {
                case AthleteStatus::Withdrawn:
                    if (! isset($context['reason']) || $context['reason'] === '' || $context['reason'] === null) {
                        throw new AthleteWithdrawalReasonRequiredException(
                            'Cannot withdraw an athlete without a reason. Provide one of AthleteWithdrawalReason::cases().'
                        );
                    }
                    $attributes[AthleteInterface::ATTR_WITHDRAWAL_REASON] = (string) $context['reason'];
                    $attributes[AthleteInterface::ATTR_WITHDRAWN_AT] = $now;
                    $attributes[AthleteInterface::ATTR_WITHDRAWN_BY_USER_ID] = (string) ($context['by_user_id'] ?? '');
                    break;

                case AthleteStatus::Paused:
                    if (! isset($context['reason']) || $context['reason'] === '' || $context['reason'] === null) {
                        throw new AthletePauseReasonRequiredException(
                            'Cannot pause an athlete without a reason.'
                        );
                    }
                    $attributes[AthleteInterface::ATTR_PAUSED_REASON] = (string) $context['reason'];
                    $attributes[AthleteInterface::ATTR_PAUSED_AT] = $now;
                    break;

                case AthleteStatus::Active:
                    // Coming back from a Paused state — clear the pause marker.
                    $attributes[AthleteInterface::ATTR_PAUSED_REASON] = null;
                    $attributes[AthleteInterface::ATTR_PAUSED_AT] = null;
                    break;

                case AthleteStatus::Graduated:
                    $attributes[AthleteInterface::ATTR_GRADUATED_AT] = $now;
                    break;

                case AthleteStatus::Archived:
                    // Archive marker is the status itself. No column derivation.
                    break;
            }

            /** @var Athlete $updated */
            $updated = $this->athletes->update((string) $athlete->getKey(), $attributes);

            return $updated;
        });
    }

    /**
     * {@inheritDoc}
     */
    public function reachableStatuses(Athlete $athlete): array
    {
        $current = $this->currentStatus($athlete);
        $allowed = self::TRANSITIONS[$current->value] ?? [];

        return \array_map(
            static fn (string $value): AthleteStatus => AthleteStatus::from($value),
            $allowed,
        );
    }

    /**
     * Read the athlete's current status, coercing string columns to enum values.
     */
    private function currentStatus(Athlete $athlete): AthleteStatus
    {
        $raw = $athlete->getAttribute(AthleteInterface::ATTR_STATUS);
        if ($raw instanceof AthleteStatus) {
            return $raw;
        }

        return AthleteStatus::from((string) $raw);
    }
}
