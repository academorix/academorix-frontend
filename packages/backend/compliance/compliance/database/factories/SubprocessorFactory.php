<?php

declare(strict_types=1);

namespace Stackra\Compliance\Database\Factories;

use Stackra\Compliance\Contracts\Data\SubprocessorInterface;
use Stackra\Compliance\Enums\SubprocessorRole;
use Stackra\Compliance\Models\Subprocessor;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see Subprocessor}.
 *
 * @extends Factory<Subprocessor>
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
final class SubprocessorFactory extends Factory
{
    /**
     * @var class-string<Subprocessor>
     */
    protected $model = Subprocessor::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            SubprocessorInterface::ATTR_ID          => 'spr_' . Str::ulid()->toBase32(),
            SubprocessorInterface::ATTR_NAME        => 'Stripe',
            SubprocessorInterface::ATTR_ROLE        => SubprocessorRole::PaymentProcessor->value,
            SubprocessorInterface::ATTR_PURPOSE     => 'Payment processing.',
            SubprocessorInterface::ATTR_DATA_CLASSES => ['email', 'billing_address'],
            SubprocessorInterface::ATTR_LOCATION    => 'US',
            SubprocessorInterface::ATTR_LEGAL_BASIS => 'contract',
            SubprocessorInterface::ATTR_ACTIVE_FROM => \now(),
            SubprocessorInterface::ATTR_VERSION     => 1,
            SubprocessorInterface::ATTR_IS_SYSTEM   => false,
        ];
    }

    /**
     * System-owned variant.
     */
    public function system(): static
    {
        return $this->state(fn (): array => [
            SubprocessorInterface::ATTR_IS_SYSTEM => true,
        ]);
    }
}
