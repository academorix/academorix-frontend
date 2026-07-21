<?php

declare(strict_types=1);

namespace Stackra\Integrations\Data\Requests;

use Stackra\Integrations\Enums\IntegrationKind;
use Stackra\Integrations\Rules\ValidIntegrationProvider;
use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\ArrayType;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Rule;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for
 * `PATCH /api/v1/tenant/integrations/{id}` /
 * `PATCH /api/v1/platform/tenant-integrations/{integration}`.
 *
 * Every field is optional — only supplied fields land in the update.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class UpdateIntegrationRequestData extends Data
{
    /**
     * @param  IntegrationKind|null      $kind      Category of integration.
     * @param  string|null               $provider  Provider key.
     * @param  string|null               $name      Human label.
     * @param  array<string, mixed>|null $config    Plaintext credential payload; encrypted on save.
     * @param  bool|null                 $isActive  Active flag.
     */
    public function __construct(
        #[Enum(IntegrationKind::class)]
        public ?IntegrationKind $kind = null,

        #[StringType, Max(64), Rule(new ValidIntegrationProvider())]
        public ?string $provider = null,

        #[StringType, Max(200)]
        public ?string $name = null,

        #[ArrayType]
        public ?array $config = null,

        public ?bool $isActive = null,
    ) {
    }
}
