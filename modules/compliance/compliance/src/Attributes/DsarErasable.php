<?php

declare(strict_types=1);

namespace Academorix\Compliance\Attributes;

use Attribute;

/**
 * Register a model class as DSAR-erasable.
 *
 * Every `#[DsarExportable]` model SHOULD also be `#[DsarErasable]`
 * unless a regulatory retention prevents deletion (tax receipts
 * under 7-year retention, healthcare records under HIPAA). Erase
 * strategy decides what "delete" actually means for this class.
 *
 * ```php
 * #[DsarErasable(
 *     subject: 'owner_id',
 *     strategy: 'anonymize',
 *     retain_shell: true,
 *     on_legal_hold: 'skip',
 * )]
 * final class Comment extends Model
 * {
 * }
 * ```
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class DsarErasable
{
    /**
     * @param  string       $subject         Column pointing at the subject id.
     * @param  string|null  $subjectType     Polymorphic morph type column when applicable.
     * @param  string       $strategy        `hard_delete` / `anonymize` / `soft_delete`.
     * @param  bool         $retainShell     Keep a stub row after hard-delete for referential integrity.
     * @param  int          $priority        Erasure order; higher runs LAST.
     * @param  string       $onLegalHold     `refuse` / `skip` / `flag` when subject is held.
     */
    public function __construct(
        public string $subject,
        public ?string $subjectType = null,
        public string $strategy = 'anonymize',
        public bool $retainShell = false,
        public int $priority = 100,
        public string $onLegalHold = 'refuse',
    ) {
    }
}
