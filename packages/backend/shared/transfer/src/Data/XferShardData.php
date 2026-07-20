<?php

declare(strict_types=1);

namespace Academorix\Transfer\Data;

use Academorix\Transfer\Contracts\Data\XferShardInterface;
use Academorix\Transfer\Models\XferShard;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see XferShard}.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class XferShardData extends Data
{
    /**
     * @param  string  $id         Prefixed ULID `xshd_<26>`.
     * @param  string  $xferJobId  Parent job id.
     * @param  int     $index      Shard ordinal.
     * @param  string  $status     Shard lifecycle state.
     */
    public function __construct(
        public string $id,
        public string $xferJobId,
        public int $index,
        public string $status,
    ) {
    }

    /**
     * Build the DTO from a model.
     */
    public static function fromModel(XferShard $shard): self
    {
        return new self(
            id: (string) $shard->getKey(),
            xferJobId: (string) $shard->{XferShardInterface::ATTR_XFER_JOB_ID},
            index: (int) $shard->{XferShardInterface::ATTR_INDEX},
            status: (string) $shard->{XferShardInterface::ATTR_STATUS}?->value,
        );
    }
}
