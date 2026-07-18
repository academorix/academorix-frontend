<?php

declare(strict_types=1);

namespace Academorix\Invitations\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when the caller presents a token that has already been
 * revoked.
 *
 * @category Invitations
 *
 * @since    0.1.0
 */
final class InvitationRevokedException extends AcademorixException
{
    public const string CODE = 'INVITATIONS_INVITATION_REVOKED';

    public const string TRANSLATION_KEY = 'invitations.errors.invitation_revoked';
}
