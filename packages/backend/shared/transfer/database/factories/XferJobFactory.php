<?php

declare(strict_types=1);

namespace Academorix\Transfer\Database\Factories;

use Academorix\Transfer\Contracts\Data\XferJobInterface;
use Academorix\Transfer\Enums\XferJobStatus;
use Academorix\Transfer\Enums\XferKind;
use Academorix\Transfer\Models\XferJob;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see XferJob}.
 *
 * @extends Factory<XferJob>
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class XferJobFactory extends Factory
{
    /**
     * @var class-string<XferJob>
     */
    protected $model = XferJob::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            XferJobInterface::ATTR_ID          => 'xjb_' . Str::ulid()->toBase32(),
            XferJobInterface::ATTR_TENANT_ID   => 'ten_' . Str::ulid()->toBase32(),
            XferJobInterface::ATTR_KIND        => XferKind::Import->value,
            XferJobInterface::ATTR_ENTITY_KEY  => 'athletes',
            XferJobInterface::ATTR_STATUS      => XferJobStatus::Queued->value,
            XferJobInterface::ATTR_COUNTERS    => [
                'total' => 0, 'created' => 0, 'updated' => 0, 'skipped' => 0, 'failed' => 0, 'deleted' => 0,
            ],
        ];
    }
}
