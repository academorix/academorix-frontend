<?php

declare(strict_types=1);

namespace Academorix\Transfer\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Lifecycle state of an `xfer_shards` row.
 *
 * ## Cases
 *
 *  * {@see self::Queued}    — shard row created; worker has not started.
 *  * {@see self::Running}   — worker is executing this shard.
 *  * {@see self::Succeeded} — the shard finished without a fatal error.
 *  * {@see self::Failed}    — the shard raised a fatal error.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum XferShardStatus: string
{
    use Enum;

    /**
     * Queued — the shard has been created but no worker has started.
     */
    #[Label('Queued')]
    #[Description('Shard row created; worker has not started.')]
    case Queued = 'queued';

    /**
     * Running — a worker is executing this shard.
     */
    #[Label('Running')]
    #[Description('A worker is executing this shard.')]
    case Running = 'running';

    /**
     * Succeeded — shard finished without a fatal error.
     */
    #[Label('Succeeded')]
    #[Description('Shard finished without a fatal error.')]
    case Succeeded = 'succeeded';

    /**
     * Failed — shard raised a fatal error.
     */
    #[Label('Failed')]
    #[Description('Shard raised a fatal error.')]
    case Failed = 'failed';

    /**
     * Whether the status is terminal (no further transitions).
     */
    public function isTerminal(): bool
    {
        return $this === self::Succeeded || $this === self::Failed;
    }
}
