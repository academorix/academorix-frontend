<?php

/**
 * @file ViewBootstrapper.php
 * @module Stackra\Cli\Bootstrap
 * @description Boots an Illuminate View factory onto the CLI container.
 *   Registers a namespace for the `omniterm::` view prefix so
 *   `view('omniterm::status.success')` (or whatever the omniterm views
 *   expose) resolves without further wiring at the call site.
 *
 *   The full omniterm view path is expected to live inside the
 *   `pdphilip/omniterm` composer package under `resources/views/`;
 *   we point the namespace at that directory when it exists on disk.
 */

declare(strict_types=1);

namespace Stackra\Cli\Bootstrap;

use Stackra\Cli\Container;
use Illuminate\Contracts\View\Factory as ViewFactory;
use Illuminate\Events\Dispatcher;
use Illuminate\Filesystem\Filesystem;
use Illuminate\View\Engines\CompilerEngine;
use Illuminate\View\Engines\EngineResolver;
use Illuminate\View\Engines\PhpEngine;
use Illuminate\View\Factory;
use Illuminate\View\FileViewFinder;

/**
 * One-shot bootstrapper.
 */
final class ViewBootstrapper
{
    private static ?ViewFactory $factory = null;

    /**
     * Wire the Illuminate View factory into the container. Idempotent —
     * safe to call multiple times.
     */
    public static function boot(Container $container): void
    {
        if (self::$factory !== null) {
            return;
        }

        $filesystem = $container->resolve(Filesystem::class);

        // Compiler cache lives in the system temp dir — the CLI is
        // process-local so there is no long-lived cache concern.
        $compilePath = sys_get_temp_dir().'/stackra-cli-views';
        $filesystem->ensureDirectoryExists($compilePath);

        $bladeCompiler = new \Illuminate\View\Compilers\BladeCompiler($filesystem, $compilePath);

        $engines = new EngineResolver;
        $engines->register('php', static fn () => new PhpEngine($filesystem));
        $engines->register('blade', static fn () => new CompilerEngine($bladeCompiler, $filesystem));

        // Start with the omniterm package's views if it's on disk.
        $searchPaths = [];
        $omniViews = self::resolveOmniViewsPath();
        if ($omniViews !== null) {
            $searchPaths[] = $omniViews;
        }
        $finder = new FileViewFinder($filesystem, $searchPaths);
        if ($omniViews !== null) {
            $finder->addNamespace('omniterm', $omniViews);
        }

        $factory = new Factory($engines, $finder, new Dispatcher);
        self::$factory = $factory;

        $container->singleton(ViewFactory::class, static fn () => $factory);
    }

    /**
     * The Illuminate View factory the CLI shares process-wide.
     */
    public static function factory(): ViewFactory
    {
        if (self::$factory === null) {
            throw new \RuntimeException('ViewBootstrapper::boot() has not been called yet.');
        }

        return self::$factory;
    }

    /**
     * Reset the factory. Test-only.
     */
    public static function reset(): void
    {
        self::$factory = null;
    }

    /**
     * Best-effort location of pdphilip/omniterm's views/ directory on
     * disk. Returns null when the package isn't installed.
     */
    private static function resolveOmniViewsPath(): ?string
    {
        $candidates = [
            __DIR__.'/../../vendor/pdphilip/omniterm/resources/views',
            __DIR__.'/../../vendor/pdphilip/omniterm/src/resources/views',
            __DIR__.'/../../vendor/pdphilip/omniterm/views',
        ];
        foreach ($candidates as $candidate) {
            if (is_dir($candidate)) {
                return realpath($candidate) ?: $candidate;
            }
        }

        return null;
    }
}
