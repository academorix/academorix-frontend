<?php

declare(strict_types=1);

namespace Stackra\Gateway\Contracts\Services;

use Stackra\Gateway\Services\PaddleGatewayDriver;
use Illuminate\Container\Attributes\Bind;

/**
 * Paddle-specific extension of {@see PaymentGatewayInterface}.
 *
 * Paddle is a merchant-of-record provider — it handles global tax
 * collection + remittance on the platform's behalf. This interface
 * extends `PaymentGatewayInterface` with Paddle's transaction-first
 * model (Paddle has no concept of "payment intent"; every charge is
 * a `transactions` API call).
 *
 * Concrete: {@see PaddleGatewayDriver}.
 *
 * @category Gateway
 *
 * @since    0.1.0
 */
#[Bind(PaddleGatewayDriver::class)]
interface PaddleGatewayDriverInterface extends PaymentGatewayInterface
{
    /**
     * Retrieve the tax rate Paddle applied for a specific transaction.
     * Used by finance/tax to reconcile the platform-observed tax on
     * every settlement.
     *
     * @return array{tax_minor: int, tax_rate_percent: float, jurisdiction: string}
     */
    public function retrieveTaxBreakdown(string $providerIntentId): array;
}
