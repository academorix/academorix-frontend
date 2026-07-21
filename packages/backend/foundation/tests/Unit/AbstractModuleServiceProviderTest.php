<?php

/**
 * @file packages/foundation/tests/Unit/AbstractModuleServiceProviderTest.php
 *
 * @description
 * Exercises the declarative wiring surface of
 * {@see \Stackra\Foundation\Providers\AbstractModuleServiceProvider}.
 *
 * ## Why every branch matters
 *
 * Every future Stackra package extends this base class — a bug
 * in the wiring here silently breaks every downstream provider
 * (billing, tenancy, notifications). The provider transforms nine
 * different `protected array $...` declarations into imperative
 * Laravel calls; each has its own concern:
 *
 *   - `$bindings` / `$singletons` — container resolution shape
 *   - `$middlewareAliases` — route middleware naming
 *   - `$policies` — Gate authorization dispatch
 *   - `$configs`  — app config namespace merging
 *   - `$migrations` — schema loading
 *   - `registerBespoke() / bootBespoke()` — the escape hatch
 *
 * We build a small anonymous subclass per concern, boot it in a
 * Testbench app, and assert on the observable side-effect.
 */

declare(strict_types=1);

use Stackra\Foundation\Providers\AbstractModuleServiceProvider;
use Illuminate\Routing\Router;
use Illuminate\Support\Facades\Gate;
use Orchestra\Testbench\TestCase;

uses(TestCase::class);

// ---------------------------------------------------------------------
// Fixtures — kept at file scope so they're autoload-clean and every
// test can reference them by FQCN without redeclaration warnings.
// ---------------------------------------------------------------------

interface AmspFixtureInterface {}
final class AmspFixtureImpl implements AmspFixtureInterface {}
final class AmspFixtureModel {}
final class AmspFixturePolicy {}
final class AmspFixtureMiddleware
{
    public function handle($request, Closure $next)
    {
        return $next($request);
    }
}

/**
 * Group 1 — `$bindings` produces per-resolution container bindings.
 */
describe('$bindings', function (): void {
    it('registers container bindings that produce fresh instances', function (): void {
        $provider = new class ($this->app) extends AbstractModuleServiceProvider {
            protected array $bindings = [
                AmspFixtureInterface::class => AmspFixtureImpl::class,
            ];
        };

        $provider->register();

        // `bind()` (vs `singleton()`) hands out a fresh instance on
        // every resolution — we assert on the type AND that two
        // resolutions aren't the same object.
        $a = $this->app->make(AmspFixtureInterface::class);
        $b = $this->app->make(AmspFixtureInterface::class);

        expect($a)->toBeInstanceOf(AmspFixtureImpl::class)
            ->and($a === $b)->toBeFalse();
    });
});

/**
 * Group 2 — `$singletons` produces shared instances.
 */
describe('$singletons', function (): void {
    it('registers singleton bindings that share one instance', function (): void {
        $provider = new class ($this->app) extends AbstractModuleServiceProvider {
            protected array $singletons = [
                AmspFixtureInterface::class => AmspFixtureImpl::class,
            ];
        };

        $provider->register();

        $a = $this->app->make(AmspFixtureInterface::class);
        $b = $this->app->make(AmspFixtureInterface::class);

        // Identity check: same object across resolutions is the
        // defining property of a singleton binding.
        expect($a === $b)->toBeTrue();
    });
});

/**
 * Group 3 — `$middlewareAliases` are registered on the router.
 */
describe('$middlewareAliases', function (): void {
    it('registers alias => class pairs on the HTTP router', function (): void {
        $provider = new class ($this->app) extends AbstractModuleServiceProvider {
            protected array $middlewareAliases = [
                'amsp-fixture' => AmspFixtureMiddleware::class,
            ];
        };

        $provider->register();
        $provider->boot();

        $router = $this->app->make(Router::class);

        // `Router::getMiddleware()` returns the alias map. If the
        // provider registered the wrong key or dropped the value,
        // route definitions using the alias fail at request time.
        expect($router->getMiddleware())
            ->toHaveKey('amsp-fixture', AmspFixtureMiddleware::class);
    });
});

/**
 * Group 4 — `$policies` are registered on the Gate.
 */
describe('$policies', function (): void {
    it('registers model => policy pairs via the Gate facade', function (): void {
        $provider = new class ($this->app) extends AbstractModuleServiceProvider {
            protected array $policies = [
                AmspFixtureModel::class => AmspFixturePolicy::class,
            ];
        };

        $provider->register();
        $provider->boot();

        // `getPolicyFor` returns the resolved policy instance —
        // we assert on its concrete class so a change in Gate's
        // resolution semantics is caught.
        expect(Gate::getPolicyFor(AmspFixtureModel::class))
            ->toBeInstanceOf(AmspFixturePolicy::class);
    });
});

/**
 * Group 5 — `$configs` are merged under the declared key.
 */
describe('$configs', function (): void {
    it('merges the file contents under the configured key', function (): void {
        // Materialise a config file to a tmp path — we can't just
        // point at an in-memory array because `mergeConfigFrom`
        // `require`s the file.
        $path = sys_get_temp_dir() . '/amsp-cfg-' . uniqid('', true) . '.php';
        file_put_contents($path, "<?php return ['foo' => 'bar'];");

        try {
            // Use a test-only setter so we don't need to redeclare
            // (and widen the visibility of) the parent's typed
            // property in an anonymous subclass.
            $provider = new class ($this->app) extends AbstractModuleServiceProvider {
                public function setConfigsForTest(array $configs): void
                {
                    $this->configs = $configs;
                }
            };
            $provider->setConfigsForTest([
                ['file' => $path, 'key' => 'amsp-test-cfg'],
            ]);
            $provider->register();

            // The declared key is `amsp-test-cfg`; the file
            // returns `['foo' => 'bar']`; so `amsp-test-cfg.foo`
            // resolves to `'bar'`.
            expect(config('amsp-test-cfg.foo'))->toBe('bar');
        } finally {
            @unlink($path);
        }
    });
});

/**
 * Group 6 — `$migrations` are loaded via `loadMigrationsFrom`.
 */
describe('$migrations', function (): void {
    it('adds each migration directory to the migrator paths', function (): void {
        $dir = sys_get_temp_dir() . '/amsp-migrations-' . uniqid('', true);
        mkdir($dir);

        try {
            $provider = new class ($this->app) extends AbstractModuleServiceProvider {
                public function setMigrationsForTest(array $migrations): void
                {
                    $this->migrations = $migrations;
                }
            };
            $provider->setMigrationsForTest([$dir]);
            $provider->boot();

            // `Migrator::paths()` returns the list of directories
            // the migrator has been told to consider. It's the
            // observable side effect of `loadMigrationsFrom`.
            expect($this->app['migrator']->paths())->toContain($dir);
        } finally {
            @rmdir($dir);
        }
    });
});

/**
 * Group 7 — the bespoke hooks run at the end of each lifecycle.
 *
 * `registerBespoke()` / `bootBespoke()` are the escape hatch for
 * customisation that doesn't fit the declarative shape. If they
 * silently stop firing, subclasses lose their ONLY imperative
 * customisation point with no compile-time warning.
 */
describe('registerBespoke / bootBespoke hooks', function (): void {
    it('invokes registerBespoke during register()', function (): void {
        $provider = new class ($this->app) extends AbstractModuleServiceProvider {
            public bool $registerCalled = false;

            protected function registerBespoke(): void
            {
                $this->registerCalled = true;
            }
        };

        $provider->register();

        expect($provider->registerCalled)->toBeTrue();
    });

    it('invokes bootBespoke during boot()', function (): void {
        $provider = new class ($this->app) extends AbstractModuleServiceProvider {
            public bool $bootCalled = false;

            protected function bootBespoke(): void
            {
                $this->bootCalled = true;
            }
        };

        $provider->boot();

        expect($provider->bootCalled)->toBeTrue();
    });
});
