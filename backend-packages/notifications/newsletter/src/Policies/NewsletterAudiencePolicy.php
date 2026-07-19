<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Policies;

use Academorix\Newsletter\Contracts\Data\NewsletterAudienceInterface;
use Academorix\Newsletter\Enums\NewsletterPermission;
use Academorix\Newsletter\Models\NewsletterAudience;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see NewsletterAudience}.
 *
 * The default audience (`is_default = true`) cannot be deleted or
 * renamed via the update flow — enforced by the `delete` ability
 * and the update action's request validation, respectively.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterAudiencePolicy
{
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(NewsletterPermission::AudiencesViewAny->value);
    }

    public function view(Authenticatable $user, NewsletterAudience $audience): bool
    {
        return $this->sameTenant($user, $audience)
            && $user->can(NewsletterPermission::AudiencesView->value);
    }

    public function create(Authenticatable $user): bool
    {
        return $user->can(NewsletterPermission::AudiencesCreate->value);
    }

    public function update(Authenticatable $user, NewsletterAudience $audience): bool
    {
        return $this->sameTenant($user, $audience)
            && $user->can(NewsletterPermission::AudiencesUpdate->value);
    }

    public function delete(Authenticatable $user, NewsletterAudience $audience): bool
    {
        if (! $this->sameTenant($user, $audience)) {
            return false;
        }

        // Default audience is a system row that anchors the fallback
        // send flow; refuse the delete unconditionally.
        if ((bool) $audience->{NewsletterAudienceInterface::ATTR_IS_DEFAULT} === true) {
            return false;
        }

        return $user->can(NewsletterPermission::AudiencesDelete->value);
    }

    private function sameTenant(Authenticatable $user, NewsletterAudience $audience): bool
    {
        $rowTenantId = $audience->{NewsletterAudienceInterface::ATTR_TENANT_ID} ?? null;
        $userTenantId = $user->getAttribute('tenant_id');

        if ($rowTenantId === null || $userTenantId === null) {
            return false;
        }

        return (string) $rowTenantId === (string) $userTenantId;
    }
}
