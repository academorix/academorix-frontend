<?php

declare(strict_types=1);

namespace Academorix\Versioning\Data;

use Academorix\Versioning\Contracts\Data\ApiVersionInterface;
use Academorix\Versioning\Enums\ApiVersionStatus;
use Academorix\Versioning\Enums\VersionScheme;
use Academorix\Versioning\Models\ApiVersion;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see ApiVersion}.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class ApiVersionData extends Data
{
    public function __construct(
        public string $id,
        public string $slug,
        public VersionScheme $scheme,
        public string $schemeValue,
        public ApiVersionStatus $status,
        public bool $isSystem,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $updatedAt,
        public ?string $description = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $releasedAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $deprecatedAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $sunsetAt = null,
    ) {
    }

    /**
     * Build from a Model.
     */
    public static function fromModel(ApiVersion $version): self
    {
        $rawScheme = $version->{ApiVersionInterface::ATTR_SCHEME};
        $scheme    = $rawScheme instanceof VersionScheme
            ? $rawScheme
            : (VersionScheme::tryFrom((string) $rawScheme) ?? VersionScheme::SemVer);

        $rawStatus = $version->{ApiVersionInterface::ATTR_STATUS};
        $status    = $rawStatus instanceof ApiVersionStatus
            ? $rawStatus
            : (ApiVersionStatus::tryFrom((string) $rawStatus) ?? ApiVersionStatus::Draft);

        return new self(
            id: (string) $version->getKey(),
            slug: (string) $version->{ApiVersionInterface::ATTR_SLUG},
            scheme: $scheme,
            schemeValue: (string) $version->{ApiVersionInterface::ATTR_SCHEME_VALUE},
            status: $status,
            isSystem: (bool) $version->{ApiVersionInterface::ATTR_IS_SYSTEM},
            createdAt: $version->{ApiVersionInterface::ATTR_CREATED_AT},
            updatedAt: $version->{ApiVersionInterface::ATTR_UPDATED_AT},
            description: $version->{ApiVersionInterface::ATTR_DESCRIPTION},
            releasedAt: $version->{ApiVersionInterface::ATTR_RELEASED_AT},
            deprecatedAt: $version->{ApiVersionInterface::ATTR_DEPRECATED_AT},
            sunsetAt: $version->{ApiVersionInterface::ATTR_SUNSET_AT},
        );
    }
}
