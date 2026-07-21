<?php

declare(strict_types=1);

namespace Stackra\Notifications\InApp\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\BooleanType;
use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated query payload for `GET /api/v1/notifications/in-app`.
 *
 * Every filter is optional — the raw endpoint returns the caller's
 * inbox newest-first.
 *
 * @category NotificationsInApp
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class ListInAppMessagesRequestData extends Data
{
    /**
     * @param  bool|null    $isRead        Filter to read (`true`) / unread (`false`) rows.
     * @param  bool|null    $isDismissed   Filter to dismissed (`true`) / active (`false`) rows.
     * @param  string|null  $categorySlug  Exact match on `category_slug`.
     * @param  string|null  $priority      Exact match on `priority` (`critical`, `transactional`, `product`, `marketing`).
     */
    public function __construct(
        #[BooleanType]
        public ?bool $isRead = null,

        #[BooleanType]
        public ?bool $isDismissed = null,

        #[StringType, Max(191)]
        public ?string $categorySlug = null,

        #[StringType, In(['critical', 'transactional', 'product', 'marketing'])]
        public ?string $priority = null,
    ) {
    }
}
