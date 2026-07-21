<?php

declare(strict_types=1);

namespace Stackra\IdentityPeopleSdk\Enums;

/**
 * Wire-visible backed enum for `person-guardian-link.relationship`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category PeopleSdk
 *
 * @since    0.1.0
 */
enum PersonGuardianLinkRelationship: string
{
    case Parent = 'parent';
    case StepParent = 'step_parent';
    case LegalGuardian = 'legal_guardian';
    case Grandparent = 'grandparent';
    case Other = 'other';
}
