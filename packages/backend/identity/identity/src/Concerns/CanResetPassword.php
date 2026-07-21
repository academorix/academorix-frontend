<?php

declare(strict_types=1);

namespace Stackra\Identity\Concerns;

use Stackra\Identity\Contracts\Data\IdentityInterface;

/**
 * Password-reset contract for {@see \Stackra\Identity\Models\Identity}.
 *
 * Bridges Laravel's `Illuminate\Contracts\Auth\CanResetPassword`
 * shape to the Stackra column contract — the interface expects
 * `getEmailForPasswordReset()` + `sendPasswordResetNotification()`,
 * both of which read the `email` column via the interface constant.
 *
 * `sendPasswordResetNotification()` is intentionally a no-op here
 * — dispatch flows through `Auth::CreateForgotAction` which
 * queues the notification with the tenant's mail settings. The
 * trait keeps the framework contract satisfied without pulling in
 * a per-Identity notification stack.
 *
 * @category Identity
 *
 * @since    0.1.0
 */
trait CanResetPassword
{
    /**
     * Return the email address used for password-reset token issuance.
     *
     * Laravel calls this from the framework `PasswordBroker`. We
     * read via the interface constant so a column-rename in the
     * blueprint doesn't silently orphan the reset flow.
     */
    public function getEmailForPasswordReset(): string
    {
        return (string) $this->getAttribute(IdentityInterface::ATTR_EMAIL);
    }

    /**
     * Notifications are dispatched from the auth action, NOT from
     * the model. This method exists solely so the Laravel contract
     * is satisfied; calling it is a no-op.
     */
    public function sendPasswordResetNotification($token): void
    {
        // Intentional no-op — see class docblock.
    }
}
