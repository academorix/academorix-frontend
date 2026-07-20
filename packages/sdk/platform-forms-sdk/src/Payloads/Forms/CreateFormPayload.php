<?php

declare(strict_types=1);

namespace Academorix\PlatformFormsSdk\Payloads\Forms;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/forms` (or the
 * tenant-scoped equivalent).
 *
 * Every non-nullable property is auto-required by spatie/laravel-data;
 * every nullable defaults to `null`. Snake_case bridge in both
 * directions — the DTO's `toArray()` emits snake_case for the wire,
 * and Spatie validation kicks in during construction.
 *
 * @category FormsSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class CreateFormPayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $slug                       Tenant-unique slug — publishes to /forms/{slug}.
     * @param  string                       $title
     * @param  string                       $kind                       season_registration / waiver_update / medical_questionnaire / feedback_survey / trial_request / custom.
     * @param  string                       $status                     draft / published / archived.
     * @param  bool                         $requiresAuthentication     When true, only logged-in tenant users can submit (staff-only forms).
     * @param  string                       $localeDefault
     * @param  array                        $localesAvailable           Array of BCP-47 locale codes the form supports (matches FormVersion label bundles).
     * @param  int                          $submissionCount            Denormalized count for admin list view.
     * @param  ?string                      $description
     * @param  ?string                      $publishedVersionId         The currently-live FormVersion.
     * @param  ?string                      $handoffSlug                Registered #[AsFormHandoff] slug — e.
     * @param  ?array                       $handoffConfig              Handoff-specific configuration.
     * @param  ?string                      $opensAt                    Public URL becomes reachable at this timestamp.
     * @param  ?string                      $closesAt                   Public URL stops accepting submissions.
     * @param  ?string                      $publicUrlSignature         Signed URL segment.
     * @param  ?array                       $brandingSnapshot           Snapshot of tenant branding at last publish (logo, primary color, favicon).
     * @param  ?array                       $settings                   Per-form settings — save_and_resume_enabled, session_ttl_hours, honeypot_field_name, redirect_url_on_success, email_noti...
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $tenantId,

        #[StringType]
        public string $slug,

        #[StringType]
        public string $title,

        #[StringType]
        public string $kind,

        #[StringType]
        public string $status,

        public bool $requiresAuthentication,

        #[StringType]
        public string $localeDefault,

        public array $localesAvailable,

        public int $submissionCount,

        #[StringType]
        public ?string $description = null,

        #[StringType]
        public ?string $publishedVersionId = null,

        #[StringType]
        public ?string $handoffSlug = null,

        public ?array $handoffConfig = null,

        #[StringType]
        public ?string $opensAt = null,

        #[StringType]
        public ?string $closesAt = null,

        #[StringType]
        public ?string $publicUrlSignature = null,

        public ?array $brandingSnapshot = null,

        public ?array $settings = null,

        public ?array $metadata = null,
    ) {
    }
}
