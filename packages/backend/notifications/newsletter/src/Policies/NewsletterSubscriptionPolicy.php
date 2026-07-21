<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Policies;

use Stackra\Newsletter\Contracts\Data\NewsletterSubscriptionInterface;
use Stackra\Newsletter\Enums\NewsletterPermission;
use Stackra\Newsletter\Models\NewsletterSubscription;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see NewsletterSubscription}.
 *
 * The `update` policy grants only tag / metadata edits — the action
 * layer separately refuses to change `email` or `consent_evidence`
 * on any subscription (protecting the consent audit trail).
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterSubscriptionPolicy
{
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(NewsletterPermission::SubscriptionsViewAny->value);
    }

    public function view(Authenticatable $user, NewsletterSubscription $subscription): bool
    {
        return $this->sameTenant($user, $subscription)
            && $user->can(NewsletterPermission::SubscriptionsView->value);
    }

    public function create(Authenticatable $user): bool
    {
        return $user->can(NewsletterPermission::SubscriptionsCreate->value);
    }

    public function update(Authenticatable $user, NewsletterSubscription $subscription): bool
    {
        return $this->sameTenant($user, $subscription)
            && $user->can(NewsletterPermission::SubscriptionsUpdate->value);
    }

    public function delete(Authenticatable $user, NewsletterSubscription $subscription): bool
    {
        return $this->sameTenant($user, $subscription)
            && $user->can(NewsletterPermission::SubscriptionsDelete->value);
    }

    public function import(Authenticatable $user): bool
    {
        return $user->can(NewsletterPermission::SubscriptionsImport->value);
    }

    public function export(Authenticatable $user): bool
    {
        return $user->can(NewsletterPermission::SubscriptionsExport->value);
    }

    private function sameTenant(Authenticatable $user, NewsletterSubscription $subscription): bool
    {
        $rowTenantId = $subscription->{NewsletterSubscriptionInterface::ATTR_TENANT_ID} ?? null;
        $userTenantId = $user->getAttribute('tenant_id');

        if ($rowTenantId === null || $userTenantId === null) {
            return false;
        }

        return (string) $rowTenantId === (string) $userTenantId;
    }
}
