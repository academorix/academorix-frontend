<?php

declare(strict_types=1);

namespace Academorix\Settings\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Native storage type for a settings field.
 *
 * Drives the cast layer on {@see \Academorix\Settings\Models\SettingValue}
 * and the validation rules emitted for the admin surface.
 *
 * ## Cases
 *
 *  * {@see self::String}   — free-form string. Default control: text input.
 *  * {@see self::Integer}  — 64-bit signed integer.
 *  * {@see self::Boolean}  — true / false.
 *  * {@see self::Decimal}  — decimal number with configurable precision.
 *  * {@see self::Json}     — arbitrary JSON payload (object or array).
 *  * {@see self::EnumType} — a value from a declared enum FQCN.
 *  * {@see self::Date}     — ISO-8601 date (`YYYY-MM-DD`).
 *  * {@see self::Datetime} — ISO-8601 timestamp.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum SettingType: string
{
    use Enum;

    #[Label('String')]
    #[Description('Free-form string value.')]
    case String = 'string';

    #[Label('Integer')]
    #[Description('64-bit signed integer.')]
    case Integer = 'integer';

    #[Label('Boolean')]
    #[Description('True / false toggle.')]
    case Boolean = 'boolean';

    #[Label('Decimal')]
    #[Description('Decimal number with configurable precision.')]
    case Decimal = 'decimal';

    #[Label('JSON')]
    #[Description('Arbitrary JSON payload (object or array).')]
    case Json = 'json';

    #[Label('Enum')]
    #[Description('Value drawn from a declared enum FQCN.')]
    case EnumType = 'enum';

    #[Label('Date')]
    #[Description('ISO-8601 date (YYYY-MM-DD).')]
    case Date = 'date';

    #[Label('Datetime')]
    #[Description('ISO-8601 timestamp with timezone.')]
    case Datetime = 'datetime';
}
