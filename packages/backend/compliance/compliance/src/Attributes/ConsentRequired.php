<?php

declare(strict_types=1);

namespace Stackra\Compliance\Attributes;

use Attribute;

/**
 * Marks an action or class as gated on a specific consent category.
 *
 * Enforced by the
 * {@see \Stackra\Compliance\Middleware\ConsentGateMiddleware}
 * on routes and by the `ConsentGate` facade at method entry.
 * Requests / jobs targeting a subject without the required consent
 * get a `ConsentRequiredException` mapped to HTTP 451.
 *
 * ```php
 * #[ConsentRequired(category: 'marketing', subject: 'recipient')]
 * final class SendMarketingEmailJob
 * {
 *     public function handle(User $recipient): void { … }
 * }
 * ```
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS | Attribute::TARGET_METHOD)]
final readonly class ConsentRequired
{
    /**
     * @param  string  $category    Consent category key. Must match `consent_categories`.
     * @param  string  $subject     Argument or property name pointing at the subject id.
     * @param  string  $failAction  `throw` / `skip` / `log` on missing consent.
     */
    public function __construct(
        public string $category,
        public string $subject = 'recipient',
        public string $failAction = 'throw',
    ) {
    }
}
