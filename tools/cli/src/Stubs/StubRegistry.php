<?php

/**
 * @file StubRegistry.php
 * @module Stackra\Cli\Stubs
 * @description Maps 69 logical stub names to their file paths under
 *   `src/Stubs/stubs/`. Population of `defaultStubs()` lives in
 *   `.kiro/specs/utils-work/stubs-tasks.md` — this class is authored by
 *   `cli-tasks.md`; the map is authored by stubs-tasks.
 */

declare(strict_types=1);

namespace Stackra\Cli\Stubs;

use Stackra\Cli\Exceptions\StubException;

/**
 * Central registry mapping `category.name` logical keys to relative
 * paths under `src/Stubs/stubs/`.
 */
final class StubRegistry
{
    /**
     * Base directory under which every stub file lives.
     */
    public const STUBS_ROOT = __DIR__.'/stubs';

    /**
     * @var array<string, string>
     */
    private array $stubs;

    public function __construct()
    {
        $this->stubs = self::defaultStubs();
    }

    /**
     * Resolve a logical stub name to an absolute path.
     *
     * @throws StubException when the logical name is unknown or the file
     *   is missing on disk.
     */
    public function pathFor(string $logicalName): string
    {
        if (! isset($this->stubs[$logicalName])) {
            throw StubException::forMissingStub($logicalName);
        }

        $absolute = self::STUBS_ROOT.'/'.$this->stubs[$logicalName];
        if (! is_file($absolute)) {
            throw StubException::forMissingStubFile($absolute);
        }

        return $absolute;
    }

    /**
     * True when the logical name is registered (does not check the file
     * exists on disk — use {@see pathFor()} for that).
     */
    public function has(string $logicalName): bool
    {
        return isset($this->stubs[$logicalName]);
    }

    /**
     * Register (or override) a single stub logically.
     */
    public function register(string $logicalName, string $relativePath): void
    {
        $this->stubs[$logicalName] = $relativePath;
    }

    /**
     * List every registered logical name.
     *
     * @return array<int, string>
     */
    public function names(): array
    {
        return array_keys($this->stubs);
    }

    /**
     * @return array<string, string>
     */
    public function all(): array
    {
        return $this->stubs;
    }

    /**
     * The canonical stub-name -> relative-path map. Populated in this
     * shape so `stubs-tasks.md` only touches this one method.
     *
     * @return array<string, string>
     */
    public static function defaultStubs(): array
    {
        return [
            // PHP (26)
            'php.action' => 'php/action.stub',
            'php.model' => 'php/model.stub',
            'php.model-interface' => 'php/model-interface.stub',
            'php.repository-interface' => 'php/repository-interface.stub',
            'php.repository' => 'php/repository.stub',
            'php.data-input' => 'php/data-input.stub',
            'php.data-output' => 'php/data-output.stub',
            'php.migration' => 'php/migration.stub',
            'php.factory' => 'php/factory.stub',
            'php.policy' => 'php/policy.stub',
            'php.enum-simple' => 'php/enum-simple.stub',
            'php.enum-metadata' => 'php/enum-metadata.stub',
            'php.command' => 'php/command.stub',
            'php.service-provider' => 'php/service-provider.stub',
            'php.event' => 'php/event.stub',
            'php.listener' => 'php/listener.stub',
            'php.job' => 'php/job.stub',
            'php.observer' => 'php/observer.stub',
            'php.middleware' => 'php/middleware.stub',
            'php.exception' => 'php/exception.stub',
            'php.value-object' => 'php/value-object.stub',
            'php.trait' => 'php/trait.stub',
            'php.attribute' => 'php/attribute.stub',
            'php.seeder' => 'php/seeder.stub',
            'php.mcp-tool' => 'php/mcp-tool.stub',
            'php.ai-tool' => 'php/ai-tool.stub',

            // React (18)
            'react.module-manifest' => 'react/module-manifest.stub',
            'react.page-list' => 'react/page-list.stub',
            'react.page-create' => 'react/page-create.stub',
            'react.page-edit' => 'react/page-edit.stub',
            'react.page-show' => 'react/page-show.stub',
            'react.form' => 'react/form.stub',
            'react.data-grid-columns' => 'react/data-grid-columns.stub',
            'react.hook' => 'react/hook.stub',
            'react.provider' => 'react/provider.stub',
            'react.i18n-en' => 'react/i18n-en.stub',
            'react.i18n-ar' => 'react/i18n-ar.stub',
            'react.di-module' => 'react/di-module.stub',
            'react.service' => 'react/service.stub',
            'react.registry' => 'react/registry.stub',
            'react.event-map' => 'react/event-map.stub',
            'react.event-payload' => 'react/event-payload.stub',
            'react.error-fallback' => 'react/error-fallback.stub',
            'react.component' => 'react/component.stub',

            // Native (8)
            'native.screen' => 'native/screen.stub',
            'native.list' => 'native/list-native.stub',
            'native.form' => 'native/form-native.stub',
            'native.component' => 'native/component-native.stub',
            'native.hook' => 'native/hook.stub',
            'native.provider' => 'native/provider.stub',
            'native.di-module' => 'native/di-module.stub',
            'native.icon-set' => 'native/icon-set.stub',

            // TypeScript (5)
            'typescript.catalog-entry' => 'typescript/catalog-entry.stub',
            'typescript.schema-request' => 'typescript/schema-request.stub',
            'typescript.schema-response' => 'typescript/schema-response.stub',
            'typescript.openapi-endpoint' => 'typescript/openapi-endpoint.stub',
            'typescript.ddl-model' => 'typescript/ddl-model.stub',

            // Config (5)
            'config.laravel' => 'config/laravel-config.stub',
            'config.package-json' => 'config/package-json.stub',
            'config.composer-json' => 'config/composer-json.stub',
            'config.tsup-config' => 'config/tsup-config.stub',
            'config.vitest-config' => 'config/vitest-config.stub',

            // Docs (7)
            'docs.adr' => 'docs/adr.stub',
            'docs.package-readme' => 'docs/package-readme.stub',
            'docs.runbook' => 'docs/runbook.stub',
            'docs.release-notes' => 'docs/release-notes.stub',
            'docs.erd' => 'docs/erd.stub',
            'docs.threat-model' => 'docs/threat-model.stub',
            'docs.architecture' => 'docs/architecture.stub',
        ];
    }
}
