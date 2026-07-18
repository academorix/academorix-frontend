<?php

declare(strict_types=1);

namespace Academorix\Settings\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\ArrayType;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for
 * `PUT /api/v1/settings/{group}` — bulk update of one group's fields.
 *
 * `values` is a map of field key → new value. Per-field validation is
 * delegated to the schema's `rules` jsonb column at write time — this
 * DTO enforces only the top-level `values` shape (map, required).
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class UpdateSettingsGroupRequestData extends Data
{
    /**
     * @param  array<string, mixed>  $values  Field key → new value.
     */
    public function __construct(
        #[Required, ArrayType]
        public array $values,
    ) {
    }
}
