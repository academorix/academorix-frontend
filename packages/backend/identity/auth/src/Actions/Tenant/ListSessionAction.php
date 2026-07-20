<?php

declare(strict_types=1);

namespace Academorix\Auth\Actions\Tenant;

use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * `GET /api/v1/auth/sessions` — list the caller's active PATs.
 *
 * Powers the "your sessions" UI. Each row exposes public metadata
 * ONLY — the plaintext token is NEVER echoed back (Sanctum only
 * ever stores the SHA-256 hash on `personal_access_tokens`).
 *
 * @category Auth
 *
 * @since    0.1.0
 */
#[AsAction(name: 'auth.sessions.list')]
#[Get('/api/v1/auth/sessions')]
#[Middleware(['api', 'auth:sanctum'])]
final class ListSessionAction
{
    use AsController;

    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user === null) {
            return response()->json(['data' => []], JsonResponse::HTTP_OK);
        }

        // Enumerate the caller's PATs. Each row's public shape:
        //   id, name, abilities[], created_at, last_used_at.
        // Never expose `token` (the hash) — clients don't need it
        // and it's still credential-adjacent material.
        $tokens = $user->tokens()
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($t) => [
                'id' => $t->getKey(),
                'name' => $t->name,
                'abilities' => $t->abilities ?? [],
                'created_at' => $t->created_at?->toIso8601String(),
                'last_used_at' => $t->last_used_at?->toIso8601String(),
            ])
            ->all();

        return response()->json(['data' => $tokens], JsonResponse::HTTP_OK);
    }
}
