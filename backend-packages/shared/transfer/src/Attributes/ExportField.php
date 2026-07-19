<?php

declare(strict_types=1);

namespace Academorix\Transfer\Attributes;

use Attribute;

/**
 * Declares an exportable column on a model.
 *
 * `IS_REPEATABLE` — a model may carry many `#[ExportField]` attributes,
 * one per column emitted to the export file.
 *
 * ## Example
 *
 * ```php
 * #[ExportField(name: 'email', header: 'Email')]
 * #[ExportField(name: 'full_name', header: 'Full name', computed: true)]
 * final class Athlete extends Model {}
 * ```
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS | Attribute::IS_REPEATABLE)]
final readonly class ExportField
{
    /**
     * @param  string       $name         Column key or accessor name on the model.
     * @param  string|null  $header       Human-readable header the writer emits.
     * @param  bool         $computed     Whether the value comes from an accessor rather than a real column.
     * @param  string|null  $format       PhpSpreadsheet format code (e.g. `'yyyy-mm-dd'`).
     * @param  int|null     $width        Fixed column width in Excel units.
     * @param  string|null  $cast         Explicit cast class-string.
     * @param  bool         $sensitive    Redact from log / error messages.
     */
    public function __construct(
        public string $name,
        public ?string $header = null,
        public bool $computed = false,
        public ?string $format = null,
        public ?int $width = null,
        public ?string $cast = null,
        public bool $sensitive = false,
    ) {
    }
}
