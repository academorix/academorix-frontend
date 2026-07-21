<?php

/**
 * @file packages/architecture/src/Providers/ArchitectureServiceProvider.php
 *
 * @description
 * Package entry point for `stackra/architecture`. Wires the
 * full rule engine — parser, resolver, source rules, path rules,
 * artisan command — into the host application.
 *
 * ## What this provider does
 *
 *   1. Merges `config/architecture.php` under the `architecture.*`
 *      key so every rule's config subtree resolves.
 *   2. Binds `SourceFileParser` as a singleton (stateless).
 *   3. Binds `LayerResolver` as a singleton built from config.
 *   4. Binds each source rule (`ArchitectureRule`) transient with
 *      its config subtree captured; tags every source rule under
 *      `architecture.rules` so the artisan command can iterate.
 *   5. Binds each path rule (`PathRule`) transient with its own
 *      config subtree captured; tags each path rule under
 *      `architecture.path_rules`.
 *   6. Registers the `stackra:architecture:check` artisan
 *      command with both tagged iterables injected.
 *   7. Publishes the config file under `architecture-config`.
 *
 * ## PHPStan rules
 *
 * The 5 PHPStan rules under `src/PhpStan/*` are NOT registered
 * here — they're loaded by PHPStan itself via
 * `phpstan-extension.neon` at the package root. `composer.json`
 * declares `extra.phpstan.includes` so `phpstan/extension-installer`
 * wires them up automatically in the consumer app's phpstan
 * config.
 *
 * ## Adding a new rule
 *
 *   - Source rule → extend `AbstractRule`, add the class to
 *     the `$sourceRules` array below, add a config subtree
 *     under `config/architecture.php`.
 *   - Path rule → extend `AbstractPathRule`, add the class to
 *     `$pathRules`, add a config subtree.
 *
 * The rule id (`architecture.<snake_case>`) is derived
 * automatically from the class basename minus the `Rule`
 * suffix, so `MyCoolRule` → `my_cool` → looks up
 * `config('architecture.rules.my_cool')`. The pattern matches
 * every shipped rule; if a new rule wants a different config
 * key, override the derivation by adding a `$ruleConfigKeyOverrides`
 * entry to this provider — none needed today.
 *
 * @see \Stackra\Foundation\Providers\AbstractModuleServiceProvider Base class.
 */

declare(strict_types=1);

namespace Stackra\Architecture\Providers;

use Stackra\Architecture\Console\ArchitectureCheckCommand;
use Stackra\Architecture\Contracts\ArchitectureRule;
use Stackra\Architecture\Contracts\PathRule;
use Stackra\Architecture\Enums\LayerType;
use Stackra\Architecture\Rules\AbstractPathRule;
use Stackra\Architecture\Rules\AbstractRule;
// ---------------------------------------------------------------
// Source rules (extending AbstractRule)
// ---------------------------------------------------------------
use Stackra\Architecture\Rules\CommandUsesAttributeSignatureRule;
use Stackra\Architecture\Rules\ControllerExtendsBaseRule;
use Stackra\Architecture\Rules\ControllerNeedsAsControllerRule;
use Stackra\Architecture\Rules\EnumIsBackedStringRule;
use Stackra\Architecture\Rules\EnumUsesEnumTraitRule;
use Stackra\Architecture\Rules\EventReadonlyPropertiesRule;
use Stackra\Architecture\Rules\EventsCarryAsEventAttributeRule;
use Stackra\Architecture\Rules\ExceptionsExtendBaseRule;
use Stackra\Architecture\Rules\FinalDomainClassesRule;
use Stackra\Architecture\Rules\JobHasQueueAttributeRule;
use Stackra\Architecture\Rules\JobImplementsFailedRule;
use Stackra\Architecture\Rules\MiddlewareNeedsAsMiddlewareRule;
use Stackra\Architecture\Rules\ModelNoSideEffectsRule;
use Stackra\Architecture\Rules\ModelUsesFillableAttributeRule;
use Stackra\Architecture\Rules\NoAppMakeInConstructorRule;
use Stackra\Architecture\Rules\NoDirectModelAccessRule;
use Stackra\Architecture\Rules\NoEnvOutsideConfigRule;
use Stackra\Architecture\Rules\NoFacadesInServicesRule;
use Stackra\Architecture\Rules\NoFormRequestRule;
use Stackra\Architecture\Rules\NoHttpNamespaceNestingRule;
use Stackra\Architecture\Rules\NoJsonResourceRule;
use Stackra\Architecture\Rules\NoQueryBuilderInServicesRule;
use Stackra\Architecture\Rules\NoRepositoryFromControllerRule;
use Stackra\Architecture\Rules\NoRequestValidateInControllerRule;
use Stackra\Architecture\Rules\NoRouteFacadeRule;
use Stackra\Architecture\Rules\NoSingletonOnScopedDepsRule;
use Stackra\Architecture\Rules\NoStaticStateInServicesRule;
use Stackra\Architecture\Rules\RepositoryNeedsBindRule;
use Stackra\Architecture\Rules\RequireFileDocblockRule;
use Stackra\Architecture\Rules\RequireStrictTypesRule;
use Stackra\Architecture\Rules\SeedersCarryAsSeederAttributeRule;
use Stackra\Architecture\Rules\ServiceProviderHasModuleAttributeRule;
// ---------------------------------------------------------------
// Path rules (extending AbstractPathRule)
// ---------------------------------------------------------------
use Stackra\Architecture\Rules\MigrationHasDownRule;
use Stackra\Architecture\Rules\NoAppFolderRule;
use Stackra\Architecture\Rules\NoEnvFileRule;
use Stackra\Architecture\Rules\NoResourcesFolderRule;
use Stackra\Architecture\Rules\NoRouteServiceProviderRule;
use Stackra\Architecture\Rules\NoRoutesFolderRule;
use Stackra\Architecture\Rules\NoServiceLayerRule;
use Stackra\Architecture\Rules\RepositoryInterfaceSuffixRule;
use Stackra\Architecture\Support\LayerResolver;
use Stackra\Architecture\Support\SourceFileParser;
use Stackra\Foundation\Providers\AbstractModuleServiceProvider;
use Illuminate\Contracts\Foundation\Application;
use Stackra\ServiceProvider\Attributes\AsModule;
use Stackra\ServiceProvider\Attributes\LoadsResources;

#[AsModule(name: 'Architecture', priority: 100)]
#[LoadsResources()]
final class ArchitectureServiceProvider extends AbstractModuleServiceProvider
{
    /**
     * Source rules — inspect a parsed `SourceFile`. Every entry
     * extends {@see AbstractRule} which requires the shared
     * `(LayerResolver, array<string, mixed>)` constructor.
     *
     * @var list<class-string<AbstractRule>>
     */
    private array $sourceRules = [
        // Layering (headline rules)
        NoDirectModelAccessRule::class,
        NoRepositoryFromControllerRule::class,

        // Tier 1 — data-first + framework hygiene
        NoFormRequestRule::class,
        NoJsonResourceRule::class,
        NoFacadesInServicesRule::class,
        ControllerExtendsBaseRule::class,
        ControllerNeedsAsControllerRule::class,
        RepositoryNeedsBindRule::class,
        MiddlewareNeedsAsMiddlewareRule::class,
        FinalDomainClassesRule::class,
        RequireStrictTypesRule::class,
        RequireFileDocblockRule::class,

        // Tier 2 — content-scan for Octane safety
        NoEnvOutsideConfigRule::class,
        NoRouteFacadeRule::class,
        NoStaticStateInServicesRule::class,
        NoRequestValidateInControllerRule::class,
        NoAppMakeInConstructorRule::class,
        NoQueryBuilderInServicesRule::class,
        NoSingletonOnScopedDepsRule::class,

        // Tier 4 — model / job / command shape
        ModelUsesFillableAttributeRule::class,
        ModelNoSideEffectsRule::class,
        EnumIsBackedStringRule::class,
        EnumUsesEnumTraitRule::class,
        EventReadonlyPropertiesRule::class,
        EventsCarryAsEventAttributeRule::class,
        ExceptionsExtendBaseRule::class,
        JobHasQueueAttributeRule::class,
        JobImplementsFailedRule::class,
        CommandUsesAttributeSignatureRule::class,
        SeedersCarryAsSeederAttributeRule::class,
        ServiceProviderHasModuleAttributeRule::class,

        // Bonus source rule (namespace convention)
        NoHttpNamespaceNestingRule::class,
    ];

    /**
     * Path rules — inspect filesystem existence, not file
     * contents. Every entry extends {@see AbstractPathRule}
     * which takes a single `array<string, mixed>` config
     * constructor.
     *
     * @var list<class-string<AbstractPathRule>>
     */
    private array $pathRules = [
        NoRoutesFolderRule::class,
        NoResourcesFolderRule::class,
        NoAppFolderRule::class,
        NoRouteServiceProviderRule::class,
        NoServiceLayerRule::class,
        MigrationHasDownRule::class,
        NoEnvFileRule::class,
        RepositoryInterfaceSuffixRule::class,
    ];

    /**
     * Config merge — one entry, mapped under `architecture.*`.
     *
     * @var list<array{file: string, key: string}>
     */
    protected array $configs = [
        [
            'file' => __DIR__ . '/../../config/architecture.php',
            'key' => 'architecture',
        ],
    ];

    /**
     * Register-time wiring. Delegates to focused helpers so each
     * concern (parser / resolver / source rules / path rules /
     * command) stays inspectable in isolation.
     */
    protected function registerBespoke(): void
    {
        $this->registerParser();
        $this->registerResolver();
        $this->registerSourceRules();
        $this->registerPathRules();
        $this->registerCommand();
    }

    /**
     * Publish the config file under `architecture-config`.
     */
    protected function bootBespoke(): void
    {
        $this->publishes([
            __DIR__ . '/../../config/architecture.php' => $this->app->configPath('architecture.php'),
        ], 'architecture-config');
    }

    // ---------------------------------------------------------------
    // Register-time helpers.
    // ---------------------------------------------------------------

    /**
     * The parser is stateless — one instance per worker is enough.
     */
    private function registerParser(): void
    {
        $this->app->singleton(SourceFileParser::class, static fn (): SourceFileParser => new SourceFileParser());
    }

    /**
     * Build the {@see LayerResolver} from config. Bound singleton
     * because the config is captured at construction and the
     * resolver is otherwise stateless.
     */
    private function registerResolver(): void
    {
        $this->app->singleton(LayerResolver::class, static function (Application $app): LayerResolver {
            $config = $app->make('config');

            // Namespace map — keyed by LayerType->value. Filter
            // entries to string values only so a broken config
            // doesn't blow up the resolver at run time.
            /** @var mixed $rawNamespaces */
            $rawNamespaces = $config->get('architecture.namespaces', []);
            $namespaceMap = [];
            if (is_array($rawNamespaces)) {
                foreach ($rawNamespaces as $layerKey => $prefixes) {
                    if (! is_string($layerKey) || ! is_array($prefixes)) {
                        continue;
                    }

                    $sanitised = [];
                    foreach ($prefixes as $prefix) {
                        if (is_string($prefix) && $prefix !== '') {
                            $sanitised[] = $prefix;
                        }
                    }

                    if ($sanitised !== []) {
                        $namespaceMap[$layerKey] = $sanitised;
                    }
                }
            }

            // Base classes — flat lists per layer.
            /** @var mixed $rawBase */
            $rawBase = $config->get('architecture.base_classes', []);
            $modelBases = [];
            $controllerBases = [];
            if (is_array($rawBase)) {
                $modelBases = self::stringList($rawBase[LayerType::Model->value] ?? []);
                $controllerBases = self::stringList($rawBase[LayerType::Controller->value] ?? []);
            }

            $testPrefixes = self::stringList($config->get('architecture.test_path_prefixes', []));
            $infraPrefixes = self::stringList($config->get('architecture.infra_path_prefixes', []));

            return new LayerResolver(
                namespaceMap: $namespaceMap,
                modelBaseClasses: $modelBases,
                controllerBaseClasses: $controllerBases,
                testPathPrefixes: $testPrefixes,
                infraPathPrefixes: $infraPrefixes,
            );
        });
    }

    /**
     * Bind every source rule with its config subtree. Bindings
     * are transient (`bind()`) because each rule captures its
     * own config array — a singleton would freeze the first
     * resolution's config for the worker's lifetime.
     *
     * All bindings are tagged under `architecture.rules` so the
     * console command receives them via
     * `->tagged('architecture.rules')`.
     */
    private function registerSourceRules(): void
    {
        foreach ($this->sourceRules as $ruleClass) {
            $this->app->bind($ruleClass, function (Application $app) use ($ruleClass): ArchitectureRule {
                /** @var LayerResolver $resolver */
                $resolver = $app->make(LayerResolver::class);

                /** @var mixed $configPayload */
                $configPayload = $app->make('config')->get(
                    'architecture.rules.' . $this->ruleConfigKey($ruleClass),
                    [],
                );

                /** @var array<string, mixed> $safePayload */
                $safePayload = is_array($configPayload) ? $configPayload : [];

                // `new $ruleClass(...)` is safe here: the property
                // is typed `class-string<AbstractRule>` and every
                // AbstractRule constructor takes `(LayerResolver,
                // array<string, mixed>)`.
                return new $ruleClass($resolver, $safePayload);
            });
        }

        $this->app->tag($this->sourceRules, 'architecture.rules');
    }

    /**
     * Bind every path rule with its config subtree. Path rules
     * take only the config array (no LayerResolver — they
     * inspect the filesystem, not parsed source).
     *
     * Tagged under `architecture.path_rules`.
     */
    private function registerPathRules(): void
    {
        foreach ($this->pathRules as $ruleClass) {
            $this->app->bind($ruleClass, function (Application $app) use ($ruleClass): PathRule {
                /** @var mixed $configPayload */
                $configPayload = $app->make('config')->get(
                    'architecture.rules.' . $this->ruleConfigKey($ruleClass),
                    [],
                );

                /** @var array<string, mixed> $safePayload */
                $safePayload = is_array($configPayload) ? $configPayload : [];

                // Same safety argument as source rules: the
                // property is typed `class-string<AbstractPathRule>`,
                // and every AbstractPathRule constructor is
                // `(array<string, mixed>)`.
                return new $ruleClass($safePayload);
            });
        }

        $this->app->tag($this->pathRules, 'architecture.path_rules');
    }

    /**
     * Register the artisan command. Deferred to the console
     * context — the class isn't useful outside CLI.
     */
    private function registerCommand(): void
    {
        if ($this->app->runningInConsole()) {
            $this->app->singleton(ArchitectureCheckCommand::class, function (Application $app): ArchitectureCheckCommand {
                /** @var iterable<ArchitectureRule> $sourceRules */
                $sourceRules = $app->tagged('architecture.rules');
                /** @var iterable<PathRule> $pathRules */
                $pathRules = $app->tagged('architecture.path_rules');
                /** @var SourceFileParser $parser */
                $parser = $app->make(SourceFileParser::class);

                return new ArchitectureCheckCommand($sourceRules, $pathRules, $parser);
            });

            $this->commands([ArchitectureCheckCommand::class]);
        }
    }

    // ---------------------------------------------------------------
    // Utilities.
    // ---------------------------------------------------------------

    /**
     * Map a rule class to its `config('architecture.rules.<key>')`
     * subtree key. Rule id conventions:
     *
     *   `NoFormRequestRule`      → `no_form_request`
     *   `MigrationHasDownRule`   → `migration_has_down`
     *
     * We derive the key from the rule's class basename:
     * `FooBarRule` → `foo_bar` after stripping the `Rule` suffix
     * and PascalCase-to-snake_case conversion.
     *
     * @param  class-string  $ruleClass
     */
    private function ruleConfigKey(string $ruleClass): string
    {
        $reflection = new \ReflectionClass($ruleClass);
        $shortName = $reflection->getShortName();
        $withoutSuffix = str_ends_with($shortName, 'Rule') ? substr($shortName, 0, -4) : $shortName;

        return $this->pascalToSnake($withoutSuffix);
    }

    /** Convert PascalCase to snake_case without external helpers. */
    private function pascalToSnake(string $value): string
    {
        $snake = preg_replace('/([a-z0-9])([A-Z])/', '$1_$2', $value) ?? $value;

        return strtolower($snake);
    }

    /**
     * Filter a mixed value to `list<string>` — drop non-strings
     * silently. Used to sanitise config lookups where the shape
     * could drift.
     *
     * @return list<string>
     */
    private static function stringList(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        $out = [];
        foreach ($value as $entry) {
            if (is_string($entry) && $entry !== '') {
                $out[] = $entry;
            }
        }

        return $out;
    }
}
