<?php

declare(strict_types=1);

namespace Stackra\Audit\Attributes;

use Attribute;

/**
 * Marker attribute — declares a model class as audit-eligible AND
 * carries the list of fields that should be KMS-envelope-encrypted at
 * rest inside the `audits.old_values` / `audits.new_values` JSONB.
 *
 * ## Example
 *
 * ```php
 * #[Auditable(encryptFields: ['ssn', 'medical_notes', 'passport_number'])]
 * final class Athlete extends Model
 * {
 *     use HasAudit;
 * }
 * ```
 *
 * At app boot, the framework's generic
 * {@see \Stackra\ServiceProvider\Bootstrappers\HydrationBootstrapper}
 * scans every class carrying this attribute and hands each hit through
 * {@see \Stackra\Audit\Contracts\Services\AuditRegistryInterface::register()}
 * (declared with `#[HydratesFrom(Auditable::class)]`). The
 * `EncryptedAuditValueCast` looks up the resulting encrypt-field list
 * at cast time — fields on it are transparently ciphered before
 * persistence and deciphered on retrieval.
 *
 * ## Why an attribute (not an interface)?
 *
 * Two consumers care about this metadata: the cast (at runtime) and
 * the hydration pump (at boot). An attribute is discoverable without
 * instantiating the class — the composer manifest yields every FQCN
 * + its attribute values at zero cost, so the cast can skip
 * Eloquent's own resolution machinery when a field isn't on the list.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class Auditable
{
    /**
     * @param  list<string>  $encryptFields  Field names on the
     *   composing model whose values should be KMS-envelope-encrypted
     *   before they are written to `audits.old_values` /
     *   `audits.new_values`. Names match the model's Eloquent
     *   attribute keys, NOT the DB column names — the mapping runs
     *   through owen-it's own attribute resolution.
     * @param  bool  $chainEnabled  When `false`, the row-level
     *   tamper-evident chain is skipped for this model regardless of
     *   the tenant's entitlement. Rare — use for high-volume audit
     *   sources (bulk imports) where the chain would 10x the write
     *   cost without measurable compliance benefit.
     */
    public function __construct(
        public array $encryptFields = [],
        public bool $chainEnabled = true,
    ) {
    }
}
