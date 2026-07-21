<?php

declare(strict_types=1);

namespace Stackra\Gateway\Contracts\Services;

use Stackra\Gateway\Services\CheckoutComGatewayDriver;
use Illuminate\Container\Attributes\Bind;

/**
 * Checkout.com-specific extension of {@see PaymentGatewayInterface}.
 *
 * Concrete: {@see CheckoutComGatewayDriver}.
 *
 * @category Gateway
 *
 * @since    0.1.0
 */
#[Bind(CheckoutComGatewayDriver::class)]
interface CheckoutComGatewayDriverInterface extends PaymentGatewayInterface
{
    // Checkout.com's payment model is close enough to the generic
    // PaymentGatewayInterface that no additional methods are required
    // at this milestone. Marketplace + tokenised-vaulted-card flows
    // land in a follow-up spec.
}
