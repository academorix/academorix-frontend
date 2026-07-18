<?php

declare(strict_types=1);

namespace Academorix\Invitations\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when an update attempts to transition an invitation to a
 * state the state machine forbids (e.g. `accepted` → `pending`,
 * or revoke after accept).
 *
 * @category Invitations
 *
 * @since    0.1.0
 */
final class InvitationStateTransitionForbiddenException extends AcademorixException
{
    public const string CODE = 'INVITATIONS_STATE_TRANSITION_FORBIDDEN';

    public const string TRANSLATION_KEY = 'invitations.errors.state_transition_forbidden';
}
