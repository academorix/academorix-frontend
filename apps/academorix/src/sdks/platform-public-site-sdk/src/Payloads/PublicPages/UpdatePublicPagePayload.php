<?php

declare(strict_types=1);

namespace Stackra\PlatformPublicSiteSdk\Payloads\PublicPages;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Optional;

/**
 * Wire-visible write payload for `PATCH /api/v1/public-pages/{id}` (or the
 * tenant-scoped equivalent).
 *
 * Partial-update semantics — every property is typed
 * `T|Optional|null` with an `Optional` sentinel default. Spatie
 * Data's `toArray()` strips `Optional` values, so unmentioned fields
 * are never emitted (never clear server-side state). Pass `null`
 * explicitly to clear a nullable column.
 *
 * @category PublicSiteSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class UpdatePublicPagePayload extends Data
{
    /**
     * @param  Optional|string                  $tenantId
     * @param  Optional|string                  $slug
     * @param  Optional|string                  $title
     * @param  Optional|string                  $kind
     * @param  Optional|string                  $status
     * @param  Optional|string|null             $publishedAt
     * @param  Optional|string|null             $seoTitle
     * @param  Optional|string|null             $seoDescription
     * @param  Optional|string|null             $seoOgImageDocumentId
     * @param  Optional|array                   $contentBlocksOrder
     * @param  Optional|array|null              $metadata
     */
    public function __construct(
        #[StringType]
        public Optional|string $tenantId = new Optional(),

        #[StringType, Regex('/^[a-z0-9-/]+$/')]
        public Optional|string $slug = new Optional(),

        #[StringType]
        public Optional|string $title = new Optional(),

        #[StringType]
        public Optional|string $kind = new Optional(),

        #[StringType]
        public Optional|string $status = new Optional(),

        #[StringType]
        public Optional|string|null $publishedAt = new Optional(),

        #[StringType]
        public Optional|string|null $seoTitle = new Optional(),

        #[StringType]
        public Optional|string|null $seoDescription = new Optional(),

        #[StringType]
        public Optional|string|null $seoOgImageDocumentId = new Optional(),

        public Optional|array $contentBlocksOrder = new Optional(),

        public Optional|array|null $metadata = new Optional(),
    ) {
    }
}
