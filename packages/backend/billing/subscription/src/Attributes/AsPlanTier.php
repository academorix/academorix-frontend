<?php

declare(strict_types=1);

namespace Stackra\Subscription\Attributes;

use Stackra\Subscription\Enums\PlanTier;
use Attribute;

/**
 * Register a class as a plan-tier profile.
 *
 * The build-time compiler discovers `#[AsPlanTier]`-marked classes
 * via `Stackra\Foundation\Contracts\DiscoversAttributes` and
 * hands them to
 * {@see \Stackra\Subscription\Registry\PlanRegistry}, which
 * stores the label + rank + bundled features so tenant provisioning
 * + the pricing UI can consult a single source of truth.
 *
 * ```php
 * #[AsPlanTier(
 *     tier: PlanTier::Team,
 *     rank: 10,
 *     label: 'Team',
 *     features: ['branches', 'coaches', 'sessions'],
 * )]
 * final class TeamPlanProfile
 * {
 * }
 * ```
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsPlanTier
{
    /**
     * @param  PlanTier      $tier      Which tier the profile describes.
     * @param  int           $rank      Sort rank on the pricing UI (ascending).
     * @param  string        $label     Marketing label — English default.
     * @param  list<string>  $features  Feature keys bundled with this tier.
     */
    public function __construct(
        public PlanTier $tier,
        public int $rank,
        public string $label,
        public array $features = [],
    ) {
    }
}
