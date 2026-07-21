<?php

declare(strict_types=1);

namespace Stackra\Storage\Contracts\Services;

use Stackra\Storage\Models\File;
use Stackra\Storage\Models\FileVariant;
use Stackra\Storage\Services\NullVariantGenerator;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for the async variant generator.
 *
 * The default {@see NullVariantGenerator} is a no-op that returns
 * `null` for every call. Consumer apps that need image + document
 * derivatives bind an intervention-image / spatie-image backed
 * implementation with `#[Overrides(VariantGeneratorInterface::class)]`
 * on their own concrete (Pattern B per
 * `.kiro/steering/php-attributes.md`).
 *
 * `#[Bind(NullVariantGenerator::class)]` — Pattern A per
 * `.kiro/steering/php-attributes.md` §"Bind vs Overrides". The
 * interface owns the wiring; the null concrete stays free of the
 * binding attribute and only carries its lifetime attribute
 * (`#[Singleton]`).
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Bind(NullVariantGenerator::class)]
interface VariantGeneratorInterface
{
    /**
     * Generate one variant for a parent File.
     *
     * @param  File   $file        Parent file.
     * @param  string $variantKey  Recipe key (`thumbnail`, `medium`, …).
     * @param  array<string, mixed> $recipe Recipe config (width, height, quality, format).
     * @return FileVariant|null  The persisted variant, or `null`
     *                           when the recipe does not apply
     *                           (e.g. thumbnail on an audio file).
     */
    public function generate(File $file, string $variantKey, array $recipe): ?FileVariant;
}
