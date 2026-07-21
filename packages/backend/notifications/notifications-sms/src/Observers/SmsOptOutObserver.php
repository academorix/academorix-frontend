<?php

declare(strict_types=1);

namespace Stackra\Notifications\Sms\Observers;

use Stackra\Notifications\Sms\Contracts\Data\SmsOptOutInterface;
use Stackra\Notifications\Sms\Enums\SmsOptOutReason;
use Stackra\Notifications\Sms\Events\SmsOptedOut;
use Stackra\Notifications\Sms\Events\SmsOptOutRevoked;
use Stackra\Notifications\Sms\Models\SmsOptOut;
use Illuminate\Container\Attributes\Auth;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use RuntimeException;

/**
 * Observer for {@see SmsOptOut}.
 *
 * Owns the country-code derivation on `creating`, the STOP-keyword revoke
 * guard on `deleting`, and the event fan-out for the lifecycle transitions.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
final class SmsOptOutObserver
{
    public function __construct(
        #[Auth] private readonly AuthFactory $auth,
    ) {
    }

    /**
     * `creating` — derive country code from the E.164 prefix.
     */
    public function creating(SmsOptOut $optOut): void
    {
        // If the caller didn't provide a country code, derive from the phone
        // prefix — the leading digits after `+` map to a country. This is
        // deliberately approximate; a full libphonenumber lookup lives on the
        // consumer app when precise mapping is needed.
        if ($optOut->getAttribute(SmsOptOutInterface::ATTR_PHONE_COUNTRY_CODE) === null) {
            $phone = (string) $optOut->getAttribute(SmsOptOutInterface::ATTR_PHONE);
            $optOut->setAttribute(
                SmsOptOutInterface::ATTR_PHONE_COUNTRY_CODE,
                $this->deriveCountryCode($phone),
            );
        }

        // Auto-fill opted_out_at on first create so downstream consumers
        // never see a NULL there.
        if ($optOut->getAttribute(SmsOptOutInterface::ATTR_OPTED_OUT_AT) === null) {
            $optOut->setAttribute(SmsOptOutInterface::ATTR_OPTED_OUT_AT, now());
        }
    }

    /**
     * `created` — announce the fresh opt-out.
     */
    public function created(SmsOptOut $optOut): void
    {
        event(new SmsOptedOut($optOut));
    }

    /**
     * `deleting` — refuse STOP-keyword revokes unless a super_admin flag +
     * re-consent evidence sit in the model's metadata.
     */
    public function deleting(SmsOptOut $optOut): void
    {
        $reason = $optOut->getAttribute(SmsOptOutInterface::ATTR_REASON);
        $reasonValue = $reason instanceof SmsOptOutReason ? $reason : SmsOptOutReason::tryFrom((string) $reason);

        if ($reasonValue !== SmsOptOutReason::StopKeyword) {
            return;
        }

        // The metadata JSONB carries the re-consent evidence flag that the
        // caller injects when running the revoke command as super_admin.
        $metadata = (array) $optOut->getAttribute(SmsOptOutInterface::ATTR_METADATA);
        if (($metadata['re_consent_evidence'] ?? null) !== true) {
            throw new RuntimeException(
                'Cannot revoke a stop_keyword opt-out without re_consent_evidence set in metadata.',
            );
        }

        // System rows require super_admin regardless of reason.
        if ((bool) $optOut->getAttribute(SmsOptOutInterface::ATTR_IS_SYSTEM) === true
            && ($metadata['super_admin_override'] ?? null) !== true
        ) {
            throw new RuntimeException(
                'Cannot revoke a system opt-out without super_admin_override in metadata.',
            );
        }
    }

    /**
     * `deleted` — announce the revoke.
     */
    public function deleted(SmsOptOut $optOut): void
    {
        $revokedByUserId = null;
        $user = $this->auth->guard()->user();
        if ($user !== null && \method_exists($user, 'getKey')) {
            $revokedByUserId = (string) $user->getKey();
        }

        event(new SmsOptOutRevoked($optOut, $revokedByUserId));
    }

    /**
     * Extract the country code from an E.164 number. Currently only handles
     * a handful of common prefixes — consumer apps override the observer
     * when precise ISO-3166 mapping matters.
     */
    private function deriveCountryCode(string $phone): string
    {
        if (\str_starts_with($phone, '+1')) {
            return 'US';
        }
        if (\str_starts_with($phone, '+44')) {
            return 'GB';
        }
        if (\str_starts_with($phone, '+33')) {
            return 'FR';
        }
        if (\str_starts_with($phone, '+49')) {
            return 'DE';
        }
        if (\str_starts_with($phone, '+34')) {
            return 'ES';
        }
        if (\str_starts_with($phone, '+61')) {
            return 'AU';
        }

        return 'ZZ';
    }
}
