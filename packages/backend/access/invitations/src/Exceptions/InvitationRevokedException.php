<?php

declare(strict_types=1);

namespace Stackra\Invitations\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when the caller presents a token that has already been
 * revoked.
 *
 * @category Invitations
 *
 * @since    0.1.0
 */
final class InvitationRevokedException extends StackraException
{
    public const string CODE = 'INVITATIONS_INVITATION_REVOKED';

    public const string TRANSLATION_KEY = 'invitations.errors.invitation_revoked';
}
