<?php

declare(strict_types=1);

namespace Stackra\NotificationsAnnouncementsSdk;

use Stackra\ApiSdk\Attributes\AsSdkResource;
use Stackra\ApiSdk\Resources\BaseSdkResource;

/**
 * Top-level SDK Resource for the `announcements` module.
 *
 * Registered under `#[AsSdkResource(name: 'announcements', service: 'notifications')]`
 * so the Notifications service umbrella auto-discovers it at boot
 * and consumers dispatch every call via `$sdk->announcements()->...`.
 *
 * ## Peer Resources
 *
 * - AnnouncementViewsResource — peer resource for `announcement-views`.
 * - AnnouncementsResource — peer resource for `announcements`.
 *
 * @category AnnouncementsSdk
 *
 * @since    0.1.0
 */
#[AsSdkResource(name: 'announcements', service: 'notifications')]
final class AnnouncementsSdkResource extends BaseSdkResource
{
    private ?Resources\AnnouncementViewsResource $announcementViews = null;
    private ?Resources\AnnouncementsResource $announcements = null;

    /**
     * Access AnnouncementViews peer Resource.
     */
    public function announcementViews(): Resources\AnnouncementViewsResource
    {
        return $this->announcementViews ??= new Resources\AnnouncementViewsResource($this->connector);
    }

    /**
     * Access Announcements peer Resource.
     */
    public function announcements(): Resources\AnnouncementsResource
    {
        return $this->announcements ??= new Resources\AnnouncementsResource($this->connector);
    }
}
