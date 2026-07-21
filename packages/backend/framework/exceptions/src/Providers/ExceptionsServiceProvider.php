<?php

/**
 * @file packages/exceptions/src/Providers/ExceptionsServiceProvider.php
 *
 * @description
 * Package entry point for `stackra/exceptions`. Wires the new
 * pluggable exception architecture into the host application's
 * container, router, config, translation loader, and view loader.
 *
 * ## What this provider is responsible for
 *
 *   1. **Merging the package config** under the `exceptions.*` key
 *      so downstream code can read `config('exceptions.redaction.*')`
 *      etc. without any per-app boilerplate.
 *
 *   2. **Binding singletons** for the shared services
 *      ({@see ExceptionMapper}, {@see Redactor},
 *      {@see TraceCleaner}). The redactor + trace-cleaner closures
 *      resolve their config at bind time so runtime overrides in
 *      `config('exceptions.*')` take effect without any code change.
 *
 *   3. **Registering the formatter + reporter chains** via
 *      container tagging (`stackra.exception.formatters` /
 *      `stackra.exception.reporters`). The custom {@see Handler}
 *      pulls the tagged sets, sorts them by
 *      {@see ErrorFormatterInterface::priority()} /
 *      {@see ExceptionReporterInterface::priority()} in descending
 *      order, and hands them to its constructor.
 *
 *   4. **Replacing Laravel's default exception handler.** Rebinds
 *      the framework's own {@see \Illuminate\Contracts\Debug\ExceptionHandler}
 *      contract to {@see Handler} so apps get the new pipeline
 *      without touching their own `bootstrap/app.php`.
 *
 *   5. **The `exception-context` middleware alias** is registered
 *      by the Routing package's `#[AsMiddleware]` discovery pass —
 *      driven by the attribute on
 *      {@see CaptureExceptionContext}. Routes attach it via
 *      `->middleware('exception-context')`.
 *
 *   6. **Loading translations + views** under the `exceptions`
 *      namespace, and exposing publish tags so downstream apps can
 *      override individual strings and templates.
 *
 *   7. **Wiring Spatie Ignition solution providers** when the SDK
 *      is loaded. Deterministic and AI-augmented solutions register
 *      themselves against the shared Ignition instance so local
 *      development gets richer hints on domain exceptions.
 *
 * ## What it deliberately does NOT do
 *
 *   - Does not touch `bootstrap/app.php`. Apps no longer need to
 *     call any bootstrap helper — the Handler binding here fully
 *     replaces Laravel's default handler.
 *   - Does not register report / render callbacks on Laravel's
 *     fluent `Exceptions` builder. That surface is bypassed by
 *     virtue of replacing the handler contract.
 *
 * ## Reference — tagged iterable resolution
 *
 * The Handler receives its formatters + reporters as iterables that
 * are materialised at RESOLVE time, not at REGISTER time, so:
 *
 *   - App code that adds a tagged formatter AFTER this provider
 *     runs still gets picked up.
 *   - Priority sorting happens once per Handler construction, not
 *     on every render call.
 */

declare(strict_types=1);

namespace Stackra\Exceptions\Providers;

use Stackra\Exceptions\Contracts\ErrorFormatterInterface;
use Stackra\Exceptions\Contracts\ExceptionReporterInterface;
use Stackra\Exceptions\Formatters\HtmlErrorFormatter;
use Stackra\Exceptions\Formatters\JsonErrorFormatter;
use Stackra\Exceptions\Handler;
use Stackra\Exceptions\Ignition\AiSolutionsProvider;
use Stackra\Exceptions\Ignition\SolutionsProvider;
use Stackra\Exceptions\Reporters\LogReporter;
use Stackra\Exceptions\Reporters\SentryReporter;
use Stackra\Exceptions\Support\ExceptionMapper;
use Stackra\Exceptions\Support\Redactor;
use Stackra\Exceptions\Support\TraceCleaner;
use Stackra\Foundation\Providers\AbstractModuleServiceProvider;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Illuminate\Contracts\Debug\ExceptionHandler as ExceptionHandlerContract;
use Illuminate\Contracts\Foundation\Application;
use Stackra\ServiceProvider\Attributes\AsModule;
use Stackra\ServiceProvider\Attributes\LoadsResources;

#[AsModule(name: 'Exceptions', priority: 100)]
#[LoadsResources()]
final class ExceptionsServiceProvider extends AbstractModuleServiceProvider
{
    /**
     * Container tag for {@see ErrorFormatterInterface} implementations.
     * The Handler drains this tag at resolve time and sorts by
     * priority (descending).
     */
    public const FORMATTERS_TAG = 'stackra.exception.formatters';

    /**
     * Container tag for {@see ExceptionReporterInterface} implementations.
     */
    public const REPORTERS_TAG = 'stackra.exception.reporters';

    /**
     * Prefix used by {@see AbstractModuleServiceProvider::normaliseConfigEntry()}
     * when a config entry doesn't declare its own `key`. Left empty
     * because the sole entry below sets `key => exceptions` explicitly.
     */
    protected string $configKey = '';

    /**
     * Config files merged into the host app's config store. The
     * single `exceptions.php` file lands under the `exceptions.*`
     * key so `config('exceptions.docs_url')` etc. resolves.
     *
     * @var list<array{file: string, key: string}>
     */
    protected array $configs = [
        ['file' => __DIR__ . '/../../config/exceptions.php', 'key' => 'exceptions'],
    ];

    /**
     * Middleware placement note.
     *
     * The `exception-context` alias is registered by the Routing
     * package's `#[AsMiddleware]` discovery pass — see
     * {@see \Stackra\Exceptions\Middleware\CaptureExceptionContext}.
     * Nothing to wire imperatively here.
     */
    protected array $middlewareAliases = [];

    /**
     * Escape hatch for register-time work that doesn't fit the
     * declarative `$singletons` / `$bindings` / `$tags` shape.
     *
     * The bindings here need constructor arguments driven by the
     * merged config, which isn't available until AFTER
     * `mergeConfigFrom()` runs — that's exactly what
     * {@see AbstractModuleServiceProvider::register()} does before
     * calling this hook.
     */
    protected function registerBespoke(): void
    {
        $this->registerSupportServices();
        $this->registerFormatters();
        $this->registerReporters();
        $this->registerHandlerBinding();
        $this->registerIgnitionBindings();
    }

    /**
     * Escape hatch for boot-time work. Loads translations, views,
     * and publishing groups; wires Spatie Ignition when it's
     * available in the runtime.
     */
    protected function bootBespoke(): void
    {
        $this->loadTranslationsFrom(__DIR__ . '/../../lang', 'exceptions');
        $this->loadViewsFrom(__DIR__ . '/../../views', 'exceptions');

        $this->publishes([
            __DIR__ . '/../../config/exceptions.php' => $this->app->configPath('exceptions.php'),
        ], 'exceptions-config');

        $this->publishes([
            __DIR__ . '/../../lang' => $this->app->langPath('vendor/exceptions'),
        ], 'exceptions-translations');

        $this->publishes([
            __DIR__ . '/../../views' => $this->app->resourcePath('views/vendor/exceptions'),
        ], 'exceptions-views');

        $this->registerIgnitionSolutions();
    }

    // -----------------------------------------------------------------
    // Register-time helpers.
    // -----------------------------------------------------------------

    /**
     * Bind the shared support services as singletons. Each closure
     * resolves the relevant `exceptions.*` config subtree so
     * downstream services always see the merged runtime values.
     */
    private function registerSupportServices(): void
    {
        $this->app->singleton(ExceptionMapper::class, ExceptionMapper::class);

        $this->app->singleton(Redactor::class, static function (Application $app): Redactor {
            $config = $app->make('config');

            return new Redactor(
                config: $config instanceof ConfigRepository ? $config : null,
                sensitiveKeys: self::stringList($config->get('exceptions.redaction.sensitive_keys', [])),
                sensitivePatterns: self::stringMap($config->get('exceptions.redaction.sensitive_patterns', [])),
                replacement: (string) $config->get('exceptions.redaction.replacement', '[REDACTED]'),
                maxDepth: (int) $config->get('exceptions.redaction.max_depth', 8),
                maxStringLength: (int) $config->get('exceptions.redaction.max_string_length', 2048),
            );
        });

        $this->app->singleton(TraceCleaner::class, static function (Application $app): TraceCleaner {
            $config = $app->make('config');

            return new TraceCleaner(
                config: $config instanceof ConfigRepository ? $config : null,
                stripPaths: (bool) $config->get('exceptions.traces.strip_paths', true),
                collapseVendor: (bool) $config->get('exceptions.traces.collapse_vendor', false),
                maxFrames: (int) $config->get('exceptions.traces.max_frames', TraceCleaner::DEFAULT_MAX_FRAMES),
                basePath: $app->basePath(),
            );
        });
    }

    /**
     * Register formatter singletons and tag them so the Handler
     * can iterate them via `->tagged(self::FORMATTERS_TAG)`.
     *
     * Priorities are declared on the classes themselves — JSON
     * runs at 100, HTML at 10. Custom formatters registered by
     * apps just add themselves to the same tag with a priority
     * that slots them into the desired position.
     */
    private function registerFormatters(): void
    {
        $this->app->singleton(JsonErrorFormatter::class, JsonErrorFormatter::class);
        $this->app->singleton(HtmlErrorFormatter::class, HtmlErrorFormatter::class);

        $this->app->tag([
            JsonErrorFormatter::class,
            HtmlErrorFormatter::class,
        ], self::FORMATTERS_TAG);
    }

    /**
     * Register reporter singletons and tag them. Log runs at 100,
     * Sentry at 50 — so a broken external reporter can never cost
     * us the local log line.
     */
    private function registerReporters(): void
    {
        $this->app->singleton(LogReporter::class, LogReporter::class);
        $this->app->singleton(SentryReporter::class, SentryReporter::class);

        $this->app->tag([
            LogReporter::class,
            SentryReporter::class,
        ], self::REPORTERS_TAG);
    }

    /**
     * Bind the custom {@see Handler} into the container and rebind
     * the framework's {@see ExceptionHandlerContract} to it.
     *
     * The closure resolves tagged formatters + reporters at the
     * moment the Handler is first materialised, so apps that add
     * their own tagged services after this provider registers are
     * still picked up. Each set is sorted by priority descending
     * before being handed to the Handler constructor.
     */
    private function registerHandlerBinding(): void
    {
        $this->app->bind(Handler::class, static function (Application $app): Handler {
            $formatters = collect(iterator_to_array(
                $app->tagged(self::FORMATTERS_TAG),
                false,
            ))
                ->sortByDesc(static fn (ErrorFormatterInterface $f): int => $f->priority())
                ->values()
                ->all();

            $reporters = collect(iterator_to_array(
                $app->tagged(self::REPORTERS_TAG),
                false,
            ))
                ->sortByDesc(static fn (ExceptionReporterInterface $r): int => $r->priority())
                ->values()
                ->all();

            return new Handler($app, $formatters, $reporters);
        });

        $this->app->bind(ExceptionHandlerContract::class, Handler::class);
    }

    /**
     * Bind the Ignition solution providers as singletons. The
     * classes reference Ignition's contracts, so binding them
     * unconditionally is safe only because Composer autoload will
     * resolve the class-string lazily — they are never instantiated
     * until Ignition itself walks the registered providers.
     */
    private function registerIgnitionBindings(): void
    {
        $this->app->singleton(SolutionsProvider::class, SolutionsProvider::class);
        $this->app->singleton(AiSolutionsProvider::class, AiSolutionsProvider::class);
    }

    // -----------------------------------------------------------------
    // Boot-time helpers.
    // -----------------------------------------------------------------

    /**
     * Register both Stackra Ignition solution providers when
     * Spatie Ignition is loaded in the runtime.
     *
     * Guarded by `class_exists` + `interface_exists` checks so the
     * hook is a no-op in production images that intentionally omit
     * the Ignition package. When the container has an Ignition
     * instance we hand our providers to it; otherwise the deferred
     * `resolving()` hook picks it up the moment Ignition is first
     * resolved.
     */
    private function registerIgnitionSolutions(): void
    {
        $ignitionClass = 'Spatie\\Ignition\\Ignition';
        $solutionsInterface = 'Spatie\\Ignition\\Contracts\\HasSolutionsForThrowable';

        if (! class_exists($ignitionClass) || ! interface_exists($solutionsInterface)) {
            return;
        }

        $providers = [
            SolutionsProvider::class,
            AiSolutionsProvider::class,
        ];

        if ($this->app->bound($ignitionClass)) {
            /** @var object $ignition */
            $ignition = $this->app->make($ignitionClass);

            if (method_exists($ignition, 'addSolutionProviders')) {
                $ignition->addSolutionProviders($providers);
            }
        }

        // Also register a deferred hook so Ignition instances resolved
        // AFTER this provider boots still get the solution providers.
        $this->app->resolving($ignitionClass, static function (object $ignition) use ($providers): void {
            if (method_exists($ignition, 'addSolutionProviders')) {
                $ignition->addSolutionProviders($providers);
            }
        });
    }

    // -----------------------------------------------------------------
    // Small type-safety helpers used by the config-driven bindings.
    // -----------------------------------------------------------------

    /**
     * Coerce a config value into a `list<string>` so the Redactor
     * constructor's `sensitiveKeys` parameter stays type-safe when
     * an app publishes malformed config.
     *
     * @param  mixed  $value
     * @return list<string>|null
     */
    private static function stringList(mixed $value): ?array
    {
        if (! is_array($value) || $value === []) {
            return null;
        }

        $out = [];
        foreach ($value as $entry) {
            if (is_string($entry) && $entry !== '') {
                $out[] = $entry;
            }
        }

        return $out === [] ? null : $out;
    }

    /**
     * Coerce a config value into `array<string, string>` for the
     * Redactor's `sensitivePatterns` parameter. Non-string values
     * are dropped rather than allowed to blow up preg_replace at
     * report time.
     *
     * @param  mixed  $value
     * @return array<string, string>|null
     */
    private static function stringMap(mixed $value): ?array
    {
        if (! is_array($value) || $value === []) {
            return null;
        }

        $out = [];
        foreach ($value as $key => $pattern) {
            if (is_string($key) && is_string($pattern) && $pattern !== '') {
                $out[$key] = $pattern;
            }
        }

        return $out === [] ? null : $out;
    }
}
