<?php

declare(strict_types=1);

namespace Stackra\PlatformFormsSdk\Payloads\Forms;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Optional;

/**
 * Wire-visible write payload for `PATCH /api/v1/forms/{id}` (or the
 * tenant-scoped equivalent).
 *
 * Partial-update semantics — every property is typed
 * `T|Optional|null` with an `Optional` sentinel default. Spatie
 * Data's `toArray()` strips `Optional` values, so unmentioned fields
 * are never emitted (never clear server-side state). Pass `null`
 * explicitly to clear a nullable column.
 *
 * @category FormsSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class UpdateFormPayload extends Data
{
    /**
     * @param  Optional|string                  $tenantId
     * @param  Optional|string                  $slug                       Tenant-unique slug — publishes to /forms/{slug}.
     * @param  Optional|string                  $title
     * @param  Optional|string|null             $description
     * @param  Optional|string                  $kind                       season_registration / waiver_update / medical_questionnaire / feedback_survey / trial_request / custom.
     * @param  Optional|string                  $status                     draft / published / archived.
     * @param  Optional|string|null             $publishedVersionId         The currently-live FormVersion.
     * @param  Optional|string|null             $handoffSlug                Registered #[AsFormHandoff] slug — e.
     * @param  Optional|array|null              $handoffConfig              Handoff-specific configuration.
     * @param  Optional|string|null             $opensAt                    Public URL becomes reachable at this timestamp.
     * @param  Optional|string|null             $closesAt                   Public URL stops accepting submissions.
     * @param  Optional|bool                    $requiresAuthentication     When true, only logged-in tenant users can submit (staff-only forms).
     * @param  Optional|string|null             $publicUrlSignature         Signed URL segment.
     * @param  Optional|string                  $localeDefault
     * @param  Optional|array                   $localesAvailable           Array of BCP-47 locale codes the form supports (matches FormVersion label bundles).
     * @param  Optional|array|null              $brandingSnapshot           Snapshot of tenant branding at last publish (logo, primary color, favicon).
     * @param  Optional|int                     $submissionCount            Denormalized count for admin list view.
     * @param  Optional|array|null              $settings                   Per-form settings — save_and_resume_enabled, session_ttl_hours, honeypot_field_name, redirect_url_on_success, email_noti...
     * @param  Optional|array|null              $metadata
     */
    public function __construct(
        #[StringType]
        public Optional|string $tenantId = new Optional(),

        #[StringType]
        public Optional|string $slug = new Optional(),

        #[StringType]
        public Optional|string $title = new Optional(),

        #[StringType]
        public Optional|string|null $description = new Optional(),

        #[StringType]
        public Optional|string $kind = new Optional(),

        #[StringType]
        public Optional|string $status = new Optional(),

        #[StringType]
        public Optional|string|null $publishedVersionId = new Optional(),

        #[StringType]
        public Optional|string|null $handoffSlug = new Optional(),

        public Optional|array|null $handoffConfig = new Optional(),

        #[StringType]
        public Optional|string|null $opensAt = new Optional(),

        #[StringType]
        public Optional|string|null $closesAt = new Optional(),

        public Optional|bool $requiresAuthentication = new Optional(),

        #[StringType]
        public Optional|string|null $publicUrlSignature = new Optional(),

        #[StringType]
        public Optional|string $localeDefault = new Optional(),

        public Optional|array $localesAvailable = new Optional(),

        public Optional|array|null $brandingSnapshot = new Optional(),

        public Optional|int $submissionCount = new Optional(),

        public Optional|array|null $settings = new Optional(),

        public Optional|array|null $metadata = new Optional(),
    ) {
    }
}
