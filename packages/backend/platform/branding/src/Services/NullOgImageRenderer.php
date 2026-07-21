<?php

declare(strict_types=1);

namespace Stackra\Branding\Services;

use Stackra\Branding\Contracts\Services\OgImageRendererInterface;
use Stackra\Branding\Models\Branding;
use Illuminate\Container\Attributes\Singleton;

/**
 * Default no-op implementation of
 * {@see OgImageRendererInterface}.
 *
 * Returns `null` for every render — consumer apps override by
 * binding a real renderer (Puppeteer, Playwright, image-composition
 * worker) through the interface's `#[Bind]` attribute.
 *
 * `#[Singleton]` — the renderer is stateless; the container reuses
 * the same instance for every render call in the worker process.
 *
 * @category Branding
 *
 * @since    0.1.0
 */
#[Singleton]
final class NullOgImageRenderer implements OgImageRendererInterface
{
    /**
     * {@inheritDoc}
     */
    public function render(Branding $branding): ?string
    {
        return null;
    }
}
