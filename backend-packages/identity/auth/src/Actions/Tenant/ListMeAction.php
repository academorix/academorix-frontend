<?php

declare(strict_types=1);

namespace Academorix\Auth\Actions\Tenant;

use Academorix\Identity\Contracts\Data\IdentityInterface;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * `GET /api/v1/auth/me` — echo the presenting Identity's public profile.
 *
 * The workhorse endpoint every client calls to check "who am I".
 * The response includes only the PUBLIC surface of the Identity
 * — no secrets, no MFA state, no password history. The `#[Hidden]`
 * attributes on the Identity model back-stop this contract, but
 * we're explicit about the fields here rather than let a stray
 * `toArray()` blow up the wire shape.
 *
 * @category Auth
 *
 * @since    0.1.0
 */
#[AsAction(name: 'auth.me.list')]
#[Get('/api/v1/auth/me')]
#[Middleware(['api', 'auth:sanctum'])]
final class ListMeAction
{
    use AsController;

    public function __invoke(Request $request): JsonResponse
    {
        $identity = $request->user();
        if ($identity === null) {
            // Middleware should have caught this; belt-and-braces.
            return response()->json(
                ['error' => ['code' => 'UNAUTHENTICATED']],
                JsonResponse::HTTP_UNAUTHORIZED,
            );
        }

        return response()->json([
            'data' => [
                'id' => (string) $identity->getKey(),
                'email' => (string) $identity->getAttribute(IdentityInterface::ATTR_EMAIL),
                'email_verified_at' => optional($identity->getAttribute(IdentityInterface::ATTR_EMAIL_VERIFIED_AT))?->toIso8601String(),
                'last_login_at' => optional($identity->getAttribute(IdentityInterface::ATTR_LAST_LOGIN_AT))?->toIso8601String(),
                'has_mfa' => $identity->getAttribute(IdentityInterface::ATTR_MFA_SECRET_ENCRYPTED) !== null,
            ],
        ], JsonResponse::HTTP_OK);
    }
}
