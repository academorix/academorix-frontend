<?php

declare(strict_types=1);

namespace Academorix\Branding\Contracts\Services;

use Academorix\Branding\Models\Branding;
use Academorix\Branding\Services\NullOgImageRenderer;
use Illuminate\Container\Attributes\Bind;

/**
 * Open-graph image renderer.
 *
 * Consumer apps bind a real renderer (Puppeteer, Playwright, image-
 * composition service). The default {@see NullOgImageRenderer}
 * returns `null` for every render call so the module boots without
 * an image toolchain.
 *
 * `#[Bind]` follows the Laravel-canonical placement (`.kiro/steering/
 * php-attributes.md` §Container attributes): the attribute lives on
 * the ABSTRACT (this interface); the argument IS the CONCRETE
 * ({@see NullOgImageRenderer}). Consumers type-hint the interface;
 * the container resolves to the concrete.
 *
 * @category Branding
 *
 * @since    0.1.0
 */
#[Bind(NullOgImageRenderer::class)]
interface OgImageRendererInterface
{
    /**
     * Render an OG image for a branding profile. Returns the public
     * URL of the rendered image or `null` when the renderer cannot
     * produce one.
     */
    public function render(Branding $branding): ?string;
}
