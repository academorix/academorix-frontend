<?php

/**
 * @file packages/compliance/retention/src/Bootstrappers/RetentionPolicyBootstrapper.php
 *
 * @description
 * Populates {@see \Academorix\Retention\Registry\RetentionPolicyRegistry}
 * from every class carrying
 * {@see \Academorix\Retention\Attributes\AsRetentionPolicy}.
 *
 * ## Migration history
 *
 * Moved from `packages/compliance/retention/src/Discovery/RetentionPolicyDiscoveryBootstrapper.php`
 * in Phase 2.C — the class now sits under `Bootstrappers/`
 * alongside every other bootstrapper in the monorepo, and it
 * extends the canonical framework
 * {@see \Academorix\ServiceProvider\Bootstrappers\AbstractBootstrapper}
 * base.
 *
 * ## Why the shared discovery service
 *
 * Retention policies used to live as hand-maintained
 * `AiRetentionPolicies` (and equivalent) contributor stubs in each
 * domain package's `Retention/` folder. Marking the model itself
 * with `#[AsRetentionPolicy]` inverts that — the model IS the
 * retention subject and the marker IS its registration.
 *
 * ## Cache participation
 *
 * `toCachePayload()` serializes each entry as the full descriptor
 * shape (key, label, description, model FQCN, retention days,
 * action, date column). `fromCachePayload()` reconstructs the
 * descriptor and calls
 * {@see RetentionPolicyRegistry::registerDescriptor()} — duplicate
 * keys still bubble as `LogicException` so cache-based reloads
 * catch collisions.
 *
 * ## Reflection check
 *
 * The marker only makes sense on Eloquent models — the runner
 * calls `$modelClass::query()->where(...)`. Non-model markers log
 * WARNING + skip.
 */

declare(strict_types=1);

namespace Academorix\Retention\Bootstrappers;

use Academorix\Foundation\Contracts\DiscoversAttributes;
use Academorix\Retention\Attributes\AsRetentionPolicy;
use Academorix\Retention\Enums\RetentionAction;
use Academorix\Retention\Registry\RetentionPolicyRegistry;
use Academorix\Retention\Support\RetentionPolicyDescriptor;
use Academorix\ServiceProvider\Bootstrappers\AbstractBootstrapper;
use Illuminate\Container\Attributes\Log;
use Illuminate\Container\Attributes\Singleton;
use Illuminate\Database\Eloquent\Model;
use Psr\Log\LoggerInterface;
use ReflectionClass;
use Throwable;

/**
 * Attribute-driven retention-policy-registry populator.
 *
 * ## What this class owns
 *
 *  * Discovery via {@see DiscoversAttributes}.
 *  * Enabled-flag filtering.
 *  * Reflection check that the target is a subclass of
 *    {@see Model}.
 *  * Descriptor construction + registration with
 *    {@see RetentionPolicyRegistry}.
 *  * Cache pair — full descriptor field-set.
 *
 * @category Retention
 *
 * @since    0.1.0
 */
#[Singleton]
final class RetentionPolicyBootstrapper extends AbstractBootstrapper
{
    /**
     * @param  RetentionPolicyRegistry  $registry  Injected registry — mutated by {@see populate()}.
     * @param  DiscoversAttributes  $discovery  Shared discovery service.
     * @param  LoggerInterface  $log  Log channel for discovery-time warnings.
     */
    public function __construct(
        private readonly RetentionPolicyRegistry $registry,
        private readonly DiscoversAttributes $discovery,
        #[Log] private readonly LoggerInterface $log,
    ) {}

    /**
     * {@inheritDoc}
     */
    public function name(): string
    {
        return 'compliance.retention-policies';
    }

    /**
     * {@inheritDoc}
     *
     * `160` — domain-module band. Runs after most domain
     * primitives so retention decisions target the fully-loaded
     * model catalogue.
     */
    public function priority(): int
    {
        return 160;
    }

    /**
     * Discover every `#[AsRetentionPolicy]` + register with the
     * injected {@see RetentionPolicyRegistry}.
     */
    public function populate(): void
    {
        $registered = 0;

        foreach ($this->discovery->forClass(AsRetentionPolicy::class) as $target) {
            try {
                $registered += $this->registerTarget(
                    className: $target->className,
                    attribute: $target->attribute,
                );
            } catch (Throwable $e) {
                $this->log->warning('Retention-policy discovery skipped a class.', [
                    'class' => $target->className,
                    'exception' => $e::class,
                    'message' => $e->getMessage(),
                ]);
            }
        }

        $this->log->info('Retention-policy discovery completed.', [
            'registered' => $registered,
        ]);
    }

    /**
     * Serialize every registered descriptor.
     *
     * Reads {@see RetentionPolicyRegistry::descriptors()} which
     * returns descriptors in priority-ASC order — the cached
     * shape mirrors the runtime iteration order so a rehydrate
     * pass preserves stable ordering.
     *
     * @return list<array{key: string, label: string, description: string|null, modelClass: class-string<Model>, retentionDays: int, action: string, dateColumn: string}>|null
     */
    protected function toCachePayload(): mixed
    {
        $payload = [];

        foreach ($this->registry->descriptors() as $descriptor) {
            $payload[] = [
                'key' => $descriptor->key,
                'label' => $descriptor->label,
                'description' => $descriptor->description,
                'modelClass' => $descriptor->modelClass,
                'retentionDays' => $descriptor->retentionDays,
                'action' => $descriptor->action->value,
                'dateColumn' => $descriptor->dateColumn,
            ];
        }

        return $payload === [] ? null : $payload;
    }

    /**
     * Rehydrate the registry from a cached payload — reconstructs
     * each {@see RetentionPolicyDescriptor} and forwards to
     * `register()`.
     *
     * @param  mixed  $payload  Expected shape documented on {@see toCachePayload()}.
     * @return bool `true` when the payload was valid and applied.
     */
    protected function fromCachePayload(mixed $payload): bool
    {
        if (! is_array($payload)) {
            return false;
        }

        foreach ($payload as $entry) {
            if (! is_array($entry)) {
                return false;
            }

            $key = $entry['key'] ?? null;
            $label = $entry['label'] ?? null;
            $description = $entry['description'] ?? null;
            $modelClass = $entry['modelClass'] ?? null;
            $retentionDays = $entry['retentionDays'] ?? null;
            $actionValue = $entry['action'] ?? null;
            $dateColumn = $entry['dateColumn'] ?? null;

            if (! is_string($key)
                || ! is_string($label)
                || ! is_string($modelClass)
                || ! is_int($retentionDays)
                || ! is_string($actionValue)
                || ! is_string($dateColumn)
                || ($description !== null && ! is_string($description))
            ) {
                return false;
            }

            if (! class_exists($modelClass)) {
                return false;
            }

            $action = RetentionAction::tryFrom($actionValue);

            if ($action === null) {
                return false;
            }

            /** @var class-string<Model> $modelClass */
            $descriptor = new RetentionPolicyDescriptor(
                key: $key,
                label: $label,
                description: $description,
                modelClass: $modelClass,
                retentionDays: $retentionDays,
                action: $action,
                dateColumn: $dateColumn,
            );

            $this->registry->registerDescriptor($descriptor);
        }

        return true;
    }

    /**
     * Register one discovered class after verifying it is a
     * concrete Eloquent model.
     *
     * @param  class-string  $className
     * @param  object  $attribute  Expected `AsRetentionPolicy`.
     * @return int 1 when registered, 0 when skipped.
     */
    private function registerTarget(
        string $className,
        object $attribute,
    ): int {
        if (! $attribute instanceof AsRetentionPolicy) {
            return 0;
        }

        if (! $attribute->enabled) {
            return 0;
        }

        if (! class_exists($className)) {
            return 0;
        }

        $reflection = new ReflectionClass($className);

        if ($reflection->isAbstract() || ! $reflection->isInstantiable()) {
            return 0;
        }

        if (! $reflection->isSubclassOf(Model::class)) {
            $this->log->warning('#[AsRetentionPolicy] found on a class that is not an Eloquent model.', [
                'class' => $className,
                'expected_ancestor' => Model::class,
            ]);

            return 0;
        }

        /** @var class-string<Model> $className */
        $descriptor = new RetentionPolicyDescriptor(
            key: $attribute->key,
            label: $attribute->label,
            description: $attribute->description,
            modelClass: $className,
            retentionDays: $attribute->retentionDays,
            action: $attribute->action,
            dateColumn: $attribute->dateColumn,
        );

        $this->registry->registerDescriptor($descriptor);

        return 1;
    }
}
