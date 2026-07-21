<?php

declare(strict_types=1);

namespace Stackra\Localization\Enums;

use Stackra\Authorization\Contracts\PermissionEnum;
use Stackra\Authorization\Enums\Guard;
use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Permissions the Localization module contributes.
 *
 * Split across the two guards — tenant users manage their own
 * enabled locales + translations via `sanctum`; platform admins
 * curate the platform-wide language catalogue + observe cross-tenant
 * translation activity via `platform_admin`.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum LocalizationPermission: string implements PermissionEnum
{
    use Enum;

    /**
     * `languages.viewAny` — tenant reads the platform catalogue of
     * active languages available for enablement.
     */
    #[Label('View Platform Languages')]
    #[Description('Read the platform-wide catalogue of BCP-47 languages available for tenant enablement.')]
    case LanguagesViewAny = 'languages.viewAny';

    /**
     * `languages.view` — tenant reads a specific platform language row.
     */
    #[Label('View Platform Language')]
    #[Description('Read a single platform language row (accessors chain through the geography module).')]
    case LanguagesView = 'languages.view';

    /**
     * `tenant_locales.viewAny` — tenant lists its own enabled locales.
     */
    #[Label('View Tenant Locales')]
    #[Description('Read every locale enabled for the caller\'s tenant.')]
    case TenantLocalesViewAny = 'tenant_locales.viewAny';

    /**
     * `tenant_locales.view` — tenant reads a single tenant-locale row.
     */
    #[Label('View Tenant Locale')]
    #[Description('Read a single tenant-locale enablement row.')]
    case TenantLocalesView = 'tenant_locales.view';

    /**
     * `tenant_locales.manage` — tenant admin enables / disables /
     * updates a locale for the tenant. Consumes the
     * `localization.locales.count` entitlement.
     */
    #[Label('Manage Tenant Locales')]
    #[Description('Enable, disable, or update a tenant\'s enabled locales. Consumes the localization.locales.count entitlement.')]
    case TenantLocalesManage = 'tenant_locales.manage';

    /**
     * `translations.viewAny` — tenant lists translation rows scoped
     * to the tenant.
     */
    #[Label('View Translations')]
    #[Description('List translation rows scoped to the caller\'s tenant.')]
    case TranslationsViewAny = 'translations.viewAny';

    /**
     * `translations.view` — tenant reads a single translation row.
     */
    #[Label('View Translation')]
    #[Description('Read a single translation row scoped to the caller\'s tenant.')]
    case TranslationsView = 'translations.view';

    /**
     * `translations.create` — tenant creates a hand-authored
     * translation override.
     */
    #[Label('Create Translations')]
    #[Description('Create a tenant translation override.')]
    case TranslationsCreate = 'translations.create';

    /**
     * `translations.update` — tenant edits an existing translation row.
     */
    #[Label('Update Translations')]
    #[Description('Update an existing tenant translation row.')]
    case TranslationsUpdate = 'translations.update';

    /**
     * `translations.delete` — tenant deletes a translation override
     * (falls back to platform default or file).
     */
    #[Label('Delete Translations')]
    #[Description('Delete a tenant translation override — the resolution falls back to the platform default or the file-based translation.')]
    case TranslationsDelete = 'translations.delete';

    /**
     * `translations.verify` — mark an AI-produced translation as
     * human-verified.
     */
    #[Label('Verify Translations')]
    #[Description('Mark an AI-produced translation as human-verified. Requires the translation-reviewer role or admin.')]
    case TranslationsVerify = 'translations.verify';

    /**
     * `translation_jobs.viewAny` — tenant lists translation jobs.
     */
    #[Label('View Translation Jobs')]
    #[Description('List translation jobs scoped to the caller\'s tenant.')]
    case TranslationJobsViewAny = 'translation_jobs.viewAny';

    /**
     * `translation_jobs.view` — tenant reads a single job row.
     */
    #[Label('View Translation Job')]
    #[Description('Read a single translation job row.')]
    case TranslationJobsView = 'translation_jobs.view';

    /**
     * `translation_jobs.create` — tenant admin dispatches a bulk
     * translation job.
     */
    #[Label('Create Translation Jobs')]
    #[Description('Dispatch a bulk translation job. Consumes the localization.ai_translations.month pool.')]
    case TranslationJobsCreate = 'translation_jobs.create';

    /**
     * `translation_jobs.cancel` — tenant admin cancels a running
     * bulk translation job.
     */
    #[Label('Cancel Translation Jobs')]
    #[Description('Cancel a running bulk translation job.')]
    case TranslationJobsCancel = 'translation_jobs.cancel';

    /**
     * `platform.languages.viewAny` — platform admin lists the full
     * language catalogue (including inactive rows).
     */
    #[Label('View Platform Languages (Platform)')]
    #[Description('Platform-admin read of the full language catalogue including inactive rows.')]
    case PlatformLanguagesViewAny = 'platform.languages.viewAny';

    /**
     * `platform.languages.view` — platform admin reads any language
     * row.
     */
    #[Label('View Platform Language (Platform)')]
    #[Description('Platform-admin read of a single language catalogue row.')]
    case PlatformLanguagesView = 'platform.languages.view';

    /**
     * `platform.languages.create` — platform admin creates a new
     * language catalogue row.
     */
    #[Label('Create Platform Language')]
    #[Description('Platform-admin create for the language catalogue.')]
    case PlatformLanguagesCreate = 'platform.languages.create';

    /**
     * `platform.languages.update` — platform admin updates a
     * language catalogue row.
     */
    #[Label('Update Platform Language')]
    #[Description('Platform-admin update for the language catalogue.')]
    case PlatformLanguagesUpdate = 'platform.languages.update';

    /**
     * `platform.languages.archive` — platform admin archives a
     * language catalogue row (refused when any tenant references
     * it).
     */
    #[Label('Archive Platform Language')]
    #[Description('Platform-admin archive for the language catalogue. Refused when any TenantLocale references the row.')]
    case PlatformLanguagesArchive = 'platform.languages.archive';

    /**
     * `platform.translations.viewAny` — platform admin lists
     * translations cross-tenant for observability + incident triage.
     */
    #[Label('View Translations (Platform)')]
    #[Description('Platform-admin cross-tenant read of translations for observability + incident triage.')]
    case PlatformTranslationsViewAny = 'platform.translations.viewAny';

    /**
     * The Laravel guard this permission binds to. Every
     * `platform.*`-prefixed case targets `platform_admin`; every
     * other case targets `sanctum`.
     */
    public function guard(): Guard
    {
        return match ($this) {
            self::PlatformLanguagesViewAny,
            self::PlatformLanguagesView,
            self::PlatformLanguagesCreate,
            self::PlatformLanguagesUpdate,
            self::PlatformLanguagesArchive,
            self::PlatformTranslationsViewAny => Guard::PlatformAdmin,

            default => Guard::Sanctum,
        };
    }
}
