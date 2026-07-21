<?php

declare(strict_types=1);

namespace Stackra\Invitations\Exceptions;

use Stackra\Exceptions\AcademorixException;

/**
 * Raised when the caller presents a token that already accepted
 * or declined — idempotency guard for the accept flow.
 *
 * @category Invitations
 *
 * @since    0.1.0
 */
final class InvitationAlreadyUsedException extends AcademorixException
{
    public const string CODE = 'INVITATIONS_TOKEN_ALREADY_USED';

    public const string TRANSLATION_KEY = 'invitations.errors.token_already_used';
}
