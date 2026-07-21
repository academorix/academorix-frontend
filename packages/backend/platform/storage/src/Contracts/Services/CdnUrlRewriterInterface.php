<?php

declare(strict_types=1);

namespace Stackra\Storage\Contracts\Services;

use Stackra\Storage\Services\PassThroughCdnUrlRewriter;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for the CDN URL rewriter.
 *
 * Rewrites a raw storage path or signed URL into its CDN-facing
 * form. The default {@see PassThroughCdnUrlRewriter} returns the
 * path unchanged — consumer apps bind a Cloudflare / CloudFront /
 * Fastly rewriter for production with
 * `#[Overrides(CdnUrlRewriterInterface::class)]` on their own
 * concrete (Pattern B per `.kiro/steering/php-attributes.md`).
 *
 * `#[Bind(PassThroughCdnUrlRewriter::class)]` — Pattern A per
 * `.kiro/steering/php-attributes.md` §"Bind vs Overrides". The
 * interface owns the wiring; the pass-through concrete stays free
 * of the binding attribute and only carries its lifetime attribute
 * (`#[Singleton]`).
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Bind(PassThroughCdnUrlRewriter::class)]
interface CdnUrlRewriterInterface
{
    /**
     * Rewrite a path or URL into its CDN-facing form.
     */
    public function rewrite(string $path): string;
}
