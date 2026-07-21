<?php

declare(strict_types=1);

namespace Stackra\Integrations\Data\Requests;

use Stackra\Integrations\Enums\IntegrationKind;
use Stackra\Integrations\Rules\ValidIntegrationProvider;
use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\ArrayType;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\Rule;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for
 * `POST /api/v1/tenant/integrations` /
 * `POST /api/v1/platform/tenant-integrations`.
 *
 * `config` is the plaintext credential payload — the `IntegrationConfig`
 * cast encrypts it on save via the container-resolved cipher.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreateIntegrationRequestData extends Data
{
    /**
     * @param  IntegrationKind          $kind      Category of integration.
     * @param  string                   $provider  Provider key (allow-listed by `config('integrations.providers')`).
     * @param  string                   $name      Human label ('Okta production', 'Workday HRIS').
     * @param  array<string, mixed>     $config    Plaintext credential payload; encrypted on save.
     * @param  bool                     $isActive  Whether to enable the integration immediately.
     */
    public function __construct(
        #[Required, Enum(IntegrationKind::class)]
        public IntegrationKind $kind,

        #[Required, StringType, Max(64), Rule(new ValidIntegrationProvider())]
        public string $provider,

        #[Required, StringType, Max(200)]
        public string $name,

        #[Required, ArrayType]
        public array $config,

        public bool $isActive = false,
    ) {
    }
}
