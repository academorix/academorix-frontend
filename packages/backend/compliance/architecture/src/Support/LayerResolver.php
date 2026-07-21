<?php

/**
 * @file packages/architecture/src/Support/LayerResolver.php
 *
 * @description
 * Given a parsed {@see SourceFile}, decide which architectural
 * {@see LayerType} the class belongs to.
 *
 * ## Priority order
 *
 * The resolver walks signals from most-explicit to least-explicit
 * and stops at the first match:
 *
 *   1. **Path convention** — anything under a configured test
 *      root is `Test`. Migrations / seeders / factories map to
 *      `Infrastructure`.
 *   2. **Class attributes** — `#[Domain]`, `#[Repository]`,
 *      `#[Service]`, `#[Action]` on the class win outright.
 *   3. **Marker interfaces** — implements one of
 *      {@see \Stackra\Architecture\Contracts\Repository} /
 *      {@see \Stackra\Architecture\Contracts\Service} /
 *      {@see \Stackra\Architecture\Contracts\Action}.
 *   4. **Base-class inheritance** — `extends Model` (or any
 *      configured domain base class) → `Model`;
 *      `extends Controller` → `Controller`.
 *   5. **Namespace convention** — the config maps namespace
 *      prefixes to layer types (`App\Models\` → `Model`,
 *      `App\Http\Controllers\` → `Controller`, etc.).
 *
 * When none match, the resolver returns
 * {@see LayerType::Unknown} — rules treat that as unrestricted.
 *
 * ## Stateless
 *
 * Every method takes its inputs explicitly. No caches — the
 * scanner's own file-level cache is enough. Safe to bind as a
 * singleton.
 */

declare(strict_types=1);

namespace Stackra\Architecture\Support;

use Stackra\Architecture\Enums\LayerType;

/**
 * Pure classifier — no I/O, no side effects.
 *
 * @final
 */
final class LayerResolver
{
    /**
     * Class attributes that map to a specific layer. Kept as a
     * static array (not a private constant) so we can add
     * entries in constructor injection when the follow-up
     * "custom layer" feature lands.
     *
     * Format: `attribute short name` => `layer`.
     *
     * @var array<string, LayerType>
     */
    private const array ATTRIBUTE_MAP = [
        'Domain' => LayerType::Model,
        'Repository' => LayerType::Repository,
        'Service' => LayerType::Service,
        'Action' => LayerType::Action,
    ];

    /**
     * Marker interfaces that map to a specific layer. Compared
     * by SHORT NAME (last segment of the FQCN) because
     * `implements` clauses in source often reference the
     * imported alias, not the full FQCN.
     *
     * @var array<string, LayerType>
     */
    private const array INTERFACE_MAP = [
        'Repository' => LayerType::Repository,
        'Service' => LayerType::Service,
        'Action' => LayerType::Action,
    ];

    /**
     * @param  array<string, list<string>>  $namespaceMap  layer-string => list of
     *                                                     namespace prefixes (with
     *                                                     trailing backslash). Passed
     *                                                     in from config so apps can
     *                                                     override defaults.
     * @param  list<string>                 $modelBaseClasses  Short names of base
     *                                                        classes that flag a
     *                                                        descendant as a Model
     *                                                        (e.g. `Model`,
     *                                                        `Authenticatable`).
     * @param  list<string>                 $controllerBaseClasses  Short names of base
     *                                                              classes that flag
     *                                                              a descendant as a
     *                                                              Controller.
     * @param  list<string>                 $testPathPrefixes  Absolute path prefixes
     *                                                        under which everything
     *                                                        is `Test`.
     * @param  list<string>                 $infraPathPrefixes  Absolute path prefixes
     *                                                          for infrastructure
     *                                                          buckets (migrations /
     *                                                          seeders / factories).
     */
    public function __construct(
        private readonly array $namespaceMap,
        private readonly array $modelBaseClasses,
        private readonly array $controllerBaseClasses,
        private readonly array $testPathPrefixes,
        private readonly array $infraPathPrefixes,
    ) {
    }

    /**
     * Classify a parsed source file.
     */
    public function resolve(SourceFile $file): LayerType
    {
        // 1) Path — cheapest signal and hardest to override.
        $pathLayer = $this->fromPath($file->path);
        if ($pathLayer !== null) {
            return $pathLayer;
        }

        // 2) Attributes on the class declaration.
        $attributeLayer = $this->fromAttributes($file->classAttributes);
        if ($attributeLayer !== null) {
            return $attributeLayer;
        }

        // 3) Implemented marker interfaces.
        $interfaceLayer = $this->fromInterfaces($file->implements);
        if ($interfaceLayer !== null) {
            return $interfaceLayer;
        }

        // 4) Base-class inheritance.
        $baseLayer = $this->fromBaseClass($file->extends);
        if ($baseLayer !== null) {
            return $baseLayer;
        }

        // 5) Namespace convention.
        $namespaceLayer = $this->fromNamespace($file->classFqcn);
        if ($namespaceLayer !== null) {
            return $namespaceLayer;
        }

        return LayerType::Unknown;
    }

    // -----------------------------------------------------------------
    // Signal-specific helpers.
    // -----------------------------------------------------------------

    /**
     * Map an absolute path against the configured test /
     * infrastructure roots. `null` when neither matches.
     */
    private function fromPath(string $path): ?LayerType
    {
        foreach ($this->testPathPrefixes as $prefix) {
            if (str_starts_with($path, $prefix)) {
                return LayerType::Test;
            }
        }

        foreach ($this->infraPathPrefixes as $prefix) {
            if (str_starts_with($path, $prefix)) {
                return LayerType::Infrastructure;
            }
        }

        return null;
    }

    /**
     * @param  list<string>  $attributes
     */
    private function fromAttributes(array $attributes): ?LayerType
    {
        foreach ($attributes as $attr) {
            $short = $this->shortName($attr);
            if (isset(self::ATTRIBUTE_MAP[$short])) {
                return self::ATTRIBUTE_MAP[$short];
            }
        }

        return null;
    }

    /**
     * @param  list<string>  $implements
     */
    private function fromInterfaces(array $implements): ?LayerType
    {
        foreach ($implements as $iface) {
            $short = $this->shortName($iface);
            if (isset(self::INTERFACE_MAP[$short])) {
                return self::INTERFACE_MAP[$short];
            }
        }

        return null;
    }

    /**
     * `extends Model` → Model; `extends Controller` → Controller.
     * Comparison by short name because the `extends` clause often
     * uses the imported alias.
     */
    private function fromBaseClass(?string $extends): ?LayerType
    {
        if ($extends === null) {
            return null;
        }

        $short = $this->shortName($extends);

        foreach ($this->modelBaseClasses as $base) {
            if (strcasecmp($this->shortName($base), $short) === 0) {
                return LayerType::Model;
            }
        }

        foreach ($this->controllerBaseClasses as $base) {
            if (strcasecmp($this->shortName($base), $short) === 0) {
                return LayerType::Controller;
            }
        }

        return null;
    }

    /**
     * Namespace-prefix lookup. Config supplies the map keyed by
     * `LayerType->value`; we translate back to the enum.
     */
    private function fromNamespace(?string $classFqcn): ?LayerType
    {
        if ($classFqcn === null) {
            return null;
        }

        foreach ($this->namespaceMap as $layerValue => $prefixes) {
            $layer = LayerType::tryFrom($layerValue);
            if ($layer === null) {
                continue;
            }

            foreach ($prefixes as $prefix) {
                if (str_starts_with($classFqcn, $prefix)) {
                    return $layer;
                }
            }
        }

        return null;
    }

    /**
     * Strip everything before the last backslash. Idempotent —
     * short names pass through unchanged.
     */
    private function shortName(string $reference): string
    {
        $trimmed = ltrim($reference, '\\');
        $pos = strrpos($trimmed, '\\');

        return $pos === false ? $trimmed : substr($trimmed, $pos + 1);
    }
}
