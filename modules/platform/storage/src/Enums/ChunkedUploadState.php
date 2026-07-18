<?php

declare(strict_types=1);

namespace Academorix\Storage\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * State machine for a
 * {@see \Academorix\Storage\Models\ChunkedUpload}.
 *
 * State machine:
 * `initiating` → `uploading` → `finalizing` → `completed` |
 * `aborted` | `expired`.
 *
 * ## Cases
 *
 *  * {@see self::Initiating} — coordinator is requesting the
 *    provider handle.
 *  * {@see self::Uploading}  — client is streaming chunks.
 *  * {@see self::Finalizing} — coordinator is assembling / verifying.
 *  * {@see self::Completed}  — resulting `File` row materialised.
 *  * {@see self::Aborted}    — client cancelled or verification failed.
 *  * {@see self::Expired}    — TTL elapsed without a finalize call.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum ChunkedUploadState: string
{
    use Enum;

    #[Label('Initiating')]
    #[Description('Coordinator is requesting the provider handle.')]
    case Initiating = 'initiating';

    #[Label('Uploading')]
    #[Description('Client is streaming chunks against the provider URL.')]
    case Uploading = 'uploading';

    #[Label('Finalizing')]
    #[Description('Coordinator is assembling and verifying the full byte-range.')]
    case Finalizing = 'finalizing';

    #[Label('Completed')]
    #[Description('Upload succeeded. `resulting_file_id` points at the created File row.')]
    case Completed = 'completed';

    #[Label('Aborted')]
    #[Description('Cancelled by the client or aborted by a validator.')]
    case Aborted = 'aborted';

    #[Label('Expired')]
    #[Description('TTL elapsed without a finalize call. Chunks are dropped.')]
    case Expired = 'expired';
}
