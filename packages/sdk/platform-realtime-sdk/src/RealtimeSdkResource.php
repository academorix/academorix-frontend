<?php

declare(strict_types=1);

namespace Academorix\PlatformRealtimeSdk;

use Academorix\ApiSdk\Attributes\AsSdkResource;
use Academorix\ApiSdk\Resources\BaseSdkResource;

/**
 * Top-level SDK Resource for the `realtime` module.
 *
 * Registered under `#[AsSdkResource(name: 'realtime', service: 'platform')]`
 * so the Platform service umbrella auto-discovers it at boot
 * and consumers dispatch every call via `$sdk->realtime()->...`.
 *
 * ## Peer Resources
 *
 * - BroadcastChannelsResource — peer resource for `broadcast-channels`.
 * - BroadcastSubscriptionsResource — peer resource for `broadcast-subscriptions`.
 * - PresencesResource — peer resource for `presences`.
 *
 * @category RealtimeSdk
 *
 * @since    0.1.0
 */
#[AsSdkResource(name: 'realtime', service: 'platform')]
final class RealtimeSdkResource extends BaseSdkResource
{
    private ?Resources\BroadcastChannelsResource $broadcastChannels = null;
    private ?Resources\BroadcastSubscriptionsResource $broadcastSubscriptions = null;
    private ?Resources\PresencesResource $presences = null;

    /**
     * Access BroadcastChannels peer Resource.
     */
    public function broadcastChannels(): Resources\BroadcastChannelsResource
    {
        return $this->broadcastChannels ??= new Resources\BroadcastChannelsResource($this->connector);
    }

    /**
     * Access BroadcastSubscriptions peer Resource.
     */
    public function broadcastSubscriptions(): Resources\BroadcastSubscriptionsResource
    {
        return $this->broadcastSubscriptions ??= new Resources\BroadcastSubscriptionsResource($this->connector);
    }

    /**
     * Access Presences peer Resource.
     */
    public function presences(): Resources\PresencesResource
    {
        return $this->presences ??= new Resources\PresencesResource($this->connector);
    }
}
