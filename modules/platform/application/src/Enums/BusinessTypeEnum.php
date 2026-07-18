<?php

declare(strict_types=1);

namespace Academorix\Application\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Business types recognised by the platform.
 *
 * Code branches on this enum for persona catalogues, default feature
 * sets, terminology overrides, and seeded role sets. Tenant-defined
 * custom business types fall into the {@see self::Custom} bucket at
 * the code level (never persisted as `Custom` — persisted with
 * `is_system = false` and a slug outside the enum case set).
 *
 * The `business_types` table mirrors every case except `Custom` on
 * every deploy via `BusinessTypeSeeder` (`#[AsSeeder(priority: 20)]`).
 * `Custom` is code-only per the dual-source pattern in
 * `.kiro/steering/enum-db-seed-dual-source.md` §Non-negotiable rules.
 *
 * ## Cases
 *
 *  * {@see self::SportsCenter}, {@see self::Club}, {@see self::Academy},
 *    {@see self::School}, {@see self::Gym}, {@see self::Federation} —
 *    the six shipped sports variants; unlock the coach/athlete/parent/
 *    medical role catalogue by default.
 *  * {@see self::Other} — first-class system row for "known business,
 *    outside our taxonomy". Persisted in `business_types` with
 *    `is_system = true`. Ships the minimum default config (coach/
 *    athlete/parent roles).
 *  * {@see self::Custom} — code-level bucket for tenant-created rows.
 *    Never persisted. Resolution: `BusinessTypeEnum::tryFrom($slug)
 *    ?? BusinessTypeEnum::Custom`.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum BusinessTypeEnum: string
{
    use Enum;

    /**
     * Sports Center — multi-discipline facility with coaches, athletes, and physical venues.
     */
    #[Label('Sports Center')]
    #[Description('Multi-discipline sports facility with coaches, athletes, and physical venues.')]
    case SportsCenter = 'sports_center';

    /**
     * Club — membership-based sports club with recurring dues + competitive teams.
     */
    #[Label('Club')]
    #[Description('Membership-based sports club with recurring dues + competitive teams.')]
    case Club = 'club';

    /**
     * Academy — training academy running structured programmes, curricula, and grading.
     */
    #[Label('Academy')]
    #[Description('Training academy running structured programmes, curricula, and grading.')]
    case Academy = 'academy';

    /**
     * School — educational institution running sports as part of a formal curriculum.
     */
    #[Label('School')]
    #[Description('Educational institution running sports as part of a formal curriculum.')]
    case School = 'school';

    /**
     * Gym — pay-as-you-go fitness facility with day passes + memberships.
     */
    #[Label('Gym')]
    #[Description('Pay-as-you-go fitness facility with day passes + memberships.')]
    case Gym = 'gym';

    /**
     * Federation — governing body coordinating clubs, competitions, and rankings across a sport or region.
     */
    #[Label('Federation')]
    #[Description('Governing body coordinating clubs, competitions, and rankings across a sport or region.')]
    case Federation = 'federation';

    /**
     * Other — first-class system row for known businesses outside the taxonomy.
     */
    #[Label('Other')]
    #[Description('Known business, outside our taxonomy. Uses the minimum default config.')]
    case Other = 'other';

    /**
     * Catch-all bucket for tenant-created rows. Never seeded; never
     * persisted. Reached via `BusinessTypeEnum::tryFrom($slug) ?? Custom`.
     */
    #[Label('Custom')]
    #[Description('Tenant-defined business type outside the shipped taxonomy.')]
    case Custom = 'custom';

    /**
     * Default persona role slugs unlocked by this business type.
     * Consumed by the tenancy module's provisioning listener that
     * seeds roles + permissions on tenant creation.
     *
     * @return list<string>
     */
    public function defaultRoles(): array
    {
        return match ($this) {
            self::SportsCenter,
            self::Club,
            self::Academy,
            self::School,
            self::Gym,
            self::Federation => ['owner', 'admin', 'coach', 'athlete', 'parent', 'medical'],

            self::Other,
            self::Custom => ['owner', 'admin', 'coach', 'athlete', 'parent'],
        };
    }

    /**
     * Default feature-flag keys enabled at tenant provisioning.
     * Consumed by the `feature-flag` module.
     *
     * @return list<string>
     */
    public function defaultFeatures(): array
    {
        return match ($this) {
            self::SportsCenter,
            self::Club,
            self::Academy => [
                'athletes', 'teams', 'attendance', 'scheduling', 'progress', 'competition',
            ],

            self::School => [
                'athletes', 'teams', 'attendance', 'scheduling', 'progress',
            ],

            self::Gym => [
                'members', 'attendance', 'scheduling',
            ],

            self::Federation => [
                'competition', 'teams', 'rankings',
            ],

            self::Other,
            self::Custom => [
                'athletes', 'attendance',
            ],
        };
    }

    /**
     * Resource-label overrides applied by the tenant's `terminology`
     * bootstrap map. The FE substitutes these labels per Application
     * / Tenant on every resource render.
     *
     * @return array<string, string>
     */
    public function defaultTerminology(): array
    {
        return match ($this) {
            self::School   => ['athletes' => 'Students'],
            self::Gym      => ['athletes' => 'Members'],
            self::Federation => ['athletes' => 'Athletes', 'teams' => 'Clubs'],
            default        => [],
        };
    }

    /**
     * Iconify token — used by the FE self-serve picker widget.
     * Override in `config('application.business_types.icon_overrides')`
     * per deployment.
     */
    public function iconToken(): string
    {
        return match ($this) {
            self::SportsCenter => 'game-icons:soccer-ball',
            self::Club         => 'mdi:trophy',
            self::Academy      => 'mdi:academic-cap',
            self::School       => 'mdi:school',
            self::Gym          => 'mdi:dumbbell',
            self::Federation   => 'mdi:flag-triangle',
            self::Other        => 'mdi:office-building',
            self::Custom       => 'mdi:tag-outline',
        };
    }

    /**
     * Resolution pattern — `BusinessTypeEnum::tryFrom($slug) ?? Custom`
     * expressed as a static helper to keep call sites consistent.
     *
     * @param  string|null  $slug  Raw slug value (from column, config, request).
     * @return self          The resolved enum case; `Custom` when no case matches.
     */
    public static function resolve(?string $slug): self
    {
        if ($slug === null || $slug === '') {
            return self::Custom;
        }

        return self::tryFrom($slug) ?? self::Custom;
    }
}
