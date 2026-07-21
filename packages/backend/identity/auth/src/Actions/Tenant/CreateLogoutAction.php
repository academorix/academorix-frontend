<?php

declare(strict_types=1);

namespace Stackra\Auth\Actions\Tenant;

use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * `POST /api/v1/auth/logout` — revoke the caller's current PAT.
 *
 * A single-token revoke path. The action reads the currently-
 * authenticated Sanctum token off the request, deletes its row
 * (Sanctum's `->delete()` on the token instance), and returns
 * 204 No Content.
 *
 * A caller that also wants to revoke every other token on the
 * account uses `CreateLogoutAllDeviceAction` — this action stays
 * scoped to the presenting token so accidentally clicking
 * "sign out" on one tab doesn't punt every other tab too.
 *
 * @category Auth
 *
 * @since    0.1.0
 */
#[AsAction(name: 'auth.logout.create')]
#[Post('/api/v1/auth/logout')]
#[Middleware(['api', 'auth:sanctum'])]
final class CreateLogoutAction
{
    use AsController;

    public function __invoke(Request $request): JsonResponse
    {
        // `->currentAccessToken()` returns the Sanctum
        // PersonalAccessToken row IF authenticated via a Bearer
        // token (i.e. a PAT). It returns a TransientToken instance
        // when the caller used Sanctum's SPA cookie flow — that
        // isn't the tenant-audience path so we ignore that branch
        // and return early with 204 (idempotent logout).
        $user = $request->user();
        if ($user === null) {
            return response()->json(null, JsonResponse::HTTP_NO_CONTENT);
        }

        $token = $user->currentAccessToken();
        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }

        return response()->json(null, JsonResponse::HTTP_NO_CONTENT);
    }
}
