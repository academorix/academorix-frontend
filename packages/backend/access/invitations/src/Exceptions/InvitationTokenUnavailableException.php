<?php

declare(strict_types=1);

namespace Stackra\Invitations\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised by `SendInvitationJob` when the queue-serialised
 * payload no longer holds the raw token — indicates queue
 * corruption or a leftover job from a rollback. Marks the
 * invitation `send_failed` and pages on-call.
 *
 * @category Invitations
 *
 * @since    0.1.0
 */
final class InvitationTokenUnavailableException extends Exception
{
    public const string CODE = 'INVITATIONS_TOKEN_UNAVAILABLE';

    public const string TRANSLATION_KEY = 'invitations.errors.token_unavailable';
}
