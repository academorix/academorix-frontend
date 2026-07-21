<?php

declare(strict_types=1);

namespace Academorix\PlatformApplicationSdk\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Wire-visible enum mirroring the closed set of BusinessType keys the
 * Platform service supports.
 *
 * The `applications.default_business_type` schema constrains its
 * `enum` to exactly this set, and the `business_types` catalogue's
 * `key` field carries the same tokens. Ship them here so callers can
 * type-check the identifier at compile time and hydrate the full
 * catalogue record from
 * {@see \Academorix\PlatformApplicationSdk\Data\BusinessTypeData} at
 * runtime.
 *
 * ## Cases
 *
 *   * {@see self::Academy}      — education-first sports academy.
 *   * {@see self::SportsCenter} — multi-discipline sports center.
 *   * {@see self::School}       — traditional school running PE.
 *   * {@see self::Gym}          — gym / fitness center.
 *   * {@see self::Federation}   — regional / national federation.
 *   * {@see self::Club}         — membership-driven club.
 *
 * ## Coordinated change contract
 *
 * Adding, renaming, or removing a case here is a coordinated schema
 * change: bump the schema's `default_business_type.enum` array + this
 * file + a matching config seeder entry in the same PR, then bump
 * every consumer's composer lock. Values here MUST match the strings
 * on the wire — never derive them from labels.
 *
 * @category PlatformApplicationSdk
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum BusinessTypeKey: string
{
    use Enum;

    /**
     * Education-first sports academy running structured curricula and
     * development pathways.
     */
    #[Label('Academy')]
    #[Description('Education-first sports academy running structured curricula and development pathways.')]
    case Academy = 'academy';

    /**
     * Multi-discipline sports center running athletes, teams, and
     * medical staff under one roof.
     */
    #[Label('Sports Center')]
    #[Description('Multi-discipline sports center running athletes, teams, and medical staff under one roof.')]
    case SportsCenter = 'sports_center';

    /**
     * Traditional school running a sports or PE program alongside
     * academic classes.
     */
    #[Label('School')]
    #[Description('Traditional school running a sports or PE program alongside academic classes.')]
    case School = 'school';

    /**
     * Gym or fitness center with members, class scheduling, and
     * personal training.
     */
    #[Label('Gym')]
    #[Description('Gym or fitness center with members, class scheduling, and personal training.')]
    case Gym = 'gym';

    /**
     * Regional or national federation coordinating clubs, ranking
     * systems, and tournaments.
     */
    #[Label('Federation')]
    #[Description('Regional or national federation coordinating clubs, ranking systems, and tournaments.')]
    case Federation = 'federation';

    /**
     * Membership-driven club managing member rolls, progress
     * tracking, and social events.
     */
    #[Label('Club')]
    #[Description('Membership-driven club managing member rolls, progress tracking, and social events.')]
    case Club = 'club';
}
