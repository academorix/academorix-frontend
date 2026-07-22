<?php

declare(strict_types=1);

/**
 * @file packages/crud/src/Concerns/Discovery/HasDiscoverableRepositories.php
 *
 * @description
 * Trait that adds `#[AsRepository]` discovery to a service provider (or
 * any host with access to the service container) and pre-resolves the
 * per-repository attribute configuration into the
 * {@see RepositoryConfigRegistry}. Resolves the unified
 * {@see \Stackra\Foundation\Contracts\DiscoversAttributes} contract
 * — no direct dependency on the underlying attribute-manifest backend
 * (currently `olvlvl/composer-attribute-collector`, wrapped by
 * {@see \Stackra\Foundation\Discovery\AttributeDiscovery}).
 *
 * ## Two-layer attribute read
 *
 * Repository-side attributes ({@see AsRepository}, {@see WithRelations},
 * {@see WithCount}, {@see OrderBy}, {@see UseCriteria}, {@see UseScope},
 * {@see UseQueryScope}, {@see Filterable}, {@see UseModel}) are enumerated
 * via `DiscoversAttributes::forClass()` — no runtime reflection.
 *
 * Model-side attributes ({@see Searchable}, {@see Sortable},
 * {@see Translatable}) live on the model class named in
 * `#[UseModel(ModelInterface::class)]`, which is a class-string that
 * cannot be enumerated statically. Those attributes are read with a
 * single {@see ReflectionClass} lookup per model. This is the ONLY
 * place in the discovery pipeline where runtime reflection fires;
 * caching happens at the registry layer.
 *
 * ## Failure isolation
 *
 * A single misconfigured repository must not stop the rest of the
 * discovery pass. Each hit is wrapped in its own try/catch — the
 * offending repository is logged and skipped.
 *
 * @category Concerns
 *
 * @since 2.0.0
 */

namespace Stackra\Crud\Concerns\Discovery;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\OrderBy;
use Stackra\Crud\Attributes\UseCriteria;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Attributes\UseQueryScope;
use Stackra\Crud\Attributes\UseScope;
use Stackra\Crud\Attributes\WithCount;
use Stackra\Crud\Attributes\WithRelations;
use Stackra\Crud\Registry\RepositoryConfigRegistry;
use Stackra\Database\Attributes\Searchable;
use Stackra\Database\Attributes\Sortable;
use Stackra\Database\Attributes\Translatable;
use Stackra\Foundation\Contracts\DiscoversAttributes;
use ReflectionClass;
use Throwable;

/**
 * Discovers repositories annotated with `#[AsRepository]` and
 * pre-resolves all their attribute configurations into the
 * {@see RepositoryConfigRegistry}.
 *
 * @since 2.0.0
 */
trait HasDiscoverableRepositories
{
    /**
     * Discover every class carrying `#[AsRepository]` and pre-resolve
     * every attribute configuration into the
     * {@see RepositoryConfigRegistry}.
     *
     * The underlying {@see DiscoversAttributes} implementation gracefully
     * returns an empty iterable when the composer-attribute manifest
     * has not been written yet, so no defensive `class_exists()` guard
     * is required here.
     *
     * @return int Number of repositories successfully registered.
     */
    protected function discoverRepositories(): int
    {
        /** @var DiscoversAttributes $discovery */
        $discovery = resolve(DiscoversAttributes::class);

        /** @var RepositoryConfigRegistry $registry */
        $registry = resolve(RepositoryConfigRegistry::class);

        $discovered = 0;

        foreach ($discovery->forClass(AsRepository::class) as $target) {
            $className = $target->className;

            try {
                $config = $this->buildRepositoryConfig($className);
                $registry->register(...$config);
                $discovered++;
            } catch (Throwable $exception) {
                // Isolate the failure — a single bad repository must
                // not blow up the entire boot sequence.
                logger()->error(
                    "Failed to register repository [{$className}]: {$exception->getMessage()}",
                );
            }
        }

        return $discovered;
    }

    /**
     * Reflect on a single repository class and pre-resolve every
     * attribute pinned to the class (and its associated model) into
     * the flat, cache-friendly shape the
     * {@see RepositoryConfigRegistry} accepts.
     *
     * ## Why reflection here
     *
     * {@see DiscoversAttributes} exposes attribute targets one attribute
     * class at a time. To read the FULL class-attribute list for a
     * given repository (multiple attribute classes, some of them
     * repeatable) we need `ReflectionClass::getAttributes()` — that's
     * the only aggregation shape PHP ships. The reflection cost is
     * amortised across the boot-once discovery pass and the registry
     * caches the result.
     *
     * @param  class-string  $className  The repository FQCN.
     * @return array<string, mixed> Kwarg-shaped array ready for
     *         {@see RepositoryConfigRegistry::register()}.
     */
    private function buildRepositoryConfig(string $className): array
    {
        $ref = new ReflectionClass($className);

        // Model interface — the class-string named in #[UseModel(...)].
        $model = null;
        foreach ($ref->getAttributes(UseModel::class) as $attr) {
            $model = $attr->newInstance()->interface;
            break;
        }

        // Repeatable attribute — merge every instance's payload.
        $withRelations = [];
        foreach ($ref->getAttributes(WithRelations::class) as $attr) {
            /** @var WithRelations $instance */
            $instance = $attr->newInstance();
            $withRelations = [...$withRelations, ...$instance->relations];
        }

        $withCount = [];
        foreach ($ref->getAttributes(WithCount::class) as $attr) {
            /** @var WithCount $instance */
            $instance = $attr->newInstance();
            $withCount = [...$withCount, ...$instance->relations];
        }

        $orderBy = [];
        foreach ($ref->getAttributes(OrderBy::class) as $attr) {
            /** @var OrderBy $instance */
            $instance = $attr->newInstance();
            $orderBy[] = ['column' => $instance->column, 'direction' => $instance->direction];
        }

        $criteria = [];
        foreach ($ref->getAttributes(UseCriteria::class) as $attr) {
            /** @var UseCriteria $instance */
            $instance = $attr->newInstance();
            $criteria = [...$criteria, ...$instance->criteria];
        }

        $scopes = [];
        foreach ($ref->getAttributes(UseScope::class) as $attr) {
            /** @var UseScope $instance */
            $instance = $attr->newInstance();
            $scopes = [...$scopes, ...$instance->scopes];
        }

        $queryScopes = [];
        foreach ($ref->getAttributes(UseQueryScope::class) as $attr) {
            $queryScopes[] = $attr->newInstance();
        }

        // Single-instance attribute — first hit wins.
        $filterable = '*';
        foreach ($ref->getAttributes(Filterable::class) as $attr) {
            /** @var Filterable $instance */
            $instance = $attr->newInstance();
            $filterable = $instance->fields;
            break;
        }

        // Sortable / Searchable / Translatable live on the MODEL, not
        // the repository — a single source of truth for data-shape
        // metadata. See class docblock for the reflection rationale.
        $sortable = '*';
        $searchable = [];
        $translatable = [];
        $defaultLocale = null;

        if ($model !== null && class_exists($model)) {
            $modelRef = new ReflectionClass($model);

            foreach ($modelRef->getAttributes(Sortable::class) as $attr) {
                /** @var Sortable $instance */
                $instance = $attr->newInstance();
                $sortable = $instance->fields;
                break;
            }

            foreach ($modelRef->getAttributes(Searchable::class) as $attr) {
                /** @var Searchable $instance */
                $instance = $attr->newInstance();
                $searchable = $instance->fields;
                break;
            }

            foreach ($modelRef->getAttributes(Translatable::class) as $attr) {
                /** @var Translatable $instance */
                $instance = $attr->newInstance();
                $translatable = $instance->fields;
                $defaultLocale = $instance->defaultLocale;
                break;
            }
        }

        return [
            'repositoryClass' => $className,
            'withRelations' => $withRelations,
            'withCount' => $withCount,
            'orderBy' => $orderBy,
            'searchable' => $searchable,
            'model' => $model,
            'criteria' => $criteria,
            'scopes' => $scopes,
            'filterable' => $filterable,
            'sortable' => $sortable,
            'translatable' => $translatable,
            'defaultLocale' => $defaultLocale,
            'queryScopes' => $queryScopes,
        ];
    }
}
