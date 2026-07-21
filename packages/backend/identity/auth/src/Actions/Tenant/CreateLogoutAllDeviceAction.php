<?php

declare(strict_types=1);

namespace Stackra\Auth\Actions\Tenant;

use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * `POST /api/v1/auth/logout-all` — revoke EVERY token on the account.
 *
 * The nuclear button. The action calls
 * `HasApiTokens::tokens()->delete()` which drops every row on
 * `personal_access_tokens` for the caller's Identity. Every other
 * open tab / device / SDK instance loses auth on the next request.
 *
 * The auth-audit trail on the Identity row picks this up via the
 * Auditable trait; no additional event is fired.
 *
 * @category Auth
 *
 * @since    0.1.0
 */
#[AsAction(name: 'auth.logout_all_device.create')]
#[Post('/api/v1/auth/logout-all')]
#[Middleware(['api', 'auth:sanctum'])]
final class CreateLogoutAllDeviceAction
{
    use AsController;

    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user === null) {
            // Idempotent — 204 on an already-anonymous caller.
            return response()->json(null, JsonResponse::HTTP_NO_CONTENT);
        }

        // Delete every PAT row for this Identity. `->tokens()` is
        // Sanctum's HasApiTokens relation; calling delete() on the
        // query builder cascades to every attached row.
        $user->tokens()->delete();

        return response()->json(null, JsonResponse::HTTP_NO_CONTENT);
    }
}
