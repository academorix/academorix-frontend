<?php

declare(strict_types=1);

namespace Stackra\Invitations\Attributes;

use Attribute;

/**
 * Marks an Eloquent model as an invitable target.
 *
 * The build-time compiler discovers `#[Invitable]`-marked classes
 * via `Stackra\Foundation\Contracts\DiscoversAttributes` and
 * hands them to
 * {@see \Stackra\Invitations\Services\DefaultInvitationTargetRegistry}
 * so downstream consumers can send invitations against them without
 * this module ever name-dropping the concrete class.
 *
 * ```php
 * #[Invitable(
 *     key: 'team',
 *     acceptHandler: TeamInvitationAcceptHandler::class,
 * )]
 * final class Team extends Model
 * {
 *     use HasInvitations;
 * }
 * ```
 *
 * @category Invitations
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class Invitable
{
    /**
     * @param  string        $key            Morph-map key (`tenant`, `team`, `athlete`, ...).
     * @param  class-string|null  $acceptHandler  Optional accept-handler class.
     * @param  bool          $enabled        Feature-flag toggle — `false` skips registration.
     */
    public function __construct(
        public string $key,
        public ?string $acceptHandler = null,
        public bool $enabled = true,
    ) {
    }
}
