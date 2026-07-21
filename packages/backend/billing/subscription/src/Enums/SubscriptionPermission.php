<?php

declare(strict_types=1);

namespace Stackra\Subscription\Enums;

use Stackra\Authorization\Contracts\PermissionEnum;
use Stackra\Authorization\Enums\Guard;
use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Permissions the Subscription module contributes.
 *
 * Split across the two guards — tenant users read + manage their own
 * tenant's subscription via `sanctum`; platform staff manage the plan
 * catalogue + cross-tenant subscription visibility via
 * `platform_admin`. Same permission model as the rest of the billing
 * surface.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum SubscriptionPermission: string implements PermissionEnum
{
    use Enum;

    // ── Tenant-scoped permissions (sanctum guard) ───────────────

    /**
     * `plans.viewAny` — any tenant member sees the public plan catalogue
     * for their Application.
     */
    #[Label('View Plans')]
    #[Description('Read the public plan catalogue for the tenant\'s Application.')]
    case PlansViewAny = 'plans.viewAny';

    /**
     * `plans.view` — read one specific plan row (tenant-visible).
     */
    #[Label('View Plan')]
    #[Description('Read one specific plan row visible to the tenant.')]
    case PlansView = 'plans.view';

    /**
     * `subscription.view` — read the tenant's own subscription record.
     */
    #[Label('View Subscription')]
    #[Description('Read the tenant\'s active subscription record.')]
    case SubscriptionView = 'subscription.view';

    /**
     * `subscription.view.invoices` — read invoices attached to the
     * tenant's subscription.
     */
    #[Label('View Subscription Invoices')]
    #[Description('Read invoices attached to the tenant\'s subscription.')]
    case SubscriptionViewInvoices = 'subscription.view.invoices';

    /**
     * `subscription.manage` — checkout, swap, cancel, resume, portal.
     * Owner-only permission by design.
     */
    #[Label('Manage Subscription')]
    #[Description('Checkout, swap, cancel, resume, and portal-redirect the tenant\'s subscription. Owner-only.')]
    case SubscriptionManage = 'subscription.manage';

    /**
     * `subscription.events.viewAny` — audit-material subscription
     * event feed for tenant admins.
     */
    #[Label('View Subscription Events')]
    #[Description('Read the tenant\'s subscription event feed (audit trail).')]
    case SubscriptionEventsViewAny = 'subscription.events.viewAny';

    // ── Platform-scoped permissions (platform_admin guard) ─────

    /**
     * `platform.plans.viewAny` — platform ops list every plan across
     * every Application.
     */
    #[Label('View All Plans (platform)')]
    #[Description('Cross-Application read-only access to every plan in the catalogue.')]
    case PlatformPlansViewAny = 'platform.plans.viewAny';

    /**
     * `platform.plans.view` — platform ops read one plan row.
     */
    #[Label('View Plan (platform)')]
    #[Description('Read one plan row (cross-Application).')]
    case PlatformPlansView = 'platform.plans.view';

    /**
     * `platform.plans.create` — platform ops introduce a new plan.
     */
    #[Label('Create Plan (platform)')]
    #[Description('Create a new plan row in the catalogue.')]
    case PlatformPlansCreate = 'platform.plans.create';

    /**
     * `platform.plans.update` — platform ops modify a plan.
     */
    #[Label('Update Plan (platform)')]
    #[Description('Modify an existing plan row.')]
    case PlatformPlansUpdate = 'platform.plans.update';

    /**
     * `platform.plans.archive` — platform super-admin archives a plan.
     * Refused when active subscriptions reference the plan.
     */
    #[Label('Archive Plan (platform)')]
    #[Description('Archive a plan. Refused while active subscriptions reference it.')]
    case PlatformPlansArchive = 'platform.plans.archive';

    /**
     * `platform.subscriptions.viewAny` — platform ops list every
     * subscription across every tenant.
     */
    #[Label('View All Subscriptions (platform)')]
    #[Description('Cross-tenant read-only access to every subscription row.')]
    case PlatformSubscriptionsViewAny = 'platform.subscriptions.viewAny';

    /**
     * `platform.subscriptions.view` — platform ops read one
     * subscription row.
     */
    #[Label('View Subscription (platform)')]
    #[Description('Read one subscription row (cross-tenant).')]
    case PlatformSubscriptionsView = 'platform.subscriptions.view';

    /**
     * `platform.subscriptions.enterprise` — sales + finance can create
     * offline PO subscriptions. Every use audit-logged.
     */
    #[Label('Create Enterprise Invoice')]
    #[Description('Create an offline PO subscription without Cashier. Every use audit-logged.')]
    case PlatformSubscriptionsEnterprise = 'platform.subscriptions.enterprise';

    /**
     * `platform.subscriptions.force-state` — super-admin only
     * emergency state override. Every use audit-logged with reason.
     */
    #[Label('Force Subscription State')]
    #[Description('Emergency state override. Super-admin only; every use audit-logged.')]
    case PlatformSubscriptionsForceState = 'platform.subscriptions.force-state';

    /**
     * `platform.subscription.events.viewAny` — billing team reads the
     * cross-tenant SOX audit trail.
     */
    #[Label('View All Subscription Events (platform)')]
    #[Description('Cross-tenant read-only access to every subscription event row (SOX audit trail).')]
    case PlatformSubscriptionEventsViewAny = 'platform.subscription.events.viewAny';

    /**
     * The Laravel guard this permission binds to. Tenant-owned
     * permissions target `sanctum`; platform-owned permissions target
     * `platform_admin`.
     */
    public function guard(): Guard
    {
        return match ($this) {
            self::PlansViewAny,
            self::PlansView,
            self::SubscriptionView,
            self::SubscriptionViewInvoices,
            self::SubscriptionManage,
            self::SubscriptionEventsViewAny => Guard::Sanctum,

            self::PlatformPlansViewAny,
            self::PlatformPlansView,
            self::PlatformPlansCreate,
            self::PlatformPlansUpdate,
            self::PlatformPlansArchive,
            self::PlatformSubscriptionsViewAny,
            self::PlatformSubscriptionsView,
            self::PlatformSubscriptionsEnterprise,
            self::PlatformSubscriptionsForceState,
            self::PlatformSubscriptionEventsViewAny => Guard::PlatformAdmin,
        };
    }
}
