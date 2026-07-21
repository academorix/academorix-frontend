<?php

declare(strict_types=1);

namespace Stackra\Domains\Data\Requests;

use Stackra\Domains\Enums\DomainKind;
use Stackra\Domains\Enums\DomainVerificationMethod;
use Stackra\Domains\Rules\ValidDomainHost;
use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\Rule;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `POST /api/v1/tenant/domains` (self-service)
 * and `POST /api/v1/platform/domains` (platform admin).
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreateDomainRequestData extends Data
{
    /**
     * @param  string                        $host                Custom hostname (RFC 1035 checked).
     * @param  DomainKind                    $kind                Subdomain / custom / alias.
     * @param  DomainVerificationMethod|null $verificationMethod  Verification method; defaults to `dns_txt`.
     * @param  bool                          $isPrimary           Whether to promote to primary (verification-gated).
     */
    public function __construct(
        #[Required, StringType, Max(253), Rule(new ValidDomainHost())]
        public string $host,

        #[Required, Enum(DomainKind::class)]
        public DomainKind $kind,

        #[Enum(DomainVerificationMethod::class)]
        public ?DomainVerificationMethod $verificationMethod = null,

        public bool $isPrimary = false,
    ) {
    }
}
