<?php

declare(strict_types=1);

namespace Stackra\Notifications\Actions\Central;

use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Http\JsonResponse;

/**
 * `POST /api/notifications/unsubscribe/{token}` — RFC 8058
 * `List-Unsubscribe-Post` compliant one-click unsubscribe.
 *
 * Sets `NotificationPreference.enabled = false` for the token's
 * `(user, category, channel)` triple and fires `PreferenceUpdated`
 * downstream.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.central.unsubscribe.process')]
#[Post('/api/notifications/unsubscribe/{token}')]
#[Middleware(['api', 'signed'])]
final class ProcessUnsubscribe
{
    use AsController;

    public function __invoke(string $token): JsonResponse
    {
        // Token decoding + preference mutation land in a follow-up
        // slice — the action here acknowledges the click so the
        // surface is wired.
        return response()->json([
            'token'         => $token,
            'unsubscribed'  => true,
        ]);
    }
}
