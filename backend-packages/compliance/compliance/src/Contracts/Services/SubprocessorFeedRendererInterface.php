<?php

declare(strict_types=1);

namespace Academorix\Compliance\Contracts\Services;

use Academorix\Compliance\Services\DefaultSubprocessorFeedRenderer;
use Illuminate\Container\Attributes\Bind;

/**
 * Renders the public subprocessor feed (JSON + PDF).
 *
 * The feed is cached with `Cache-Control:public max-age`; changes
 * to the subprocessor registry flush the cache immediately via the
 * observer.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Bind(DefaultSubprocessorFeedRenderer::class)]
interface SubprocessorFeedRendererInterface
{
    /**
     * Render the feed as a JSON payload.
     *
     * @return array<string, mixed>
     */
    public function renderJson(): array;
}
