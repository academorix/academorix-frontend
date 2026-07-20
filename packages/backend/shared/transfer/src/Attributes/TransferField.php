<?php

declare(strict_types=1);

namespace Academorix\Transfer\Attributes;

use Attribute;

/**
 * Declares a column that participates in BOTH imports AND exports.
 *
 * `IS_REPEATABLE` — a model may carry many `#[TransferField]` attributes.
 * Equivalent to declaring paired `#[ImportField]` + `#[ExportField]`
 * attributes with matching `name` / `header` — kept as a single
 * attribute for concision on the common case.
 *
 * ## Example
 *
 * ```php
 * #[TransferField(name: 'email', header: 'Email', importRequired: true)]
 * #[TransferField(name: 'name', header: 'Name')]
 * final class Athlete extends Model {}
 * ```
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS | Attribute::IS_REPEATABLE)]
final readonly class TransferField
{
    /**
     * @param  string        $name              Column / accessor name.
     * @param  string|null   $header            Human-readable header (used for both sides).
     * @param  bool          $importRequired    Marks the column required on the import side.
     * @param  bool          $importUnique      Marks the column unique on the import side.
     * @param  string|null   $lookup            FK lookup path (import-only).
     * @param  list<string>  $rules             Import-side validation rules.
     * @param  bool          $exportComputed    Marks the column an accessor on the export side.
     * @param  string|null   $exportFormat      PhpSpreadsheet format code on the export side.
     * @param  bool          $sensitive         Redact on both sides.
     */
    public function __construct(
        public string $name,
        public ?string $header = null,
        public bool $importRequired = false,
        public bool $importUnique = false,
        public ?string $lookup = null,
        public array $rules = [],
        public bool $exportComputed = false,
        public ?string $exportFormat = null,
        public bool $sensitive = false,
    ) {
    }
}
