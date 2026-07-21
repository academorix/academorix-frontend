<?php

declare(strict_types=1);

namespace Stackra\SportsCompetitionSdk\Payloads\Competitions;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/competitions` (or the
 * tenant-scoped equivalent).
 *
 * Every non-nullable property is auto-required by spatie/laravel-data;
 * every nullable defaults to `null`. Snake_case bridge in both
 * directions — the DTO's `toArray()` emits snake_case for the wire,
 * and Spatie validation kicks in during construction.
 *
 * @category CompetitionSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class CreateCompetitionPayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $seasonId
     * @param  string                       $sportKey
     * @param  string                       $name
     * @param  string                       $format                     round_robin / single_elimination / double_elimination / group_then_knockout.
     * @param  string                       $scoringStrategy            From sport registry — goals / points / sets / time / distance / apparatus / belt.
     * @param  string                       $status
     * @param  ?string                      $startsOn
     * @param  ?string                      $endsOn
     * @param  ?array                       $config                     Format-specific config: {points_win: 3, points_draw: 1, points_loss: 0, tiebreakers: [.
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $tenantId,

        #[StringType]
        public string $seasonId,

        #[StringType]
        public string $sportKey,

        #[StringType]
        public string $name,

        #[StringType]
        public string $format,

        #[StringType]
        public string $scoringStrategy,

        #[StringType]
        public string $status,

        #[StringType]
        public ?string $startsOn = null,

        #[StringType]
        public ?string $endsOn = null,

        public ?array $config = null,

        public ?array $metadata = null,
    ) {
    }
}
