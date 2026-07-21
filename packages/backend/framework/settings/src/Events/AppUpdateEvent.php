<?php

declare(strict_types=1);

/**
 * App Update Event.
 *
 * Dispatched when the `app_version` settings group is updated, notifying
 * all connected clients that a new application version is available.
 * Broadcasts on the public `app.updates` channel so that web, mobile,
 * and desktop clients can display update prompts.
 *
 * The event payload includes the new version number, per-platform update
 * URLs, a mandatory flag, and the release notes URL. Clients use the
 * platform-specific fields to determine whether to show an update prompt.
 *
 * @category Events
 *
 * @since    1.0.0
 *
 * @see \Stackra\Settings\Settings\AppVersionSettings
 * @see \Stackra\Settings\Controllers\AppVersionController
 */

namespace Stackra\Settings\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Stackra\Events\Attributes\AsEvent;

/**
 * App Update Notification Event.
 *
 * Broadcasts on the public `app.updates` channel when app version
 * settings are updated. All connected clients receive this event
 * regardless of authentication state.
 */
#[AsEvent(description: 'Fired when app version settings are updated.', broadcastable: true)]
final readonly class AppUpdateEvent implements ShouldBroadcast
{
    /**
     * Create a new AppUpdateEvent instance.
     *
     * @param  string  $version          The new application version number.
     * @param  bool    $mandatory        Whether the update is mandatory (blocks usage until updated).
     * @param  string  $webUpdateUrl     Update URL for the web platform.
     * @param  string  $desktopUpdateUrl Update URL for the desktop platform.
     * @param  string  $mobileUpdateUrl  Update URL for the mobile platform.
     * @param  string  $releaseNotesUrl  URL to the release notes page.
     * @param  bool    $webAvailable     Whether a web update is available.
     * @param  bool    $desktopAvailable Whether a desktop update is available.
     * @param  bool    $mobileAvailable  Whether a mobile update is available.
     * @param  int     $timestamp        Unix timestamp of when the update was published.
     */
    public function __construct(
        /** @var string The new application version number. */
        public string $version,
        /** @var bool Whether the update is mandatory. */
        public bool $mandatory,
        /** @var string Update URL for the web platform. */
        public string $webUpdateUrl,
        /** @var string Update URL for the desktop platform. */
        public string $desktopUpdateUrl,
        /** @var string Update URL for the mobile platform. */
        public string $mobileUpdateUrl,
        /** @var string URL to the release notes page. */
        public string $releaseNotesUrl,
        /** @var bool Whether a web update is available. */
        public bool $webAvailable,
        /** @var bool Whether a desktop update is available. */
        public bool $desktopAvailable,
        /** @var bool Whether a mobile update is available. */
        public bool $mobileAvailable,
        /** @var int Unix timestamp of when the update was published. */
        public int $timestamp,
    ) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * Broadcasts on the public `app.updates` channel so all clients
     * (authenticated or not) can receive update notifications.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [new Channel('app.updates')];
    }

    /**
     * Get the broadcast event name.
     *
     * @return string The event name for the broadcast payload.
     */
    public function broadcastAs(): string
    {
        return 'app.update';
    }

    /**
     * Get the data to broadcast.
     *
     * Returns the payload consumed by all client platforms to determine
     * whether to show an update prompt and which URL to direct the user to.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'version' => $this->version,
            'mandatory' => $this->mandatory,
            'web_update_url' => $this->webUpdateUrl,
            'desktop_update_url' => $this->desktopUpdateUrl,
            'mobile_update_url' => $this->mobileUpdateUrl,
            'release_notes_url' => $this->releaseNotesUrl,
            'web_available' => $this->webAvailable,
            'desktop_available' => $this->desktopAvailable,
            'mobile_available' => $this->mobileAvailable,
            'timestamp' => $this->timestamp,
        ];
    }
}
