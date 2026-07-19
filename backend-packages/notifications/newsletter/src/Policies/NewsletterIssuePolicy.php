<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Policies;

use Academorix\Newsletter\Contracts\Data\NewsletterIssueInterface;
use Academorix\Newsletter\Enums\NewsletterIssueStatus;
use Academorix\Newsletter\Enums\NewsletterPermission;
use Academorix\Newsletter\Models\NewsletterIssue;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see NewsletterIssue}.
 *
 * ## Immutability guardrail
 *
 * `update` and `delete` are refused on `Sending` / `Sent`
 * issues — sent issues are historical evidence, and sending issues
 * are actively being dispatched.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterIssuePolicy
{
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(NewsletterPermission::IssuesViewAny->value);
    }

    public function view(Authenticatable $user, NewsletterIssue $issue): bool
    {
        return $this->sameTenant($user, $issue)
            && $user->can(NewsletterPermission::IssuesView->value);
    }

    public function create(Authenticatable $user): bool
    {
        return $user->can(NewsletterPermission::IssuesCreate->value);
    }

    public function update(Authenticatable $user, NewsletterIssue $issue): bool
    {
        if (! $this->sameTenant($user, $issue)) {
            return false;
        }

        if (! $this->isMutableState($issue)) {
            return false;
        }

        return $user->can(NewsletterPermission::IssuesUpdate->value);
    }

    public function delete(Authenticatable $user, NewsletterIssue $issue): bool
    {
        if (! $this->sameTenant($user, $issue)) {
            return false;
        }

        // Only drafts + cancelled are deletable.
        $status = $issue->{NewsletterIssueInterface::ATTR_STATUS};
        $value  = $status instanceof \BackedEnum ? $status->value : (string) $status;
        if (! \in_array($value, [
            NewsletterIssueStatus::Draft->value,
            NewsletterIssueStatus::Cancelled->value,
        ], true)) {
            return false;
        }

        return $user->can(NewsletterPermission::IssuesDelete->value);
    }

    /**
     * Schedule / send-now / cancel.
     */
    public function publish(Authenticatable $user, NewsletterIssue $issue): bool
    {
        return $this->sameTenant($user, $issue)
            && $user->can(NewsletterPermission::IssuesPublish->value);
    }

    private function isMutableState(NewsletterIssue $issue): bool
    {
        $status = $issue->{NewsletterIssueInterface::ATTR_STATUS};
        $value  = $status instanceof \BackedEnum ? $status->value : (string) $status;

        return \in_array($value, [
            NewsletterIssueStatus::Draft->value,
            NewsletterIssueStatus::Scheduled->value,
        ], true);
    }

    private function sameTenant(Authenticatable $user, NewsletterIssue $issue): bool
    {
        $rowTenantId = $issue->{NewsletterIssueInterface::ATTR_TENANT_ID} ?? null;
        $userTenantId = $user->getAttribute('tenant_id');

        if ($rowTenantId === null || $userTenantId === null) {
            return false;
        }

        return (string) $rowTenantId === (string) $userTenantId;
    }
}
