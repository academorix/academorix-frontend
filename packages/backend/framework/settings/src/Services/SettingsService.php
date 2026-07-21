<?php

declare(strict_types=1);

namespace Stackra\Settings\Services;

use Stackra\Scope\Contracts\ScopeContextInterface;
use Stackra\Scope\Contracts\ScopeResolutionInterface;
use Stackra\Settings\Contracts\SettingsRegistryInterface;
use Stackra\Settings\Contracts\SettingsServiceInterface;
use Stackra\Settings\Data\SettingDefinitionData;
use Stackra\Settings\Data\SettingFieldData;
use Stackra\Settings\Events\AppUpdateEvent;
use Stackra\Settings\Events\SettingsChangeEvent;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Contracts\Container\Container;
use Illuminate\Contracts\Events\Dispatcher as EventDispatcher;
use InvalidArgumentException;
use Spatie\LaravelSettings\Settings;

/**
 * Reference implementation of {@see SettingsServiceInterface}.
 *
 * Delegates every hierarchy concern to `stackra/scope` — the
 * scope substrate resolves values by walking the active node's
 * materialised path (`global → application → tenant → org →
 * region → branch → team → user`), so this service never touches
 * a `settings` table nor computes a tenant / user prefix itself.
 *
 * ## Read path
 *
 *   1. Look up the group's definition in the registry
 *      ({@see SettingsRegistryInterface}). Unknown group → 404.
 *   2. Ask the scope resolver for every stored key under the
 *      `{group}.` prefix inside the `settings` namespace.
 *   3. Merge the stored values on top of the class-instance
 *      property defaults — the fallback is the Spatie Settings
 *      class's own defaults, NOT another storage layer.
 *
 * ## Write path
 *
 *   1. Load the current values (via the read path above).
 *   2. Diff against the incoming values — write only changed
 *      fields.
 *   3. For each changed field, call
 *      {@see ScopeResolutionInterface::write()} against the
 *      current node. The substrate handles namespace validation
 *      + audit + tenant scoping.
 *   4. Dispatch `SettingsChangeEvent` — the two shipped
 *      listeners publish the change to `activity_log` +
 *      `audits`.
 *
 * ## Octane safety
 *
 * `#[Scoped]` — one instance per request. Every collaborator is
 * constructor-injected. Zero facade calls, zero static state.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Scoped]
final class SettingsService implements SettingsServiceInterface
{
    /**
     * @param  SettingsRegistryInterface  $registry  Settings-definition registry.
     * @param  ScopeResolutionInterface  $resolution  Scope resolver — reads / writes cascading values under the `settings` namespace.
     * @param  ScopeContextInterface  $scopeContext  Active-scope reader — provides the current node for writes.
     * @param  Container  $container  Typed container factory — resolves runtime-determined Spatie Settings class-strings for property-default reads.
     * @param  EventDispatcher  $events  Injected event dispatcher — publishes `SettingsChangeEvent` after successful writes.
     */
    public function __construct(
        private readonly SettingsRegistryInterface $registry,
        private readonly ScopeResolutionInterface $resolution,
        private readonly ScopeContextInterface $scopeContext,
        private readonly Container $container,
        private readonly EventDispatcher $events,
    ) {}

    /**
     * {@inheritDoc}
     */
    public function getGroup(string $group): array
    {
        $definition = $this->resolveDefinition($group);

        // Start with the Spatie Settings class's property defaults
        // — this is the "system tier" of the cascade.
        $values = $this->loadDefaults($definition);

        // Overlay every value the scope resolver returned for the
        // group. `resolveMany` walks the active node's materialised
        // path and returns the first stored value per key, so the
        // full tenant / user cascade is already baked in.
        $resolved = $this->resolution->resolveMany('settings', "{$group}.");

        foreach ($resolved as $fullKey => $resolvedValue) {
            $shortKey = substr($fullKey, strlen($group) + 1);

            if ($shortKey === '' || ! array_key_exists($shortKey, $values)) {
                continue;
            }

            $values[$shortKey] = $resolvedValue->value;
        }

        return $values;
    }

    /**
     * {@inheritDoc}
     */
    public function updateGroup(string $group, array $values): array
    {
        $definition = $this->resolveDefinition($group);
        $existing = $this->getGroup($group);
        $merged = [...$existing, ...$values];

        $changedFields = [];
        $changedValues = [];

        foreach ($values as $key => $newValue) {
            $oldValue = $existing[$key] ?? null;

            if ($oldValue !== $newValue) {
                $changedFields[] = $key;
                $changedValues[$key] = $newValue;
            }
        }

        if ($changedFields === []) {
            return $merged;
        }

        // Writes always target the active scope node. The
        // middleware sets the context before this action runs; a
        // console command that needs to write must wrap the call
        // in `Scope::runInNode(...)`.
        $context = $this->scopeContext->currentOrFail();
        $node = $context->node;

        foreach ($changedValues as $key => $newValue) {
            $this->resolution->write(
                namespace: 'settings',
                node: $node,
                key: "{$group}.{$key}",
                value: $newValue,
            );
        }

        $this->events->dispatch(new SettingsChangeEvent(
            group: $group,
            changedFields: $changedFields,
            values: $changedValues,
            tenantId: $this->tenantIdFromContext($context),
            timestamp: time(),
        ));

        if ($group === 'app_version') {
            $this->dispatchAppUpdateEvent($merged);
        }

        return $merged;
    }

    /**
     * {@inheritDoc}
     */
    public function getSchema(?string $permission = null): array
    {
        $schema = $this->registry->getSchema();

        if ($permission === null) {
            return $schema;
        }

        return array_values(array_filter(
            $schema,
            static fn (array $entry): bool => ($entry['permission'] ?? null) === $permission,
        ));
    }

    /**
     * Resolve the group's definition from the registry. Throws
     * with a clear message when the group isn't registered.
     */
    private function resolveDefinition(string $group): SettingDefinitionData
    {
        $definition = $this->registry->get($group);

        if (! $definition instanceof SettingDefinitionData) {
            throw new InvalidArgumentException(sprintf(
                "Settings group '%s' is not registered in the SettingsRegistry.",
                $group,
            ));
        }

        return $definition;
    }

    /**
     * Read the property defaults from the Spatie Settings class
     * instance — this is the fallback tier when the scope
     * resolver finds nothing at any node in the cascade.
     *
     * @return array<string, mixed>
     */
    private function loadDefaults(SettingDefinitionData $definition): array
    {
        /** @var Settings $settings */
        $settings = $this->container->make($definition->className);

        $values = [];

        foreach ($definition->fields as $field) {
            if (property_exists($settings, $field->key)) {
                /** @var mixed $value */
                $value = $settings->{$field->key};
                $values[$field->key] = $value;
            } else {
                $values[$field->key] = $this->fallbackDefault($field);
            }
        }

        return $values;
    }

    /**
     * Fallback default for a field that doesn't have a matching
     * property on the settings class — reads the attribute's
     * `defaultValue` argument.
     */
    private function fallbackDefault(SettingFieldData $field): mixed
    {
        return $field->defaultValue;
    }

    /**
     * Extract the tenant id from the active scope context, when
     * available. The event carries it as a fallback for
     * consumers that key on tenant instead of the full scope
     * node — most notably the `activity_log` retention runner.
     */
    private function tenantIdFromContext(mixed $context): ?int
    {
        if (! is_object($context) || ! property_exists($context, 'tenantId')) {
            return null;
        }

        /** @var mixed $raw */
        $raw = $context->tenantId ?? null;

        if (is_int($raw)) {
            return $raw;
        }

        if (is_string($raw) && ctype_digit($raw)) {
            return (int) $raw;
        }

        return null;
    }

    /**
     * Dispatch the app-update broadcast when the `app_version`
     * group is written.
     *
     * @param  array<string, mixed>  $values
     */
    private function dispatchAppUpdateEvent(array $values): void
    {
        $this->events->dispatch(new AppUpdateEvent(
            version: (string) ($values['current_version'] ?? ''),
            mandatory: (bool) ($values['mandatory'] ?? false),
            webUpdateUrl: (string) ($values['web_update_url'] ?? ''),
            desktopUpdateUrl: (string) ($values['desktop_update_url'] ?? ''),
            mobileUpdateUrl: (string) ($values['mobile_update_url'] ?? ''),
            releaseNotesUrl: (string) ($values['release_notes_url'] ?? ''),
            webAvailable: (bool) ($values['web_update_available'] ?? false),
            desktopAvailable: (bool) ($values['desktop_update_available'] ?? false),
            mobileAvailable: (bool) ($values['mobile_update_available'] ?? false),
            timestamp: time(),
        ));
    }
}
