<?php

declare(strict_types=1);

namespace Stackra\Storage\Contracts\Registry;

use Stackra\ServiceProvider\Attributes\HydratesFrom;
use Stackra\Storage\Attributes\FileKind;
use Stackra\Storage\Registry\DefaultFileKindRegistry;
use Illuminate\Container\Attributes\Bind;

/**
 * Attribute-discovery registry for `#[FileKind]` classes.
 *
 * Hydrated at boot by the framework's generic
 * {@see \Stackra\ServiceProvider\Bootstrappers\HydrationBootstrapper}
 * pump via the {@see HydratesFrom} attribute on {@see register()}.
 * One row per class carrying the `#[FileKind]` attribute — the
 * upload / validation path reads the recipe here so no
 * per-controller MIME + size code exists.
 *
 * `#[Bind(DefaultFileKindRegistry::class)]` — Pattern A per
 * `.kiro/steering/php-attributes.md` §"Bind vs Overrides". Consumers
 * depend on this interface (never the concrete class) so tests can
 * bind a fake.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Bind(DefaultFileKindRegistry::class)]
interface FileKindRegistryInterface
{
    /**
     * Register a kind recipe.
     *
     * `#[HydratesFrom(FileKind::class)]` — the framework scans every
     * class carrying `#[FileKind]` at boot and calls this method
     * with `(className, attributeInstance)`. The concrete
     * implementation extracts `key` / `maxSizeMb` / `allowedMimes`
     * / `generatesVariants` / `requiresVirusScan` / `dedupable` /
     * `disk` from the attribute and stores the recipe keyed by
     * `$attribute->key`.
     *
     * @param  class-string  $className  FQCN of the class carrying the attribute.
     * @param  FileKind  $attribute  The discovered attribute instance.
     */
    #[HydratesFrom(FileKind::class)]
    public function register(string $className, FileKind $attribute): void;

    /**
     * Read a kind recipe by key.
     *
     * @return array<string, mixed>  Empty array when unknown.
     */
    public function get(string $key): array;

    /**
     * Every registered kind — powers the admin surface.
     *
     * @return array<string, array<string, mixed>>
     */
    public function all(): array;

    /**
     * Whether a kind key is registered.
     */
    public function has(string $key): bool;
}
