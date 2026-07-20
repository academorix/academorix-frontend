<?php

declare(strict_types=1);

namespace Academorix\Invitations\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when an invitation is presented after its `expires_at`.
 *
 * @category Invitations
 *
 * @since    0.1.0
 */
final class InvitationTokenExpiredException extends AcademorixException
{
    public const string CODE = 'INVITATIONS_TOKEN_EXPIRED';

    public const string TRANSLATION_KEY = 'invitations.errors.token_expired';
}
