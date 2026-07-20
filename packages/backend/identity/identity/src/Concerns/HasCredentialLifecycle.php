<?php

declare(strict_types=1);

namespace Academorix\Identity\Concerns;

use Academorix\Identity\Contracts\Data\IdentityInterface;

/**
 * Credential-lifecycle helpers for {@see \Academorix\Identity\Models\Identity}.
 *
 * Encapsulates the failed-attempts counter + lockout window
 * transitions so consumers (login action, AccountLockoutPolicy)
 * don't reach for raw column names.
 *
 * @category Identity
 *
 * @since    0.1.0
 */
trait HasCredentialLifecycle
{
    /**
     * Record a successful authentication. Clears the failure
     * counter + lockout timestamp; stamps `last_login_at`.
     */
    public function recordSuccessfulLogin(): void
    {
        $this->forceFill([
            IdentityInterface::ATTR_LAST_LOGIN_AT => now(),
            IdentityInterface::ATTR_FAILED_ATTEMPTS_COUNT => 0,
            IdentityInterface::ATTR_LOCKED_UNTIL => null,
        ])->save();
    }

    /**
     * Record a failed authentication. Increments the failure
     * counter; the caller decides whether to escalate to a
     * lockout via {@see lockUntil}.
     */
    public function recordFailedLogin(): void
    {
        $current = (int) ($this->getAttribute(IdentityInterface::ATTR_FAILED_ATTEMPTS_COUNT) ?? 0);
        $this->forceFill([
            IdentityInterface::ATTR_LAST_FAILED_AT => now(),
            IdentityInterface::ATTR_FAILED_ATTEMPTS_COUNT => $current + 1,
        ])->save();
    }

    /**
     * Impose a lockout window. Sets `locked_until` to the given
     * timestamp; leaves the failure counter as-is so the auditor
     * can still see how many attempts triggered it.
     */
    public function lockUntil(\DateTimeInterface $until): void
    {
        $this->forceFill([
            IdentityInterface::ATTR_LOCKED_UNTIL => $until,
        ])->save();
    }
}
