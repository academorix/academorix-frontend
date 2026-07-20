<?php

declare(strict_types=1);

namespace Academorix\ServiceAccounts\Concerns;

use Academorix\ServiceAccounts\Contracts\Data\ServiceAccountInterface;
use Academorix\ServiceAccounts\Enums\ServiceAccountStatus;
use DateTimeInterface;

/**
 * Compositional trait for the `ServiceAccount` model.
 *
 * Exposes helpers the surrounding services + observer expect —
 * lifecycle queries (`isEnabled`, `isExpired`, `isDormant`) and
 * status materialisation (`resolveStatus`) — WITHOUT bleeding
 * business logic into the model itself. Every method reads column
 * values through the interface constant so no raw string literals
 * leak.
 *
 * The trait is composed onto `ServiceAccount` only. It carries no
 * relations; those stay on the model class per
 * `.kiro/steering/models.md` §5 (one file per model, traits are
 * reusable capabilities).
 *
 * @category ServiceAccounts
 *
 * @since    0.1.0
 */
trait IsServiceAccount
{
    /**
     * Is the service account enabled and not past its expiry?
     *
     * The enabled bit + expires_at horizon are the two independent
     * signals; `active` requires both.
     */
    public function isActive(): bool
    {
        if ((bool) $this->getAttribute(ServiceAccountInterface::ATTR_IS_ENABLED) === false) {
            return false;
        }

        $expiresAt = $this->getAttribute(ServiceAccountInterface::ATTR_EXPIRES_AT);
        if ($expiresAt instanceof DateTimeInterface && $expiresAt->getTimestamp() <= time()) {
            return false;
        }

        return true;
    }

    /**
     * Has the SA's secret expired (past `expires_at`)?
     *
     * Distinct from `!isActive()` — disabled != expired. An admin
     * can flip `is_enabled = false` on a fresh SA whose secret
     * hasn't yet expired.
     */
    public function isExpired(): bool
    {
        $expiresAt = $this->getAttribute(ServiceAccountInterface::ATTR_EXPIRES_AT);

        return $expiresAt instanceof DateTimeInterface
            && $expiresAt->getTimestamp() <= time();
    }

    /**
     * Has the SA gone unused for longer than `$dormantAfterDays` days?
     *
     * @param  int  $dormantAfterDays  Threshold in days; default is
     *   the DormantAccountDetector's 30-day floor.
     */
    public function isDormant(int $dormantAfterDays = 30): bool
    {
        $lastUsedAt = $this->getAttribute(ServiceAccountInterface::ATTR_LAST_USED_AT);
        if (! $lastUsedAt instanceof DateTimeInterface) {
            // Never-used SAs count as dormant once past the window.
            $createdAt = $this->getAttribute(ServiceAccountInterface::ATTR_CREATED_AT);
            if (! $createdAt instanceof DateTimeInterface) {
                return false;
            }

            return $createdAt->getTimestamp() + ($dormantAfterDays * 86400) <= time();
        }

        return $lastUsedAt->getTimestamp() + ($dormantAfterDays * 86400) <= time();
    }

    /**
     * Materialise the current status derived from the flags +
     * timestamps. Mirrors the `service_accounts.status` column but
     * doesn't depend on it — so callers can trust the value even
     * when the column has drifted (e.g. mid-migration).
     */
    public function resolveStatus(): ServiceAccountStatus
    {
        if ($this->isExpired()) {
            return ServiceAccountStatus::Expired;
        }

        if ((bool) $this->getAttribute(ServiceAccountInterface::ATTR_IS_ENABLED) === false) {
            return ServiceAccountStatus::Disabled;
        }

        $lastUsedAt = $this->getAttribute(ServiceAccountInterface::ATTR_LAST_USED_AT);
        if (! $lastUsedAt instanceof DateTimeInterface) {
            return ServiceAccountStatus::Pending;
        }

        return ServiceAccountStatus::Active;
    }
}
