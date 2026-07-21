<?php

declare(strict_types=1);

namespace Stackra\Domains\Database\Factories;

use Stackra\Domains\Contracts\Data\DomainInterface;
use Stackra\Domains\Enums\DomainKind;
use Stackra\Domains\Enums\DomainVerificationMethod;
use Stackra\Domains\Enums\SslStatus;
use Stackra\Domains\Models\Domain;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see Domain}.
 *
 * @extends Factory<Domain>
 *
 * @category Domains
 *
 * @since    0.1.0
 */
final class DomainFactory extends Factory
{
    /**
     * @var class-string<Domain>
     */
    protected $model = Domain::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $slug = 'tenant-' . Str::random(8);

        return [
            DomainInterface::ATTR_ID                  => 'dom_' . Str::ulid()->toBase32(),
            DomainInterface::ATTR_APPLICATION_ID      => 'app_' . Str::ulid()->toBase32(),
            DomainInterface::ATTR_TENANT_ID           => 'ten_' . Str::ulid()->toBase32(),
            DomainInterface::ATTR_HOST                => $slug . '.stackra.app',
            DomainInterface::ATTR_KIND                => DomainKind::Subdomain->value,
            DomainInterface::ATTR_IS_PRIMARY          => true,
            DomainInterface::ATTR_VERIFICATION_TOKEN  => \bin2hex(\random_bytes(16)),
            DomainInterface::ATTR_VERIFICATION_METHOD => DomainVerificationMethod::DnsTxt->value,
            DomainInterface::ATTR_SSL_STATUS          => SslStatus::Pending->value,
        ];
    }

    public function verified(): static
    {
        return $this->state(fn (): array => [
            DomainInterface::ATTR_VERIFIED_AT => \Carbon\CarbonImmutable::now(),
        ]);
    }

    public function custom(): static
    {
        return $this->state(fn (): array => [
            DomainInterface::ATTR_KIND       => DomainKind::Custom->value,
            DomainInterface::ATTR_IS_PRIMARY => false,
        ]);
    }

    public function issued(): static
    {
        return $this->state(fn (): array => [
            DomainInterface::ATTR_SSL_STATUS     => SslStatus::Issued->value,
            DomainInterface::ATTR_SSL_ISSUED_AT  => \Carbon\CarbonImmutable::now(),
            DomainInterface::ATTR_SSL_EXPIRES_AT => \Carbon\CarbonImmutable::now()->addDays(90),
        ]);
    }
}
