<?php

declare(strict_types=1);

namespace Academorix\Notifications\Push\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Push provider drivers supported by the module.
 *
 * ## Cases
 *
 *  * {@see self::Fcm}       — Firebase Cloud Messaging (Android + Web).
 *  * {@see self::Apns}      — Apple Push Notification service (iOS).
 *  * {@see self::Expo}      — Expo Push Service (React Native).
 *  * {@see self::OneSignal} — OneSignal (enterprise cross-platform).
 *  * {@see self::Log}       — Local log driver — dev / staging only.
 *  * {@see self::Array_}    — In-memory array driver — testing only.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum PushProvider: string
{
    use Enum;

    /**
     * Firebase Cloud Messaging — Google's push provider covering Android
     * devices and Web Push endpoints.
     */
    #[Label('Firebase Cloud Messaging')]
    #[Description('Google FCM — Android + Web push transport.')]
    case Fcm = 'fcm';

    /**
     * Apple Push Notification service — Apple's push provider for iOS,
     * iPadOS, macOS, watchOS.
     */
    #[Label('Apple Push Notification service')]
    #[Description('Apple APNs — iOS + macOS + watchOS push transport.')]
    case Apns = 'apns';

    /**
     * Expo Push Service — cross-platform React Native transport.
     */
    #[Label('Expo Push Service')]
    #[Description('Expo Push Service — React Native cross-platform transport.')]
    case Expo = 'expo';

    /**
     * OneSignal — enterprise cross-platform push aggregator.
     */
    #[Label('OneSignal')]
    #[Description('OneSignal cross-platform push aggregator.')]
    case OneSignal = 'onesignal';

    /**
     * Log driver — writes to the app log instead of a real provider. Used
     * in dev + staging to trace push envelopes without spamming devices.
     */
    #[Label('Log Driver')]
    #[Description('Log-only driver — dev / staging trace transport.')]
    case Log = 'log';

    /**
     * Array driver — accumulates in-memory. Used by feature tests.
     */
    #[Label('Array Driver')]
    #[Description('In-memory driver — test-only transport.')]
    case Array_ = 'array';
}
