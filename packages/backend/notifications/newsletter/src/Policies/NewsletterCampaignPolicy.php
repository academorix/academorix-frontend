<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Policies;

use Stackra\Newsletter\Contracts\Data\NewsletterCampaignInterface;
use Stackra\Newsletter\Enums\NewsletterPermission;
use Stackra\Newsletter\Models\NewsletterCampaign;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see NewsletterCampaign}.
 *
 * Campaign creation happens implicitly via
 * `POST /issues/{issue}/schedule`, so there's no `create` ability
 * on this policy — the `IssuePolicy::publish` ability guards that
 * write.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterCampaignPolicy
{
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(NewsletterPermission::CampaignsViewAny->value);
    }

    public function view(Authenticatable $user, NewsletterCampaign $campaign): bool
    {
        return $this->sameTenant($user, $campaign)
            && $user->can(NewsletterPermission::CampaignsView->value);
    }

    /**
     * Cancel a pending or in-progress campaign.
     */
    public function manage(Authenticatable $user, NewsletterCampaign $campaign): bool
    {
        return $this->sameTenant($user, $campaign)
            && $user->can(NewsletterPermission::CampaignsManage->value);
    }

    private function sameTenant(Authenticatable $user, NewsletterCampaign $campaign): bool
    {
        $rowTenantId = $campaign->{NewsletterCampaignInterface::ATTR_TENANT_ID} ?? null;
        $userTenantId = $user->getAttribute('tenant_id');

        if ($rowTenantId === null || $userTenantId === null) {
            return false;
        }

        return (string) $rowTenantId === (string) $userTenantId;
    }
}
