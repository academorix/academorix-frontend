<?php

declare(strict_types=1);

namespace Stackra\Compliance\Attributes;

use Attribute;

/**
 * Declare an inline retention policy for the annotated model class.
 *
 * Overrides the module's `retention.json` when the retention runner
 * encounters conflicting values (attribute wins for the annotated
 * class only). Consumers of the RetentionPolicyResolver read this
 * attribute at boot into a registry keyed by class-string.
 *
 * ```php
 * #[RetentionPolicy(
 *     hotDays: null,
 *     coldDays: 2555,
 *     onPurge: 'archive_cold',
 *     regulatoryMinimumDays: 2555,
 * )]
 * final class TaxReceipt extends Model
 * {
 * }
 * ```
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class RetentionPolicy
{
    /**
     * @param  int|null  $hotDays               Days a non-soft-deleted row stays hot.
     * @param  int|null  $warmDays              Days a soft-deleted row stays warm before hard-purge.
     * @param  int|null  $coldDays              Days an archived_at-flagged row stays cold before terminal action.
     * @param  string    $onPurge               `hard_delete` / `anonymize` / `archive_cold`.
     * @param  int|null  $regulatoryMinimumDays Non-negotiable lower bound (tax / healthcare).
     */
    public function __construct(
        public ?int $hotDays = null,
        public ?int $warmDays = null,
        public ?int $coldDays = null,
        public string $onPurge = 'hard_delete',
        public ?int $regulatoryMinimumDays = null,
    ) {
    }
}
