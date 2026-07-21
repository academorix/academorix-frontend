<?php

declare(strict_types=1);

namespace Stackra\Invitations\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when a token-based invitation lookup finds no matching
 * row.
 *
 * @category Invitations
 *
 * @since    0.1.0
 */
final class InvitationNotFoundException extends Exception
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const string CODE = 'INVITATIONS_TOKEN_NOT_FOUND';

    /**
     * Translation key for the humanised message.
     */
    public const string TRANSLATION_KEY = 'invitations.errors.token_not_found';
}
