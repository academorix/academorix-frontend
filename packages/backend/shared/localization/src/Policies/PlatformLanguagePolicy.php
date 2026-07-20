<?php

declare(strict_types=1);

namespace Academorix\Localization\Policies;

use Academorix\Localization\Enums\LocalizationPermission;
use Academorix\Localization\Models\PlatformLanguage;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see PlatformLanguage}.
 *
 * Tenant users hit `viewAny` / `view` under the `sanctum` guard
 * (they read the catalogue to pick locales to enable). Platform
 * admins hit the `platform*` abilities under the `platform_admin`
 * guard for catalogue CRUD.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
final class PlatformLanguagePolicy
{
    /**
     * `viewAny` — any authenticated tenant user reads the catalogue
     * (options for the "enable locale" picker).
     */
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(LocalizationPermission::LanguagesViewAny->value);
    }

    /**
     * `view` — any authenticated tenant user reads a single row.
     */
    public function view(Authenticatable $user, PlatformLanguage $language): bool
    {
        return $user->can(LocalizationPermission::LanguagesView->value);
    }

    /**
     * `platformViewAny` — platform admin lists the catalogue.
     */
    public function platformViewAny(Authenticatable $user): bool
    {
        return $user->can(LocalizationPermission::PlatformLanguagesViewAny->value);
    }

    /**
     * `platformView` — platform admin reads a single row.
     */
    public function platformView(Authenticatable $user, PlatformLanguage $language): bool
    {
        return $user->can(LocalizationPermission::PlatformLanguagesView->value);
    }

    /**
     * `platformCreate` — platform admin creates a catalogue row.
     */
    public function platformCreate(Authenticatable $user): bool
    {
        return $user->can(LocalizationPermission::PlatformLanguagesCreate->value);
    }

    /**
     * `platformUpdate` — platform admin updates a catalogue row.
     */
    public function platformUpdate(Authenticatable $user, PlatformLanguage $language): bool
    {
        return $user->can(LocalizationPermission::PlatformLanguagesUpdate->value);
    }

    /**
     * `platformArchive` — platform admin archives a catalogue row.
     * Refused when any tenant references it (enforced by the observer
     * at the model layer).
     */
    public function platformArchive(Authenticatable $user, PlatformLanguage $language): bool
    {
        return $user->can(LocalizationPermission::PlatformLanguagesArchive->value);
    }
}
