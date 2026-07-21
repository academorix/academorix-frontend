<?php

declare(strict_types=1);

namespace Stackra\Invitations\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when an invitation is presented after its `expires_at`.
 *
 * @category Invitations
 *
 * @since    0.1.0
 */
final class InvitationTokenExpiredException extends StackraException
{
    public const string CODE = 'INVITATIONS_TOKEN_EXPIRED';

    public const string TRANSLATION_KEY = 'invitations.errors.token_expired';
}
