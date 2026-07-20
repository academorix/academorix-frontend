<?php

declare(strict_types=1);

namespace Academorix\Compliance\Database\Factories;

use Academorix\Compliance\Contracts\Data\ConsentRecordInterface;
use Academorix\Compliance\Enums\ConsentDecision;
use Academorix\Compliance\Models\ConsentRecord;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see ConsentRecord}.
 *
 * @extends Factory<ConsentRecord>
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
final class ConsentRecordFactory extends Factory
{
    /**
     * @var class-string<ConsentRecord>
     */
    protected $model = ConsentRecord::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            ConsentRecordInterface::ATTR_ID                  => 'cns_' . Str::ulid()->toBase32(),
            ConsentRecordInterface::ATTR_TENANT_ID           => 'ten_' . Str::ulid()->toBase32(),
            ConsentRecordInterface::ATTR_CONSENT_CATEGORY_ID => 'ccg_' . Str::ulid()->toBase32(),
            ConsentRecordInterface::ATTR_CATEGORY_KEY        => 'marketing',
            ConsentRecordInterface::ATTR_SUBJECT_TYPE        => 'App\\Models\\User',
            ConsentRecordInterface::ATTR_SUBJECT_ID          => 'usr_' . Str::ulid()->toBase32(),
            ConsentRecordInterface::ATTR_DECISION            => ConsentDecision::Granted->value,
            ConsentRecordInterface::ATTR_RECORDED_AT         => \now(),
            ConsentRecordInterface::ATTR_SOURCE              => 'ui',
        ];
    }

    /**
     * Withdrawn state.
     */
    public function withdrawn(): static
    {
        return $this->state(fn (): array => [
            ConsentRecordInterface::ATTR_DECISION => ConsentDecision::Withdrawn->value,
        ]);
    }
}
