<?php


/**
 * Route Registrar
 *
 * Support class providing Route Registrar utilities for the Framework module.
 * Contains helper logic used across multiple components in this module.
 *
 * @category Support
 *
 * @since    1.0.0
 */

declare(strict_types=1);

namespace Stackra\Routing;

use Stackra\Container\Attributes\Overrides;
use Stackra\Foundation\Contracts\DiscoversAttributes;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\AsController;
use Illuminate\Support\Collection;
use Override;
use Stackra\Support\Reflection;
use ReflectionClass;
use Spatie\RouteAttributes\RouteRegistrar as SpatieRouteRegistrar;

/**
 * Route Registrar.
 *
 * Extends Spatie's RouteRegistrar to provide Discovery-based controller registration
 * using the #[AsController] attribute instead of directory scanning.
 *
 * ## Automatic Binding (Pattern B — vendor override):
 * This class carries `#[Overrides(SpatieRouteRegistrar::class)]` (from
 * `stackra/container`) so the container resolves any injection of
 * `SpatieRouteRegistrar` to this subclass instead — Spatie's own service
 * provider ends up using our implementation. Pattern B is used here
 * because Spatie's class is a vendor class we cannot annotate with
 * Laravel's canonical `#[Bind]` (which would need to live ON the abstract).
 * See `.kiro/steering/php-attributes.md` §Container attributes for the
 * Bind-vs-Overrides split.
 *
 * ## Purpose:
 * - Override Spatie's directory scanning with Discovery-based attribute scanning
 * - Use custom #[AsController] attribute for controller discovery
 * - Leverage composer-attribute-collector for performance
 * - Integrate with our custom ClassRouteAttributes for proper prefix combination
 *
 * ## Design Philosophy:
 * This class follows the Decorator Pattern:
 * - **Extends Spatie**: Inherits all Spatie's routing functionality
 * - **Overrides Discovery**: Replaces file scanning with attribute-based discovery
 * - **Transparent**: Works seamlessly with Spatie's auto-registration
 * - **Cached**: Uses Discovery's caching for optimal performance
 *
 * ## Features:
 * - ✅ Register single controller by class name
 * - ✅ Register multiple controllers at once
 * - ✅ All Spatie route attributes work as expected
 * - ✅ Proper combination of #[Prefix] and #[Group] attributes
 * - ✅ Integrates with Laravel's service container
 *
 * ## Usage:
 * ```php
 * // In service provider or trait
 * $registrar = app(RouteRegistrar::class);
 *
 * // Register single controller
 * $registrar->registerController(UserController::class);
 *
 * // Register multiple controllers
 * $registrar->registerControllers([
 *     UserController::class,
 *     PostController::class,
 * ]);
 * ```
 *
 * ## Integration with HasRoutes:
 * The HasRoutes trait uses this registrar to register discovered controllers:
 * ```php
 * protected function registerDiscoveredControllers(): void
 * {
 *     $registrar = $this->app->make(RouteRegistrar::class);
 *
 *     Discovery::attribute(Controller::class)
 *         ->get()
 *         ->filter(fn(string $controller) => Reflection::exists($controller))
 *         ->each(fn(string $controller) => $registrar->registerController($controller));
 * }
 * ```
 *
 * @since 1.0.0
 */
#[Overrides(SpatieRouteRegistrar::class)]
class RouteRegistrar extends SpatieRouteRegistrar
{
    /**
     * Register a single controller by class name.
     *
     * This method wraps Spatie's registerClass() method to provide a cleaner API.
     * It processes all route attributes on the controller and registers them with
     * Laravel's router.
     *
     * ## What it does:
     * 1. Validates the controller class exists
     * 2. Scans for route attributes (#[Get], #[Post], etc.)
     * 3. Registers routes with Laravel's router
     * 4. Applies middleware, prefixes, and other route options
     *
     * ## Example:
     * ```php
     * $registrar->registerController(UserController::class);
     * ```
     *
     * @param  string  $controllerClass  Fully qualified controller class name
     */
    public function registerController(string $controllerClass): void
    {
        // Delegate to Spatie's registerClass method
        // This handles all the attribute scanning and route registration
        $this->registerClass($controllerClass);
    }

    /**
     * Register multiple controllers by class names.
     *
     * Convenience method for registering multiple controllers at once.
     * Iterates through the array and calls registerController() for each.
     *
     * ## Example:
     * ```php
     * $registrar->registerControllers([
     *     UserController::class,
     *     PostController::class,
     *     CommentController::class,
     * ]);
     * ```
     *
     * @param  array<string>  $controllerClasses  Array of fully qualified controller class names
     */
    public function registerControllers(array $controllerClasses): void
    {
        // Register each controller individually
        foreach ($controllerClasses as $controllerClass) {
            $this->registerController($controllerClass);
        }
    }

    /**
     * Override Spatie's directory registration to use Discovery instead.
     *
     * Instead of scanning directories for PHP files, we use the Discovery package
     * to find all classes with the #[AsController] attribute. This is more efficient
     * and works with our custom attribute system.
     *
     * ## Why Override:
     * - Uses composer-attribute-collector (faster than file scanning)
     * - Works with our custom #[AsController] attribute
     * - Leverages Discovery's caching system
     * - More flexible filtering and validation
     *
     * ## Note:
     * The $directories, $patterns, and $notPatterns parameters are ignored
     * since we're using attribute-based discovery instead of file scanning.
     *
     * @param  string|array  $directories  Ignored - kept for compatibility
     * @param  array  $patterns  Ignored - kept for compatibility
     * @param  array  $notPatterns  Ignored - kept for compatibility
     */
    public function registerDirectory(string|array $directories, array $patterns = [], array $notPatterns = []): void
    {
        // Use Discovery to find all controllers with #[AsController] attribute
        // This is much faster than scanning directories and works with our custom attributes
        $this->collectGroupsFromDiscovery()
            ->sortByDesc(fn($item): bool => ! empty($item['group']['domain'] ?? null))
            ->each(fn(array $item) => $this->registerGroupedRoutes($item));
    }

    /**
     * Collect route groups by asking the shared attribute-discovery
     * service for every class carrying `#[AsController]`.
     *
     * Uses {@see \Stackra\Foundation\Contracts\DiscoversAttributes}
     * — the same contract every other package in the monorepo
     * consumes (events, ai, crud). Production binding delegates to
     * `olvlvl/composer-attribute-collector`; tests bind a fake with
     * fixture data. See `packages/foundation/src/Discovery/AttributeDiscovery.php`.
     *
     * @return Collection Collection of route groups with class and attribute data
     */
    protected function collectGroupsFromDiscovery(): Collection
    {
        /** @var DiscoversAttributes $discovery */
        $discovery = app(DiscoversAttributes::class);

        // Materialise the iterable into a Collection of class-strings
        // and dedupe — a repeatable attribute could theoretically
        // yield the same class more than once. We union the results
        // of both attributes because ADR 0016 (Actions-only) picks
        // `#[AsAction]` as the canonical route-target marker, but
        // legacy controllers still ship `#[AsController]` during
        // the migration window. Both are supported side-by-side.
        $classes = collect();

        // 1) Legacy `#[AsController]` — multi-method Controllers.
        foreach ($discovery->forClass(AsController::class) as $target) {
            $classes[$target->className] = true;
        }

        // 2) Canonical `#[AsAction]` — single-invoke Action classes.
        //    Spatie's registerClass() discovers the route-verb
        //    attributes on the class' methods regardless of whether
        //    the discovery marker is AsController or AsAction, so
        //    the downstream pipeline is identical for both.
        foreach ($discovery->forClass(AsAction::class) as $target) {
            $classes[$target->className] = true;
        }

        return $classes
            ->keys()
            // Filter out any classes that don't exist (safety check)
            ->filter(Reflection::exists(...))
            // Map to the format expected by Spatie's registrar
            ->map(fn ($className): array => [
                'class' => new ReflectionClass($className),
                'classRouteAttributes' => new ClassRouteAttributes(new ReflectionClass($className)),
            ])
            // Expand each class into its route groups
            ->flatMap(fn (array $item): array => $this->expandClassIntoGroups($item));
    }

    /**
     * Process route attributes for a controller class.
     *
     * Overrides Spatie's method to use our custom ClassRouteAttributes
     * which properly combines #[Prefix] and #[Group] attributes.
     *
     * @param  string  $className  Fully qualified controller class name
     */
    protected function processAttributes(string $className): void
    {
        if (! Reflection::exists($className)) {
            return;
        }

        $reflectionClass = new ReflectionClass($className);

        // Use our custom ClassRouteAttributes instead of Spatie's
        $classRouteAttributes = new ClassRouteAttributes($reflectionClass);

        $groups = $classRouteAttributes->groups();

        // Sort groups: domain routes come first
        usort($groups, function (array $group1, array $group2): int {
            $domain1 = ! empty($group1['domain'] ?? null);
            $domain2 = ! empty($group2['domain'] ?? null);

            return $domain2 <=> $domain1;
        });

        // Register routes for each group
        foreach ($groups as $group) {
            // Use parent's group method which has access to $router
            $this->group($group, fn() => $this->registerRoutes($reflectionClass, $classRouteAttributes));
        }

        // Register resource routes if applicable
        if ($classRouteAttributes->resource()) {
            $this->registerResource($reflectionClass, $classRouteAttributes);
        }
    }
}
