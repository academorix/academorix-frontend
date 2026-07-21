<?php

declare(strict_types=1);

namespace Stackra\Storage\Services;

use Stackra\Storage\Contracts\Services\CdnUrlRewriterInterface;
use Illuminate\Container\Attributes\Singleton;

/**
 * Pass-through CDN rewriter.
 *
 * Returns every path unchanged. Consumer apps that terminate reads
 * behind Cloudflare / CloudFront / Fastly bind their concrete
 * rewriter with `#[Overrides(CdnUrlRewriterInterface::class)]` on
 * their own concrete (Pattern B per
 * `.kiro/steering/php-attributes.md`).
 *
 * `#[Singleton]` — the pass-through is stateless. The interface
 * declares the container binding via
 * `#[Bind(PassThroughCdnUrlRewriter::class)]` (Pattern A), so this
 * concrete carries only its lifetime attribute.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Singleton]
final class PassThroughCdnUrlRewriter implements CdnUrlRewriterInterface
{
    /**
     * {@inheritDoc}
     */
    public function rewrite(string $path): string
    {
        return $path;
    }
}
