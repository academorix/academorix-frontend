<?php

declare(strict_types=1);

namespace Stackra\Invitations\Exceptions;

use Stackra\Exceptions\AcademorixException;

/**
 * Raised when the caller supplies a `target_type` string that no
 * consumer module has registered with
 * `InvitationTargetRegistryInterface`. Almost always a symptom
 * of a boot-ordering bug in the consumer's service provider.
 *
 * @category Invitations
 *
 * @since    0.1.0
 */
final class InvitationTargetNotRegisteredException extends AcademorixException
{
    public const string CODE = 'INVITATIONS_TARGET_NOT_REGISTERED';

    public const string TRANSLATION_KEY = 'invitations.errors.target_not_registered';
}
