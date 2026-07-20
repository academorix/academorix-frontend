<?php

declare(strict_types=1);

namespace Academorix\Audit\Database\Factories;

use Academorix\Audit\Contracts\Data\AuditInterface;
use Academorix\Audit\Models\Audit;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for our extended {@see Audit} model.
 *
 * Produces a row shaped like an update event on an anonymous
 * auditable. Callers use factory states (`->created()`, `->deleted()`,
 * `->platform()`) for the common test variants.
 *
 * @extends Factory<Audit>
 *
 * @category Audit
 *
 * @since    0.1.0
 */
final class AuditFactory extends Factory
{
    /**
     * @var class-string<Audit>
     */
    protected $model = Audit::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            AuditInterface::ATTR_ID             => 'aud_' . Str::ulid()->toBase32(),
            AuditInterface::ATTR_TENANT_ID      => 'ten_' . Str::ulid()->toBase32(),
            AuditInterface::ATTR_USER_TYPE      => null,
            AuditInterface::ATTR_USER_ID        => null,
            AuditInterface::ATTR_EVENT          => 'updated',
            AuditInterface::ATTR_AUDITABLE_TYPE => 'App\\Models\\ExampleAggregate',
            AuditInterface::ATTR_AUDITABLE_ID   => 'exa_' . Str::ulid()->toBase32(),
            AuditInterface::ATTR_OLD_VALUES     => ['name' => 'old'],
            AuditInterface::ATTR_NEW_VALUES     => ['name' => 'new'],
            AuditInterface::ATTR_URL            => 'http://localhost/api/v1/example',
            AuditInterface::ATTR_IP_ADDRESS     => '127.0.0.1',
            AuditInterface::ATTR_USER_AGENT     => 'PestFactory/1.0',
            AuditInterface::ATTR_TAGS           => null,
        ];
    }

    /**
     * `created` event variant.
     */
    public function created(): static
    {
        return $this->state(fn (): array => [
            AuditInterface::ATTR_EVENT      => 'created',
            AuditInterface::ATTR_OLD_VALUES => null,
            AuditInterface::ATTR_NEW_VALUES => ['name' => 'new'],
        ]);
    }

    /**
     * `deleted` event variant.
     */
    public function deleted(): static
    {
        return $this->state(fn (): array => [
            AuditInterface::ATTR_EVENT      => 'deleted',
            AuditInterface::ATTR_OLD_VALUES => ['name' => 'old'],
            AuditInterface::ATTR_NEW_VALUES => null,
        ]);
    }

    /**
     * Platform-plane row (tenant_id NULL).
     */
    public function platform(): static
    {
        return $this->state(fn (): array => [
            AuditInterface::ATTR_TENANT_ID => null,
        ]);
    }
}
