<?php

declare(strict_types=1);

namespace Stackra\Versioning\Data;

use Stackra\Versioning\Contracts\Data\DeprecationNoticeInterface;
use Stackra\Versioning\Enums\DeprecationSurface;
use Stackra\Versioning\Models\DeprecationNotice;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see DeprecationNotice}.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class DeprecationNoticeData extends Data
{
    public function __construct(
        public string $id,
        public string $apiVersionId,
        public DeprecationSurface $surface,
        public string $title,
        public string $body,
        public bool $isActive,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $updatedAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $startsAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $endsAt = null,
        public ?string $replacementVersion = null,
    ) {
    }

    /**
     * Build from a Model.
     */
    public static function fromModel(DeprecationNotice $notice): self
    {
        $rawSurface = $notice->{DeprecationNoticeInterface::ATTR_SURFACE};
        $surface    = $rawSurface instanceof DeprecationSurface
            ? $rawSurface
            : (DeprecationSurface::tryFrom((string) $rawSurface) ?? DeprecationSurface::All);

        return new self(
            id: (string) $notice->getKey(),
            apiVersionId: (string) $notice->{DeprecationNoticeInterface::ATTR_API_VERSION_ID},
            surface: $surface,
            title: (string) $notice->{DeprecationNoticeInterface::ATTR_TITLE},
            body: (string) $notice->{DeprecationNoticeInterface::ATTR_BODY},
            isActive: (bool) $notice->{DeprecationNoticeInterface::ATTR_IS_ACTIVE},
            createdAt: $notice->{DeprecationNoticeInterface::ATTR_CREATED_AT},
            updatedAt: $notice->{DeprecationNoticeInterface::ATTR_UPDATED_AT},
            startsAt: $notice->{DeprecationNoticeInterface::ATTR_STARTS_AT},
            endsAt: $notice->{DeprecationNoticeInterface::ATTR_ENDS_AT},
            replacementVersion: $notice->{DeprecationNoticeInterface::ATTR_REPLACEMENT_VERSION},
        );
    }
}
