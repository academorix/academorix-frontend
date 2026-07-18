<?php

declare(strict_types=1);

namespace Academorix\Application\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\ArrayType;
use Spatie\LaravelData\Attributes\Validation\BooleanType;
use Spatie\LaravelData\Attributes\Validation\IntegerType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Attributes\Validation\Url;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Optional;

/**
 * Validated PATCH payload for `PATCH /api/v1/business-types/{id}`.
 *
 * Tenant-custom rows only — the policy refuses `is_system: true`
 * updates regardless of caller permission.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class UpdateBusinessTypeRequestData extends Data
{
    /**
     * @param  Optional|string  $label
     * @param  Optional|string|null  $description
     * @param  Optional|string|null  $icon
     * @param  Optional|string|null  $heroImageUrl
     * @param  Optional|int    $sortOrder
     * @param  Optional|bool   $isVisible
     * @param  Optional|array<string, array<string, string>>|null  $translations
     */
    public function __construct(
        #[StringType, Min(1), Max(200)]
        public Optional|string $label = new Optional(),

        #[StringType]
        public Optional|string|null $description = new Optional(),

        #[StringType, Max(100)]
        public Optional|string|null $icon = new Optional(),

        #[StringType, Url, Max(500)]
        public Optional|string|null $heroImageUrl = new Optional(),

        #[IntegerType, Min(0), Max(999)]
        public Optional|int $sortOrder = new Optional(),

        #[BooleanType]
        public Optional|bool $isVisible = new Optional(),

        #[ArrayType]
        public Optional|array|null $translations = new Optional(),
    ) {
    }
}
