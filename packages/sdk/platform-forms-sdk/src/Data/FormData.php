<?php

declare(strict_types=1);

namespace Academorix\PlatformFormsSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\Form}.
 *
 * Mirrors `schemas/form.schema.json` column-for-column, minus
 * the fields declared under `x-wire.hidden` which never leave the
 * server. Wire format is snake_case; PHP property names are
 * camelCase — the `SnakeCaseMapper` bridges the two.
 *
 * ## What this DTO owns
 *
 * A read-only, immutable projection of the row as the
 * Platform service emits it. Consumers never instantiate
 * this DTO by hand — the SDK's request classes hydrate it from the
 * response envelope inside `createDtoFromResponse()`.
 *
 * ## Example
 *
 * ```php
 * use Academorix\PlatformSdk\Client\PlatformSdk;
 *
 * $row = app(PlatformSdk::class)->forms()->forms()->show($id);
 * ```
 *
 * @category FormsSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class FormData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $slug                       Tenant-unique slug — publishes to /forms/{slug}.
     * @param  string                       $title
     * @param  string                       $kind                       season_registration / waiver_update / medical_questionnaire / feedback_survey / trial_request / custom.
     * @param  string                       $status                     draft / published / archived.
     * @param  bool                         $requiresAuthentication     When true, only logged-in tenant users can submit (staff-only forms).
     * @param  string                       $localeDefault
     * @param  array<string, mixed>         $localesAvailable           Array of BCP-47 locale codes the form supports (matches FormVersion label bundles).
     * @param  int                          $submissionCount            Denormalized count for admin list view.
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $description
     * @param  ?string                      $publishedVersionId         The currently-live FormVersion.
     * @param  ?string                      $handoffSlug                Registered #[AsFormHandoff] slug — e.
     * @param  array<string, mixed>|null    $handoffConfig              Handoff-specific configuration.
     * @param  ?string                      $opensAt                    Public URL becomes reachable at this timestamp.
     * @param  ?string                      $closesAt                   Public URL stops accepting submissions.
     * @param  ?string                      $publicUrlSignature         Signed URL segment.
     * @param  array<string, mixed>|null    $brandingSnapshot           Snapshot of tenant branding at last publish (logo, primary color, favicon).
     * @param  array<string, mixed>|null    $settings                   Per-form settings — save_and_resume_enabled, session_ttl_hours, honeypot_field_name, redirect_url_on_success, email_noti...
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $createdBy
     * @param  ?string                      $updatedBy
     * @param  ?string                      $deletedBy
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $slug,
        public string $title,
        public string $kind,
        public string $status,
        public bool $requiresAuthentication,
        public string $localeDefault,
        public array $localesAvailable,
        public int $submissionCount,
        public string $createdAt,
        public string $updatedAt,
        public ?string $description = null,
        public ?string $publishedVersionId = null,
        public ?string $handoffSlug = null,
        public ?array $handoffConfig = null,
        public ?string $opensAt = null,
        public ?string $closesAt = null,
        public ?string $publicUrlSignature = null,
        public ?array $brandingSnapshot = null,
        public ?array $settings = null,
        public ?array $metadata = null,
        public ?string $createdBy = null,
        public ?string $updatedBy = null,
        public ?string $deletedBy = null,
        public ?string $deletedAt = null,
    ) {
    }

    /**
     * Hydrate from a raw wire record (already unwrapped from the
     * `{ "data": ... }` envelope).
     *
     * @param  array<string, mixed>  $row  The raw snake_case record.
     * @return self                        The hydrated DTO.
     */
    public static function fromRecord(array $row): self
    {
        // Delegate to Spatie Data's canonical hydration path so
        // `#[MapInputName]` fires and every property is normalised
        // through the same mapper the response-side uses.
        return self::from($row);
    }
}
