<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Enums;

use Stackra\Authorization\Contracts\PermissionEnum;
use Stackra\Authorization\Enums\Guard;
use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Permissions the Newsletter module contributes.
 *
 * Every permission is bound to the `sanctum` guard (tenant users);
 * the module has no platform-admin permissions of its own — platform
 * support inherits view-only access via the tenancy module's cross-
 * tenant impersonation surface.
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/newsletter/permissions.json
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum NewsletterPermission: string implements PermissionEnum
{
    use Enum;

    // ── Newsletter (publication) ───────────────────────────────

    /**
     * `newsletters.viewAny` — list newsletters within the tenant.
     */
    #[Label('View Newsletters')]
    #[Description('List newsletters within the tenant.')]
    case NewslettersViewAny = 'newsletters.viewAny';

    /**
     * `newsletters.view` — read one newsletter.
     */
    #[Label('View Newsletter')]
    #[Description('Read a single newsletter.')]
    case NewslettersView = 'newsletters.view';

    /**
     * `newsletters.create` — create a new newsletter.
     */
    #[Label('Create Newsletter')]
    #[Description('Create a new newsletter publication.')]
    case NewslettersCreate = 'newsletters.create';

    /**
     * `newsletters.update` — edit an existing newsletter.
     */
    #[Label('Update Newsletter')]
    #[Description('Edit an existing newsletter publication.')]
    case NewslettersUpdate = 'newsletters.update';

    /**
     * `newsletters.delete` — soft-delete a newsletter.
     */
    #[Label('Delete Newsletter')]
    #[Description('Soft-delete a newsletter and cascade to its issues, subscriptions, and campaigns.')]
    case NewslettersDelete = 'newsletters.delete';

    /**
     * `newsletters.manage` — pause / resume / archive.
     */
    #[Label('Manage Newsletter')]
    #[Description('Pause, resume, or archive a newsletter.')]
    case NewslettersManage = 'newsletters.manage';

    // ── NewsletterIssue ────────────────────────────────────────

    /**
     * `newsletter-issues.viewAny` — list issues within a newsletter.
     */
    #[Label('View Newsletter Issues')]
    #[Description('List issues within a newsletter.')]
    case IssuesViewAny = 'newsletter-issues.viewAny';

    /**
     * `newsletter-issues.view` — read one issue.
     */
    #[Label('View Newsletter Issue')]
    #[Description('Read a single newsletter issue.')]
    case IssuesView = 'newsletter-issues.view';

    /**
     * `newsletter-issues.create` — draft a new issue.
     */
    #[Label('Create Newsletter Issue')]
    #[Description('Draft a new issue for a newsletter.')]
    case IssuesCreate = 'newsletter-issues.create';

    /**
     * `newsletter-issues.update` — edit an unsent issue.
     */
    #[Label('Update Newsletter Issue')]
    #[Description('Edit an unsent newsletter issue.')]
    case IssuesUpdate = 'newsletter-issues.update';

    /**
     * `newsletter-issues.delete` — delete an issue.
     */
    #[Label('Delete Newsletter Issue')]
    #[Description('Delete an unsent newsletter issue.')]
    case IssuesDelete = 'newsletter-issues.delete';

    /**
     * `newsletter-issues.publish` — schedule / send-now / cancel.
     */
    #[Label('Publish Newsletter Issue')]
    #[Description('Schedule, send-now, or cancel a newsletter issue.')]
    case IssuesPublish = 'newsletter-issues.publish';

    // ── NewsletterSubscription ─────────────────────────────────

    /**
     * `newsletter-subscriptions.viewAny` — list subscribers.
     */
    #[Label('View Subscriptions')]
    #[Description('List subscribers within a newsletter.')]
    case SubscriptionsViewAny = 'newsletter-subscriptions.viewAny';

    /**
     * `newsletter-subscriptions.view` — read one subscription.
     */
    #[Label('View Subscription')]
    #[Description('Read a single subscription record.')]
    case SubscriptionsView = 'newsletter-subscriptions.view';

    /**
     * `newsletter-subscriptions.create` — admin add subscriber.
     */
    #[Label('Create Subscription')]
    #[Description('Admin-add a subscriber (with valid consent evidence).')]
    case SubscriptionsCreate = 'newsletter-subscriptions.create';

    /**
     * `newsletter-subscriptions.update` — edit tags / metadata.
     */
    #[Label('Update Subscription')]
    #[Description('Edit subscription tags or metadata. Email is never editable.')]
    case SubscriptionsUpdate = 'newsletter-subscriptions.update';

    /**
     * `newsletter-subscriptions.delete` — soft-delete a subscription.
     */
    #[Label('Delete Subscription')]
    #[Description('Soft-delete a subscription record.')]
    case SubscriptionsDelete = 'newsletter-subscriptions.delete';

    /**
     * `newsletter-subscriptions.import` — CSV import.
     */
    #[Label('Import Subscribers')]
    #[Description('Bulk import subscribers via CSV. Requires consent evidence per row.')]
    case SubscriptionsImport = 'newsletter-subscriptions.import';

    /**
     * `newsletter-subscriptions.export` — CSV export (sensitive PII).
     */
    #[Label('Export Subscribers')]
    #[Description('Export subscribers to CSV. Sensitive — includes PII.')]
    case SubscriptionsExport = 'newsletter-subscriptions.export';

    // ── NewsletterCampaign ─────────────────────────────────────

    /**
     * `newsletter-campaigns.viewAny` — list campaigns.
     */
    #[Label('View Campaigns')]
    #[Description('List send campaigns for a newsletter.')]
    case CampaignsViewAny = 'newsletter-campaigns.viewAny';

    /**
     * `newsletter-campaigns.view` — read one campaign.
     */
    #[Label('View Campaign')]
    #[Description('Read a single campaign with counters + status.')]
    case CampaignsView = 'newsletter-campaigns.view';

    /**
     * `newsletter-campaigns.manage` — cancel campaign.
     */
    #[Label('Manage Campaigns')]
    #[Description('Cancel a pending or in-progress campaign.')]
    case CampaignsManage = 'newsletter-campaigns.manage';

    // ── NewsletterAudience ─────────────────────────────────────

    /**
     * `newsletter-audiences.viewAny` — list audiences.
     */
    #[Label('View Audiences')]
    #[Description('List audience segments for a newsletter.')]
    case AudiencesViewAny = 'newsletter-audiences.viewAny';

    /**
     * `newsletter-audiences.view` — read one audience.
     */
    #[Label('View Audience')]
    #[Description('Read a single audience segment definition.')]
    case AudiencesView = 'newsletter-audiences.view';

    /**
     * `newsletter-audiences.create` — create an audience.
     */
    #[Label('Create Audience')]
    #[Description('Create a new audience segment.')]
    case AudiencesCreate = 'newsletter-audiences.create';

    /**
     * `newsletter-audiences.update` — edit an audience.
     */
    #[Label('Update Audience')]
    #[Description('Edit an audience segment definition or refresh its cached members.')]
    case AudiencesUpdate = 'newsletter-audiences.update';

    /**
     * `newsletter-audiences.delete` — delete an audience.
     */
    #[Label('Delete Audience')]
    #[Description('Delete an audience segment. The default audience cannot be deleted.')]
    case AudiencesDelete = 'newsletter-audiences.delete';

    /**
     * Every permission on this enum binds to the `sanctum` guard —
     * newsletter management is entirely tenant-scoped.
     */
    public function guard(): Guard
    {
        return Guard::Sanctum;
    }
}
