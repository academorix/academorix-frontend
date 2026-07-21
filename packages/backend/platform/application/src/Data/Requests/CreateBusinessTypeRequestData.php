<?php

declare(strict_types=1);

namespace Stackra\Application\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\ArrayType;
use Spatie\LaravelData\Attributes\Validation\BooleanType;
use Spatie\LaravelData\Attributes\Validation\IntegerType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Attributes\Validation\Url;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `POST /api/v1/business-types` — creates a
 * TENANT-CUSTOM row. The action refuses `is_system: true` writes; the
 * seeder is the only sanctioned path for system rows.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreateBusinessTypeRequestData extends Data
{
    /**
     * @param  string  $slug  Tenant-scoped identifier — must not collide with a shipped enum case value.
     * @param  string  $label  Display copy.
     * @param  string|null  $description
     * @param  string|null  $icon  Iconify token.
     * @param  string|null  $heroImageUrl  RFC 3986 URL.
     * @param  int|null  $sortOrder  0-999; higher renders later.
     * @param  bool|null  $isVisible  Whether the row appears in the self-serve picker.
     * @param  array<string, array<string, string>>|null  $translations  Per-locale content.
     */
    public function __construct(
        #[StringType, Min(1), Max(64), Regex('/^[a-z][a-z0-9_]*$/')]
        public string $slug,

        #[StringType, Min(1), Max(200)]
        public string $label,

        #[StringType]
        public ?string $description = null,

        #[StringType, Max(100)]
        public ?string $icon = null,

        #[StringType, Url, Max(500)]
        public ?string $heroImageUrl = null,

        #[IntegerType, Min(0), Max(999)]
        public ?int $sortOrder = 100,

        #[BooleanType]
        public ?bool $isVisible = true,

        #[ArrayType]
        public ?array $translations = null,
    ) {
    }
}
