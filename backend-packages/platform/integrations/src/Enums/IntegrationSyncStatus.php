<?php

declare(strict_types=1);

namespace Academorix\Integrations\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Outcome of the most recent {@see \Academorix\Integrations\Jobs\SyncIntegrationJob}
 * run against a given integration.
 *
 * ## Cases
 *
 *  * {@see self::Unknown} — no sync has run yet (default on create).
 *  * {@see self::Success} — the last sync completed cleanly.
 *  * {@see self::Partial} — the last sync completed but some records
 *    were skipped (rate limits, per-row validation errors).
 *  * {@see self::Failed}  — the last sync raised — {@see \Academorix\Integrations\Events\IntegrationSyncFailed}
 *    carries the error string.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum IntegrationSyncStatus: string
{
    use Enum;

    #[Label('Unknown')]
    #[Description('No sync has run yet against this integration.')]
    case Unknown = 'unknown';

    #[Label('Success')]
    #[Description('The last sync completed cleanly with no skipped rows.')]
    case Success = 'success';

    #[Label('Partial')]
    #[Description('The last sync completed but some rows were skipped due to rate limits or per-row validation errors.')]
    case Partial = 'partial';

    #[Label('Failed')]
    #[Description('The last sync raised. The `last_sync_error` column carries the error message.')]
    case Failed = 'failed';
}
