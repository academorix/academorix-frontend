<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Observers;

use Stackra\Tenancy\Contracts\Data\TenantContactInterface;
use Stackra\Tenancy\Enums\TenantContactKind;
use Stackra\Tenancy\Events\TenantContactAdded;
use Stackra\Tenancy\Events\TenantContactRemoved;
use Stackra\Tenancy\Events\TenantContactUpdated;
use Stackra\Tenancy\Exceptions\TenantContactVerificationRequiredException;
use Stackra\Tenancy\Models\TenantContact;

/**
 * Lifecycle side effects on {@see TenantContact}.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
final class TenantContactObserver
{
    /**
     * `creating` — first contact per `(tenant_id, kind)` auto-marks primary.
     */
    public function creating(TenantContact $contact): void
    {
        // If caller did not set `is_primary`, first-of-kind → primary.
        if ($contact->{TenantContactInterface::ATTR_IS_PRIMARY} === null) {
            $exists = TenantContact::query()
                ->where(TenantContactInterface::ATTR_TENANT_ID, $contact->{TenantContactInterface::ATTR_TENANT_ID})
                ->where(TenantContactInterface::ATTR_KIND, $contact->{TenantContactInterface::ATTR_KIND})
                ->exists();

            $contact->{TenantContactInterface::ATTR_IS_PRIMARY} = ! $exists;
        }
    }

    /**
     * `saving` — verification requirement + primary-uniqueness cascade.
     */
    public function saving(TenantContact $contact): void
    {
        // DPO + Legal must be verified before promotion to primary
        // (GDPR + legal precedence — errors.json TENANCY_CONTACT_VERIFICATION_REQUIRED).
        $kindValue = $contact->{TenantContactInterface::ATTR_KIND};
        $kind      = $kindValue instanceof TenantContactKind
            ? $kindValue
            : TenantContactKind::tryFrom((string) $kindValue);

        $isPrimary  = (bool) $contact->{TenantContactInterface::ATTR_IS_PRIMARY};
        $isVerified = $contact->{TenantContactInterface::ATTR_VERIFIED_AT} !== null;

        if ($kind !== null && $isPrimary && ! $isVerified && $kind->requiresVerificationForPrimary()) {
            throw new TenantContactVerificationRequiredException(\sprintf(
                'A `%s` contact must be verified before being marked primary.',
                $kind->value,
            ));
        }
    }

    /**
     * `updating` — enforce single-primary-per-kind. When this row
     * transitions to primary, demote every other same-kind sibling.
     */
    public function updating(TenantContact $contact): void
    {
        $becomingPrimary = $contact->isDirty(TenantContactInterface::ATTR_IS_PRIMARY)
            && (bool) $contact->{TenantContactInterface::ATTR_IS_PRIMARY};

        if (! $becomingPrimary) {
            return;
        }

        TenantContact::query()
            ->where(TenantContactInterface::ATTR_TENANT_ID, $contact->{TenantContactInterface::ATTR_TENANT_ID})
            ->where(TenantContactInterface::ATTR_KIND, $contact->{TenantContactInterface::ATTR_KIND})
            ->where(TenantContactInterface::ATTR_ID, '!=', $contact->getKey())
            ->update([TenantContactInterface::ATTR_IS_PRIMARY => false]);
    }

    /**
     * `created` — emit `TenantContactAdded`.
     */
    public function created(TenantContact $contact): void
    {
        TenantContactAdded::dispatch($contact);
    }

    /**
     * `updated` — emit `TenantContactUpdated` with the dirty column list.
     */
    public function updated(TenantContact $contact): void
    {
        $dirty = \array_keys($contact->getChanges());
        if ($dirty === []) {
            return;
        }

        TenantContactUpdated::dispatch($contact, $dirty);
    }

    /**
     * `deleted` — emit `TenantContactRemoved` with the row's identifiers.
     */
    public function deleted(TenantContact $contact): void
    {
        TenantContactRemoved::dispatch(
            (string) $contact->{TenantContactInterface::ATTR_TENANT_ID},
            (string) $contact->getKey(),
            (string) ($contact->{TenantContactInterface::ATTR_KIND} instanceof TenantContactKind
                ? $contact->{TenantContactInterface::ATTR_KIND}->value
                : $contact->{TenantContactInterface::ATTR_KIND}),
        );
    }
}
