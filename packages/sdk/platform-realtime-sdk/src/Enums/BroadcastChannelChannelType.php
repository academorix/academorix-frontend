<?php

declare(strict_types=1);

namespace Academorix\PlatformRealtimeSdk\Enums;

/**
 * Wire-visible backed enum for `broadcast-channel.channel_type`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category RealtimeSdk
 *
 * @since    0.1.0
 */
enum BroadcastChannelChannelType: string
{
    case Public = 'public';
    case Private = 'private';
    case Presence = 'presence';
}
