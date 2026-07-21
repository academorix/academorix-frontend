<?php

declare(strict_types=1);

namespace Stackra\Transfer\Database\Factories;

use Stackra\Transfer\Contracts\Data\XferShardInterface;
use Stackra\Transfer\Enums\XferShardStatus;
use Stackra\Transfer\Models\XferShard;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see XferShard}.
 *
 * @extends Factory<XferShard>
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class XferShardFactory extends Factory
{
    /**
     * @var class-string<XferShard>
     */
    protected $model = XferShard::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            XferShardInterface::ATTR_ID          => 'xshd_' . Str::ulid()->toBase32(),
            XferShardInterface::ATTR_TENANT_ID   => 'ten_' . Str::ulid()->toBase32(),
            XferShardInterface::ATTR_XFER_JOB_ID => 'xjb_' . Str::ulid()->toBase32(),
            XferShardInterface::ATTR_INDEX       => 0,
            XferShardInterface::ATTR_OFFSET      => 0,
            XferShardInterface::ATTR_LIMIT       => 500,
            XferShardInterface::ATTR_STATUS      => XferShardStatus::Queued->value,
            XferShardInterface::ATTR_ATTEMPT     => 0,
        ];
    }
}
