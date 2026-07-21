<?php

/**
 * @file packages/architecture/src/Attributes/Service.php
 *
 * @description
 * Marker attribute: this class is a SERVICE — a business-logic
 * orchestrator that talks to Repositories (and other Services)
 * but never to Models directly.
 *
 * ## Contract
 *
 *   - MAY inject: Repositories, other Services, Actions, DTOs,
 *     Enums, plain-value objects.
 *   - MUST NOT import: Model classes (domain layer). Enforced by
 *     {@see \Stackra\Architecture\Rules\NoDirectModelAccessRule}.
 *
 * ## Usage
 *
 * ```php
 * use Stackra\Architecture\Attributes\Service;
 *
 * #[Service]
 * final class InvoiceService
 * {
 *     public function __construct(
 *         private readonly InvoiceRepository $invoices,
 *         private readonly PaymentService    $payments,
 *     ) {}
 *
 *     public function chargeFor(int $invoiceId): void
 *     {
 *         $invoice = $this->invoices->findOrFail($invoiceId);
 *         $this->payments->charge($invoice);
 *     }
 * }
 * ```
 *
 * @see \Stackra\Architecture\Contracts\Service  Interface alternative.
 */

declare(strict_types=1);

namespace Stackra\Architecture\Attributes;

use Attribute;

/**
 * Marker attribute — carries no payload.
 *
 * @final
 */
#[Attribute(Attribute::TARGET_CLASS)]
final class Service
{
    public function __construct()
    {
        // Intentionally empty — marker attribute.
    }
}
