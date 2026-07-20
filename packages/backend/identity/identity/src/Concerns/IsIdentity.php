<?php

declare(strict_types=1);

namespace Academorix\Identity\Concerns;

use Academorix\Identity\Contracts\Data\IdentityInterface;
use DateTimeInterface;

/**
 * Identity-lifecycle query helpers.
 *
 * Exposes readable, testable checks over the raw column state so
 * every consumer (login action, lockout policy, reset flow) can
 * ask the same questions the same way. Every method reads via
 * the interface constant.
 *
 * @category Identity
 *
 * @since    0.1.0
 */
trait IsIdentity
{
    /**
     * Return the identifier used for authentication (the email).
     *
     * Kept as a method rather than a raw property access so the
     * lookup is uniform between production code + tests + the
     * password broker.
     */
    public function getAuthIdentifierName(): string
    {
        return IdentityInterface::ATTR_EMAIL;
    }

    /**
     * Is the Identity currently locked out (locked_until > now)?
     *
     * The lockout policy toggles this via failed_attempts_count +
     * locked_until; the login action queries it before hashing to
     * short-circuit brute-force attempts.
     */
    public function isLockedOut(): bool
    {
        $lockedUntil = $this->getAttribute(IdentityInterface::ATTR_LOCKED_UNTIL);

        return $lockedUntil instanceof DateTimeInterface
            && $lockedUntil->getTimestamp() > time();
    }

    /**
     * Is the email address verified?
     *
     * Kept as a method rather than a `hasVerifiedEmail()` +
     * `email_verified_at` presence check so the exact rule is one
     * line to review.
     */
    public function hasVerifiedEmail(): bool
    {
        $verifiedAt = $this->getAttribute(IdentityInterface::ATTR_EMAIL_VERIFIED_AT);

        return $verifiedAt instanceof DateTimeInterface;
    }

    /**
     * Return the Identity's ULID as the "email" for Notifiable so
     * queued mail addresses the correct recipient without extra
     * plumbing.
     */
    public function routeNotificationForMail(): string
    {
        return (string) $this->getAttribute(IdentityInterface::ATTR_EMAIL);
    }
}
