<?php

/**
 * @file Container.php
 * @module Stackra\Cli
 * @description Illuminate Container wrapper. Wires the 7 workspace services
 *   the CLI relies on: Filesystem, CatalogReader, CatalogQuery, StubRegistry,
 *   StubRenderer, TemplateManager, BlueprintReader. Also boots the Illuminate
 *   View factory so the global `view()` helper resolves cleanly.
 */

declare(strict_types=1);

namespace Stackra\Cli;

use Stackra\Cli\Blueprint\BlueprintReader;
use Stackra\Cli\Blueprint\BlueprintValidator;
use Stackra\Cli\Bootstrap\ViewBootstrapper;
use Stackra\Cli\Catalog\CatalogQuery;
use Stackra\Cli\Catalog\CatalogReader;
use Stackra\Cli\Composer\ComposerPathRepoWirer;
use Stackra\Cli\Stubs\StubFormatter;
use Stackra\Cli\Stubs\StubRegistry;
use Stackra\Cli\Stubs\StubRenderer;
use Stackra\Cli\Support\PathResolver;
use Stackra\Cli\Support\ProcessRunner;
use Stackra\Cli\Templates\TemplateHydrator;
use Stackra\Cli\Templates\TemplateManager;
use Stackra\Cli\Templates\TemplateRegistry;
use Illuminate\Container\Container as IlluminateContainer;
use Illuminate\Filesystem\Filesystem;

/**
 * Thin wrapper around Illuminate's container that knows how to boot the CLI.
 */
final class Container
{
    private readonly IlluminateContainer $container;

    public function __construct()
    {
        $this->container = new IlluminateContainer;
        $this->registerBindings();
        ViewBootstrapper::boot($this);
    }

    /**
     * Resolve a binding out of the container.
     *
     * @template T of object
     *
     * @param  class-string<T>  $abstract
     * @return T
     */
    public function resolve(string $abstract): object
    {
        /** @var T */
        return $this->container->make($abstract);
    }

    /**
     * Register a binding directly on the underlying container. Used by
     * bootstrappers (like {@see ViewBootstrapper}) to wire additional
     * services after construction.
     */
    public function bind(string $abstract, mixed $concrete = null, bool $shared = false): void
    {
        $this->container->bind($abstract, $concrete, $shared);
    }

    /**
     * Register a singleton binding.
     */
    public function singleton(string $abstract, mixed $concrete = null): void
    {
        $this->container->singleton($abstract, $concrete);
    }

    /**
     * The raw Illuminate container. Escape hatch for callers that need
     * facade-style access. Prefer {@see resolve()} for normal use.
     */
    public function illuminate(): IlluminateContainer
    {
        return $this->container;
    }

    /**
     * Wire every default binding the CLI needs.
     */
    private function registerBindings(): void
    {
        // Filesystem is used by every subsystem that touches disk.
        $this->container->singleton(Filesystem::class, static fn () => new Filesystem);

        // Support layer.
        $this->container->singleton(PathResolver::class, static fn () => new PathResolver);
        $this->container->singleton(
            ProcessRunner::class,
            static fn () => new ProcessRunner,
        );

        // Catalog subsystem.
        $this->container->singleton(
            CatalogReader::class,
            fn (IlluminateContainer $c) => new CatalogReader(
                $c->make(Filesystem::class),
                $c->make(PathResolver::class),
            ),
        );
        $this->container->singleton(
            CatalogQuery::class,
            fn (IlluminateContainer $c) => new CatalogQuery($c->make(CatalogReader::class)),
        );

        // Stub subsystem.
        $this->container->singleton(
            StubRegistry::class,
            static fn () => new StubRegistry,
        );
        $this->container->singleton(
            StubFormatter::class,
            fn (IlluminateContainer $c) => new StubFormatter(
                $c->make(ProcessRunner::class),
            ),
        );
        $this->container->singleton(
            StubRenderer::class,
            fn (IlluminateContainer $c) => new StubRenderer(
                $c->make(Filesystem::class),
                $c->make(StubRegistry::class),
                $c->make(StubFormatter::class),
            ),
        );

        // Template subsystem.
        $this->container->singleton(
            TemplateRegistry::class,
            fn (IlluminateContainer $c) => new TemplateRegistry(
                $c->make(PathResolver::class),
            ),
        );
        $this->container->singleton(
            TemplateHydrator::class,
            fn (IlluminateContainer $c) => new TemplateHydrator(
                $c->make(Filesystem::class),
            ),
        );
        $this->container->singleton(
            TemplateManager::class,
            fn (IlluminateContainer $c) => new TemplateManager(
                $c->make(TemplateRegistry::class),
                $c->make(TemplateHydrator::class),
            ),
        );

        // Composer wiring subsystem.
        $this->container->singleton(
            ComposerPathRepoWirer::class,
            fn (IlluminateContainer $c) => new ComposerPathRepoWirer(
                $c->make(Filesystem::class),
            ),
        );

        // Blueprint subsystem.
        $this->container->singleton(
            BlueprintReader::class,
            fn (IlluminateContainer $c) => new BlueprintReader(
                $c->make(Filesystem::class),
                $c->make(PathResolver::class),
            ),
        );
        $this->container->singleton(
            BlueprintValidator::class,
            fn (IlluminateContainer $c) => new BlueprintValidator(
                $c->make(PathResolver::class),
                $c->make(ProcessRunner::class),
            ),
        );
    }
}
