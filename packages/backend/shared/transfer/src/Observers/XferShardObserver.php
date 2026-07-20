<?php

declare(strict_types=1);

namespace Academorix\Transfer\Observers;

use Academorix\Transfer\Contracts\Data\XferShardInterface;
use Academorix\Transfer\Enums\XferShardStatus;
use Academorix\Transfer\Models\XferShard;

/**
 * Observer for {@see XferShard}.
 *
 * MVP shape — the full impl (per blueprint) propagates counters
 * atomically into the parent XferJob and fires
 * `XferJobShardCompleted` on terminal transitions.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class XferShardObserver
{
    /**
     * Populate defaults on `creating`.
     */
    public function creating(XferShard $shard): void
    {
        if ($shard->{XferShardInterface::ATTR_STATUS} === null) {
            $shard->{XferShardInterface::ATTR_STATUS} = XferShardStatus::Queued->value;
        }

        if ($shard->{XferShardInterface::ATTR_COUNTERS} === null) {
            $shard->{XferShardInterface::ATTR_COUNTERS} = [
                'total'   => 0,
                'created' => 0,
                'updated' => 0,
                'skipped' => 0,
                'failed'  => 0,
            ];
        }
    }
}
