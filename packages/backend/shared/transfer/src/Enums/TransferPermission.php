<?php

declare(strict_types=1);

namespace Stackra\Transfer\Enums;

use Stackra\Authorization\Contracts\PermissionEnum;
use Stackra\Authorization\Enums\Guard;
use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Permissions the Transfer module contributes.
 *
 * Dual-guard: tenant users manage their own imports / exports; platform
 * admins observe cross-tenant activity for support triage. Per-entity
 * permissions (e.g. `athletes.import`) belong to each domain module —
 * they compose with these via `requiredPermission` on the
 * `#[Importable]` / `#[Exportable]` attribute.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum TransferPermission: string implements PermissionEnum
{
    use Enum;

    /**
     * `transfer.viewAny` — list xfer_jobs (scoped to caller).
     */
    #[Label('List transfer jobs')]
    #[Description('List xfer_jobs. Scope is applied at query — regular users see their own only.')]
    case ViewAny = 'transfer.viewAny';

    /**
     * `transfer.view` — show one xfer_job.
     */
    #[Label('View transfer job')]
    #[Description('Show one xfer_job with its shards + artifacts.')]
    case View = 'transfer.view';

    /**
     * `transfer.imports.run` — initiate imports.
     */
    #[Label('Run imports')]
    #[Description('Initiate imports. Composed with per-entity <entity>.import at policy time.')]
    case ImportsRun = 'transfer.imports.run';

    /**
     * `transfer.exports.run` — initiate exports.
     */
    #[Label('Run exports')]
    #[Description('Initiate exports. Composed with per-entity <entity>.export at policy time.')]
    case ExportsRun = 'transfer.exports.run';

    /**
     * `transfer.samples.generate` — generate sample data.
     */
    #[Label('Generate sample data')]
    #[Description('Generate sample data. Dev / demo only — seeded on admin roles only.')]
    case SamplesGenerate = 'transfer.samples.generate';

    /**
     * `transfer.cancel` — cancel own queued / running job.
     */
    #[Label('Cancel transfer job')]
    #[Description('Cancel own queued / running xfer_job.')]
    case Cancel = 'transfer.cancel';

    /**
     * `transfer.retryShard` — retry a failed shard.
     */
    #[Label('Retry shard')]
    #[Description('Retry a failed shard against a persisted source file.')]
    case RetryShard = 'transfer.retryShard';

    /**
     * `transfer.download` — download the result / errors artifact via signed URL.
     */
    #[Label('Download artifact')]
    #[Description('Download result / errors artifact via signed URL.')]
    case Download = 'transfer.download';

    /**
     * `transfer.entities.viewAny` — list capabilities.
     */
    #[Label('List transfer entities')]
    #[Description('List every entity the caller can import / export / sample given permissions + feature toggles.')]
    case EntitiesViewAny = 'transfer.entities.viewAny';

    /**
     * `transfer.entities.view` — show a single entity's capabilities.
     */
    #[Label('View transfer entity')]
    #[Description('Full detail for one entity: field map, formats, permissions, defaults.')]
    case EntitiesView = 'transfer.entities.view';

    /**
     * `transfer.templates.download` — download empty templates.
     */
    #[Label('Download template')]
    #[Description('Download empty templates. Headers reflect the entity #[ImportField] map + locale.')]
    case TemplatesDownload = 'transfer.templates.download';

    /**
     * `transfer.mapping-profiles.viewAny` — list mapping profiles.
     */
    #[Label('List mapping profiles')]
    #[Description('List saved header-remap profiles the caller may re-use.')]
    case MappingProfilesViewAny = 'transfer.mapping-profiles.viewAny';

    /**
     * `transfer.mapping-profiles.view` — show one mapping profile.
     */
    #[Label('View mapping profile')]
    #[Description('Show one saved header-remap profile.')]
    case MappingProfilesView = 'transfer.mapping-profiles.view';

    /**
     * `transfer.mapping-profiles.create` — create a mapping profile.
     */
    #[Label('Create mapping profile')]
    #[Description('Create a saved header-remap profile.')]
    case MappingProfilesCreate = 'transfer.mapping-profiles.create';

    /**
     * `transfer.mapping-profiles.update` — update a mapping profile.
     */
    #[Label('Update mapping profile')]
    #[Description('Update a saved header-remap profile.')]
    case MappingProfilesUpdate = 'transfer.mapping-profiles.update';

    /**
     * `transfer.mapping-profiles.delete` — delete a mapping profile.
     */
    #[Label('Delete mapping profile')]
    #[Description('Delete a saved header-remap profile.')]
    case MappingProfilesDelete = 'transfer.mapping-profiles.delete';

    /**
     * `transfer.mapping-profiles.share` — mark a mapping profile as tenant-wide.
     */
    #[Label('Share mapping profile')]
    #[Description('Mark a mapping profile as tenant-wide shared. Also gated by entitlement transfer.can_share_mapping_profiles.')]
    case MappingProfilesShare = 'transfer.mapping-profiles.share';

    /**
     * `platform.transfer.viewAny` — cross-tenant list for support triage.
     */
    #[Label('Platform: list transfer jobs')]
    #[Description('Cross-tenant xfer_jobs list for support triage.')]
    case PlatformViewAny = 'platform.transfer.viewAny';

    /**
     * `platform.transfer.view` — cross-tenant show for support triage.
     */
    #[Label('Platform: view transfer job')]
    #[Description('Cross-tenant xfer_job show for support triage.')]
    case PlatformView = 'platform.transfer.view';

    /**
     * The Laravel guard this permission binds to.
     */
    public function guard(): Guard
    {
        return match ($this) {
            self::PlatformViewAny, self::PlatformView => Guard::PlatformAdmin,
            default => Guard::Sanctum,
        };
    }
}
