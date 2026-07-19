<?php

declare(strict_types=1);

namespace Academorix\Versioning\Contracts\Services;

use Academorix\Versioning\Models\DeprecationNotice;
use Academorix\Versioning\Services\DefaultDeprecationNoticeService;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Application service for publishing + reading deprecation notices.
 *
 * The `PublishDeprecationNoticeJob` calls `publish()` on the concrete
 * implementation; the `versioning.resolve` middleware calls
 * `activeFor()` when emitting the Deprecation header on a deprecated
 * version's response.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[Bind(DefaultDeprecationNoticeService::class)]
interface DeprecationNoticeServiceInterface
{
    /**
     * Publish a notice — flips `is_active = true`, sets `starts_at`
     * if unset, and emits {@see \Academorix\Versioning\Events\DeprecationNoticePublished}.
     */
    public function publish(DeprecationNotice $notice): void;

    /**
     * Every active notice affecting a version slug at the current
     * moment.
     *
     * @return Collection<int, DeprecationNotice>
     */
    public function activeFor(string $apiVersionSlug): Collection;
}
