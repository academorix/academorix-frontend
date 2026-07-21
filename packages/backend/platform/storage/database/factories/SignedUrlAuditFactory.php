<?php

declare(strict_types=1);

namespace Stackra\Storage\Database\Factories;

use Stackra\Storage\Contracts\Data\SignedUrlAuditInterface;
use Stackra\Storage\Enums\SignedUrlPurpose;
use Stackra\Storage\Models\SignedUrlAudit;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see SignedUrlAudit}.
 *
 * @extends Factory<SignedUrlAudit>
 *
 * @category Storage
 *
 * @since    0.1.0
 */
final class SignedUrlAuditFactory extends Factory
{
    /**
     * @var class-string<SignedUrlAudit>
     */
    protected $model = SignedUrlAudit::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $now = \Carbon\CarbonImmutable::now();

        return [
            SignedUrlAuditInterface::ATTR_ID                => 'sua_' . Str::ulid()->toBase32(),
            SignedUrlAuditInterface::ATTR_FILE_ID           => 'fil_' . Str::ulid()->toBase32(),
            SignedUrlAuditInterface::ATTR_TENANT_ID         => 'ten_' . Str::ulid()->toBase32(),
            SignedUrlAuditInterface::ATTR_PURPOSE           => SignedUrlPurpose::Download->value,
            SignedUrlAuditInterface::ATTR_SIGNATURE_HASH    => \hash('sha256', Str::random(32)),
            SignedUrlAuditInterface::ATTR_TTL_SECONDS       => 3600,
            SignedUrlAuditInterface::ATTR_ISSUED_AT         => $now,
            SignedUrlAuditInterface::ATTR_EXPIRES_AT        => $now->addHour(),
            SignedUrlAuditInterface::ATTR_ONE_TIME_USE      => false,
            SignedUrlAuditInterface::ATTR_HIT_COUNT         => 0,
        ];
    }

    public function expired(): static
    {
        return $this->state(fn (): array => [
            SignedUrlAuditInterface::ATTR_ISSUED_AT  => \Carbon\CarbonImmutable::now()->subDays(2),
            SignedUrlAuditInterface::ATTR_EXPIRES_AT => \Carbon\CarbonImmutable::now()->subDay(),
        ]);
    }

    public function revoked(): static
    {
        return $this->state(fn (): array => [
            SignedUrlAuditInterface::ATTR_REVOKED_AT     => \Carbon\CarbonImmutable::now(),
            SignedUrlAuditInterface::ATTR_REVOKED_REASON => 'admin_bulk_revoke',
        ]);
    }
}
