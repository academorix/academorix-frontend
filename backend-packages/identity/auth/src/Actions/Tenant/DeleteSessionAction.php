<?php

declare(strict_types=1);

namespace Academorix\Auth\Actions\Tenant;

use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Delete;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * `DELETE /api/v1/auth/sessions/{session}` — revoke a specific PAT.
 *
 * Callers use this to revoke a session OTHER than their current
 * one — e.g. "I forgot to sign out on my other laptop". The
 * action looks up the target PAT by id and refuses if it belongs
 * to a different Identity (defence against IDOR).
 *
 * Returns 204 No Content on success, 404 on unknown id, 403 on a
 * cross-Identity attempt.
 *
 * @category Auth
 *
 * @since    0.1.0
 */
#[AsAction(name: 'auth.sessions.delete')]
#[Delete('/api/v1/auth/sessions/{session}')]
#[Middleware(['api', 'auth:sanctum'])]
final class DeleteSessionAction
{
    use AsController;

    public function __invoke(Request $request, string $session): JsonResponse
    {
        $user = $request->user();
        if ($user === null) {
            // Middleware should have caught this; belt-and-braces.
            return response()->json(null, JsonResponse::HTTP_UNAUTHORIZED);
        }

        /** @var PersonalAccessToken|null $token */
        $token = PersonalAccessToken::query()->find($session);
        if ($token === null) {
            return response()->json(
                ['error' => ['code' => 'SESSION_NOT_FOUND']],
                JsonResponse::HTTP_NOT_FOUND,
            );
        }

        // IDOR guard — the token must belong to the presenting
        // Identity. `tokenable_id` is the polymorphic FK Sanctum
        // stores on `personal_access_tokens`. `tokenable_type`
        // check keeps the guard robust when multiple Authenticatable
        // types share ULID ranges.
        if (
            (string) $token->tokenable_id !== (string) $user->getKey()
            || (string) $token->tokenable_type !== $user::class
        ) {
            return response()->json(
                ['error' => ['code' => 'FORBIDDEN']],
                JsonResponse::HTTP_FORBIDDEN,
            );
        }

        $token->delete();

        return response()->json(null, JsonResponse::HTTP_NO_CONTENT);
    }
}
