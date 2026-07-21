<?php

declare(strict_types=1);

namespace Stackra\Registrations\Data;

use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Result of a capacity computation.
 *
 * Emitted by
 * {@see \Stackra\Registrations\Services\CapacityResolver::statusFor}
 * and consumed by RegistrationOrchestrator (routes new registrations
 * to enrolled path vs waitlist path) + AutoOfferer (decides when to
 * fire the next offer when a seat frees up).
 *
 * @category Registrations
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class CapacityStatusData extends Data
{
    /**
     * @param  string       $seasonId       Bound Season id.
     * @param  string|null  $teamId         Bound Team id — null for season-wide capacity.
     * @param  int          $capacity       Total slots authored on the season/team.
     * @param  int          $enrolled       Currently-enrolled registrations.
     * @param  int          $pendingOffer   Registrations with a live outstanding offer.
     * @param  int          $free           `capacity - enrolled - pendingOffer`, clamped to >= 0.
     * @param  bool         $hasFreeSlots   Convenience — `free > 0`.
     */
    public function __construct(
        public string $seasonId,
        public ?string $teamId,
        public int $capacity,
        public int $enrolled,
        public int $pendingOffer,
        public int $free,
        public bool $hasFreeSlots,
    ) {
    }
}
