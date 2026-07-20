<?php

declare(strict_types=1);

namespace Academorix\PlatformPublicSiteSdk\Payloads\PublicPages;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/public-pages` (or the
 * tenant-scoped equivalent).
 *
 * Every non-nullable property is auto-required by spatie/laravel-data;
 * every nullable defaults to `null`. Snake_case bridge in both
 * directions — the DTO's `toArray()` emits snake_case for the wire,
 * and Spatie validation kicks in during construction.
 *
 * @category PublicSiteSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class CreatePublicPagePayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $slug
     * @param  string                       $title
     * @param  string                       $kind
     * @param  string                       $status
     * @param  array                        $contentBlocksOrder
     * @param  ?string                      $publishedAt
     * @param  ?string                      $seoTitle
     * @param  ?string                      $seoDescription
     * @param  ?string                      $seoOgImageDocumentId
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $tenantId,

        #[StringType, Regex('/^[a-z0-9-/]+$/')]
        public string $slug,

        #[StringType]
        public string $title,

        #[StringType]
        public string $kind,

        #[StringType]
        public string $status,

        public array $contentBlocksOrder,

        #[StringType]
        public ?string $publishedAt = null,

        #[StringType]
        public ?string $seoTitle = null,

        #[StringType]
        public ?string $seoDescription = null,

        #[StringType]
        public ?string $seoOgImageDocumentId = null,

        public ?array $metadata = null,
    ) {
    }
}
