<?php

declare(strict_types=1);

namespace Stackra\Localization\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Localization\Contracts\Data\TranslationInterface;
use Stackra\Localization\Data\Resources\TranslationData;
use Stackra\Localization\Enums\LocalizationPermission;
use Stackra\Localization\Models\Translation;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Illuminate\Container\Attributes\Auth;

/**
 * `POST /api/v1/translations/{translation}/verify` — mark an
 * AI-produced translation as human-verified.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsAction(name: 'localization.tenant.translations.verify')]
#[Post('/api/v1/translations/{translation}/verify')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve', 'locale.resolve'])]
#[RequirePermission(LocalizationPermission::TranslationsVerify)]
final class VerifyTranslation
{
    use AsController;

    public function __construct(
        #[Auth] private readonly AuthFactory $auth,
    ) {
    }

    public function __invoke(Translation $translation): TranslationData
    {
        $verifierId = null;
        try {
            $user = $this->auth->guard()->user();
            $verifierId = $user?->getAttribute('id');
        } catch (\Throwable) {
            // Silent — the user is required by the guard middleware
            // upstream, so this branch is defensive.
        }

        $translation->fill([
            TranslationInterface::ATTR_IS_VERIFIED => true,
            TranslationInterface::ATTR_VERIFIED_BY => $verifierId === null ? null : (string) $verifierId,
            TranslationInterface::ATTR_VERIFIED_AT => now(),
        ])->save();

        return TranslationData::fromModel($translation);
    }
}
