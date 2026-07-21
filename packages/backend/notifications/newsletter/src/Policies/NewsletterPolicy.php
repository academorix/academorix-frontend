<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Policies;

use Stackra\Newsletter\Contracts\Data\NewsletterInterface;
use Stackra\Newsletter\Enums\NewsletterPermission;
use Stackra\Newsletter\Enums\NewsletterStatus;
use Stackra\Newsletter\Models\Newsletter;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see Newsletter}.
 *
 * Every ability requires the caller's tenant to match the row's
 * tenant AND the caller to hold the corresponding permission. Cross-
 * tenant reads return `false`.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterPolicy
{
    /**
     * List newsletters within the caller's tenant.
     */
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(NewsletterPermission::NewslettersViewAny->value);
    }

    /**
     * Read a single newsletter.
     */
    public function view(Authenticatable $user, Newsletter $newsletter): bool
    {
        return $this->sameTenant($user, $newsletter)
            && $user->can(NewsletterPermission::NewslettersView->value);
    }

    /**
     * Create a new newsletter. Entitlement gating (quota) lives at
     * the action level; the policy only checks the permission grant.
     */
    public function create(Authenticatable $user): bool
    {
        return $user->can(NewsletterPermission::NewslettersCreate->value);
    }

    /**
     * Edit an existing newsletter.
     */
    public function update(Authenticatable $user, Newsletter $newsletter): bool
    {
        return $this->sameTenant($user, $newsletter)
            && $user->can(NewsletterPermission::NewslettersUpdate->value);
    }

    /**
     * Delete a newsletter. Refused when the newsletter still has
     * campaigns in `in_progress` state — the caller sees a
     * `state_invalid_transition` error emitted from the action.
     */
    public function delete(Authenticatable $user, Newsletter $newsletter): bool
    {
        return $this->sameTenant($user, $newsletter)
            && $user->can(NewsletterPermission::NewslettersDelete->value);
    }

    /**
     * Pause / resume / archive. Refused on already-archived rows.
     */
    public function manage(Authenticatable $user, Newsletter $newsletter): bool
    {
        if (! $this->sameTenant($user, $newsletter)) {
            return false;
        }

        $status = $newsletter->{NewsletterInterface::ATTR_STATUS};
        $isArchived = $status === NewsletterStatus::Archived
            || $status === NewsletterStatus::Archived->value;

        if ($isArchived) {
            return false;
        }

        return $user->can(NewsletterPermission::NewslettersManage->value);
    }

    /**
     * Cross-tenant guard on top of the `BelongsToTenant` global
     * scope — belt-and-braces defence.
     */
    private function sameTenant(Authenticatable $user, Newsletter $newsletter): bool
    {
        $rowTenantId = $newsletter->{NewsletterInterface::ATTR_TENANT_ID} ?? null;
        $userTenantId = $user->getAttribute('tenant_id');

        if ($rowTenantId === null || $userTenantId === null) {
            return false;
        }

        return (string) $rowTenantId === (string) $userTenantId;
    }
}
