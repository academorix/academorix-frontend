<?php

declare(strict_types=1);

namespace Academorix\Storage\Services;

use Academorix\Storage\Contracts\Services\VariantGeneratorInterface;
use Academorix\Storage\Models\File;
use Academorix\Storage\Models\FileVariant;
use Illuminate\Container\Attributes\Singleton;

/**
 * No-op variant generator.
 *
 * Returns `null` for every call — the module boots without an
 * image-processing dependency. Consumer apps needing thumbnails /
 * medium / hero variants bind an intervention-image / spatie-image
 * implementation with
 * `#[Overrides(VariantGeneratorInterface::class)]` on their own
 * concrete (Pattern B per `.kiro/steering/php-attributes.md`).
 *
 * `#[Singleton]` — the null generator is stateless. The interface
 * declares the container binding via
 * `#[Bind(NullVariantGenerator::class)]` (Pattern A), so this
 * concrete carries only its lifetime attribute.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Singleton]
final class NullVariantGenerator implements VariantGeneratorInterface
{
    /**
     * {@inheritDoc}
     */
    public function generate(File $file, string $variantKey, array $recipe): ?FileVariant
    {
        // fail-soft — no processor bound, no variant produced.
        return null;
    }
}
