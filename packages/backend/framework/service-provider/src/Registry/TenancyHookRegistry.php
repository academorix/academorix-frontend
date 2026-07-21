<?php

declare(strict_types=1);

namespace Stackra\ServiceProvider\Registry;

use Stackra\ServiceProvider\Bootstrappers\TenancyHookBootstrapper;
use Stackra\ServiceProvider\Contracts\TenancyHookInterface;
use Stackra\ServiceProvider\Dispatchers\TenancyHookDispatcher;
use Illuminate\Container\Attributes\Singleton;

/**
 * Ordered catalogue of every registered
 * {@see TenancyHookInterface} class-string.
 *
 * ## What this class owns
 *
 * Nothing beyond its identity — every mechanical concern
 * (priority map, insertion cursor, memoized sort, `has()`,
 * `count()`, `clear()`, ascending {@see all()} + descending
 * {@see allReversed()}) is inherited from {@see AbstractRegistry}.
 * Subclass exists solely to give the DI container a distinct type
 * to bind and to attach the ADR-0020 vocabulary lock to a named
 * class.
 *
 * ## Concept split — see ADR 0020
 *
 * This registry holds **per-tenant** lifecycle classes that fire
 * on every tenant init / end and NEVER touch the framework
 * cache. Its sibling
 * {@see BootstrapperRegistry}
 * holds **app-boot** discovery classes cached under
 * `bootstrapper.*`. Same shape at the container level
 * (`#[Singleton]`, class-string map), different lifecycle
 * concept. ADR 0020 enumerates the anti-conflation rules.
 *
 * ## Priority semantics
 *
 * Lower priorities run FIRST under {@see all()} (init order) and
 * LAST under {@see allReversed()} (symmetric teardown). The
 * dispatcher iterates `all()` on {@see TenancyHookDispatcher::fireInit()}
 * and `allReversed()` on {@see TenancyHookDispatcher::fireEnd()}.
 *
 * @see TenancyHookInterface  Contract every registered class honors.
 * @see TenancyHookDispatcher Iterates this registry.
 * @see TenancyHookBootstrapper Populates this registry at boot.
 * @see AbstractRegistry      Shared base — pure arrays + memoized sort.
 *
 * @category TenancyHook
 *
 * @since    0.1.0
 */
#[Singleton]
final class TenancyHookRegistry extends AbstractRegistry {}
