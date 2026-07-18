<?php

declare(strict_types=1);

namespace Academorix\Notifications\Actions\Central;

use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Illuminate\Http\JsonResponse;

/**
 * `GET /api/notifications/unsubscribe/{token}` — the public
 * unsubscribe confirmation surface.
 *
 * Token is a signed URL claim triple `(user_id, category_slug,
 * channel)` with a 30-day TTL. The action verifies the token
 * (via the `signed` middleware) and echoes the target for the
 * confirmation UI.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.central.unsubscribe.show')]
#[Get('/api/notifications/unsubscribe/{token}')]
#[Middleware(['api', 'signed'])]
final class ShowUnsubscribeForm
{
    use AsController;

    public function __invoke(string $token): JsonResponse
    {
        return response()->json([
            'token'         => $token,
            'confirmation'  => 'Please confirm your unsubscribe request.',
        ]);
    }
}
