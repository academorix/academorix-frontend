<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Kind of a {@see \Stackra\Tenancy\Models\TenantContact}.
 *
 * ## Cases
 *
 *  * {@see self::Billing}   — receives invoices + payment failure notifications.
 *  * {@see self::Legal}     — receives MSA + legal notices. Requires verified_at before primary.
 *  * {@see self::Technical} — technical liaison for integrations + incidents.
 *  * {@see self::Dpo}       — Data Protection Officer (GDPR Art. 30 ROPA). Requires verified_at.
 *  * {@see self::Security}  — security escalation contact (breach notification).
 *  * {@see self::Support}   — day-to-day support contact.
 *  * {@see self::Owner}     — the tenant's operational owner (may differ from billing).
 *
 * At most one primary per `(tenant_id, kind)` is enforced by a
 * partial unique index. The `dpo` and `legal` kinds require
 * `verified_at` before they can be marked primary — enforced by
 * `TenantContactObserver::saving()`.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum TenantContactKind: string
{
    use Enum;

    /**
     * Billing contact — receives invoices + payment failure notifications.
     */
    #[Label('Billing')]
    #[Description('Receives invoices + payment failure notifications. Address collected for VAT / sales-tax purposes.')]
    case Billing = 'billing';

    /**
     * Legal contact — receives MSA amendments + legal notices.
     */
    #[Label('Legal')]
    #[Description('Receives MSA amendments + legal notices. Requires verified_at before promotion to primary.')]
    case Legal = 'legal';

    /**
     * Technical contact — integrations + incident liaison.
     */
    #[Label('Technical')]
    #[Description('Technical liaison for integrations + incident coordination.')]
    case Technical = 'technical';

    /**
     * Data Protection Officer — GDPR Art. 30 requirement.
     */
    #[Label('Data Protection Officer')]
    #[Description('Data Protection Officer. GDPR Art. 30 (Records of Processing) requires this for GDPR-subject tenants. Requires verified_at.')]
    case Dpo = 'dpo';

    /**
     * Security contact — breach notification recipient.
     */
    #[Label('Security')]
    #[Description('Security escalation contact — receives breach notifications + incident reports.')]
    case Security = 'security';

    /**
     * Support contact — day-to-day operational contact.
     */
    #[Label('Support')]
    #[Description('Day-to-day support contact. Receives non-critical operational notifications.')]
    case Support = 'support';

    /**
     * Owner contact — operational owner of the tenant.
     */
    #[Label('Owner')]
    #[Description('Operational owner of the tenant. May differ from the billing contact.')]
    case Owner = 'owner';

    /**
     * Whether this kind requires `verified_at` before it can be
     * promoted to `is_primary = true`. GDPR + legal precedence
     * requires we do not blindly trust unverified DPO / legal
     * contact addresses.
     */
    public function requiresVerificationForPrimary(): bool
    {
        return match ($this) {
            self::Dpo, self::Legal => true,
            default                => false,
        };
    }
}
