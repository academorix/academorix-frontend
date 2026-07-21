<?php

declare(strict_types=1);

namespace Stackra\Settings\Bootstrappers;

use Stackra\Foundation\Contracts\DiscoversAttributes;
use Stackra\Settings\Attributes\AsSetting;
use Stackra\Settings\Attributes\SettingField;
use Stackra\Settings\Attributes\SettingGroup;
use Stackra\Settings\Contracts\SettingsRegistryInterface;
use Stackra\Settings\Data\SettingDefinitionData;
use Stackra\Settings\Data\SettingFieldData;
use Stackra\Settings\Data\SettingGroupData;
use Stackra\ServiceProvider\Bootstrappers\AbstractBootstrapper;
use Illuminate\Container\Attributes\Log;
use Illuminate\Container\Attributes\Singleton;
use Psr\Log\LoggerInterface;
use ReflectionClass;
use Spatie\LaravelSettings\Settings;
use Throwable;

/**
 * Category-1 discovery bootstrapper for {@see AsSetting}.
 *
 * Walks every class carrying `#[AsSetting]` at boot, reflection-
 * inspects each public property for `#[SettingField]` +
 * `#[SettingGroup]` attributes, builds a
 * {@see SettingDefinitionData} DTO per group, and registers each
 * with the shared {@see SettingsRegistryInterface}.
 *
 * The registry is the seam every read path uses at runtime — the
 * `SettingsService`, the schema endpoint, the schema-driven
 * `UpdateSettingsRequestData` validator. Hydrating it once at
 * boot means zero runtime reflection on the hot path.
 *
 * ## Contract checks
 *
 * A discovered class MUST:
 *
 *   1. Extend `Spatie\LaravelSettings\Settings`.
 *   2. Declare a group key matching the scope-consumer regex
 *      `^[a-z][a-z0-9_]{0,63}$` per
 *      `.kiro/steering/settings.md` §7.
 *   3. Provide at least one public property (an `AsSetting`
 *      without fields is registered as a diagnostic warning but
 *      contributes nothing to the schema).
 *
 * Failed checks log a WARNING + skip. Discovery never halts app
 * boot per `.kiro/steering/bootstrappers.md` §Anti-patterns.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Singleton]
final class SettingsBootstrapper extends AbstractBootstrapper
{
    /**
     * Group-key format enforced by
     * `.kiro/steering/settings.md` §7. The scope consumer
     * registry uses the same regex — divergence here would allow
     * settings to declare group keys the substrate rejects at
     * write time.
     */
    private const string GROUP_KEY_PATTERN = '/^[a-z][a-z0-9_]{0,63}$/';

    /**
     * @param  SettingsRegistryInterface  $registry  Shared registry, populated by `populate()`.
     * @param  DiscoversAttributes  $discovery  Canonical discovery seam.
     * @param  LoggerInterface  $log  Log channel for discovery warnings.
     */
    public function __construct(
        private readonly SettingsRegistryInterface $registry,
        private readonly DiscoversAttributes $discovery,
        #[Log] private readonly LoggerInterface $log,
    ) {}

    /**
     * {@inheritDoc}
     */
    public function name(): string
    {
        return 'framework.settings.groups';
    }

    /**
     * {@inheritDoc}
     *
     * `130` — domain-module band. Runs after the framework
     * primitives (auth, cache, container attributes) but before
     * consumer overlays.
     */
    public function priority(): int
    {
        return 130;
    }

    /**
     * Discover every `#[AsSetting]` + register with the registry.
     */
    public function populate(): void
    {
        $registered = 0;
        $rejected = 0;

        foreach ($this->discovery->forClass(AsSetting::class) as $target) {
            try {
                if ($this->registerTarget($target->className, $target->attribute)) {
                    $registered++;
                } else {
                    $rejected++;
                }
            } catch (Throwable $e) {
                $rejected++;

                $this->log->warning('#[AsSetting] discovery skipped a class.', [
                    'class' => $target->className,
                    'exception' => $e::class,
                    'message' => $e->getMessage(),
                ]);
            }
        }

        $this->log->info('#[AsSetting] discovery complete.', [
            'registered' => $registered,
            'rejected' => $rejected,
        ]);
    }

    /**
     * Verify + register one discovered target.
     *
     * @param  class-string  $className  Candidate `Settings` class.
     * @param  object  $attribute  Expected {@see AsSetting}.
     */
    private function registerTarget(string $className, object $attribute): bool
    {
        if (! $attribute instanceof AsSetting) {
            return false;
        }

        if (! class_exists($className)) {
            return false;
        }

        $reflection = new ReflectionClass($className);

        if ($reflection->isAbstract() || ! $reflection->isInstantiable()) {
            return false;
        }

        if (! $reflection->isSubclassOf(Settings::class)) {
            $this->log->warning('#[AsSetting] target does not extend Spatie\\LaravelSettings\\Settings.', [
                'class' => $className,
            ]);

            return false;
        }

        if (preg_match(self::GROUP_KEY_PATTERN, $attribute->group) !== 1) {
            $this->log->warning('#[AsSetting] group key does not match the scope-consumer regex.', [
                'class' => $className,
                'group' => $attribute->group,
                'regex' => self::GROUP_KEY_PATTERN,
            ]);

            return false;
        }

        $definition = $this->buildDefinition($reflection, $attribute);

        $this->registry->register($attribute->group, $definition);

        return true;
    }

    /**
     * Build the full {@see SettingDefinitionData} DTO by walking
     * the class's public properties.
     *
     * @param  ReflectionClass<Settings>  $reflection
     */
    private function buildDefinition(ReflectionClass $reflection, AsSetting $attribute): SettingDefinitionData
    {
        /** @var list<SettingFieldData> $fields */
        $fields = [];

        /** @var array<string, SettingGroupData> $groups */
        $groups = [];

        foreach ($reflection->getProperties(\ReflectionProperty::IS_PUBLIC) as $property) {
            if ($property->isStatic()) {
                continue;
            }

            $fieldAttrs = $property->getAttributes(SettingField::class);

            if ($fieldAttrs === []) {
                continue;
            }

            /** @var SettingField $fieldAttr */
            $fieldAttr = $fieldAttrs[0]->newInstance();

            $default = $property->hasDefaultValue()
                ? $property->getDefaultValue()
                : $fieldAttr->defaultValue;

            $fields[] = new SettingFieldData(
                key: $property->getName(),
                controlType: $fieldAttr->controlTypeValue(),
                label: $fieldAttr->label !== '' ? $fieldAttr->label : $this->humanise($property->getName()),
                placeholder: $fieldAttr->placeholder,
                validation: $fieldAttr->validation,
                defaultValue: $default,
                sortOrder: $fieldAttr->sortOrder,
                group: $fieldAttr->group,
                options: $fieldAttr->resolveOptions(),
                sensitive: $fieldAttr->sensitive,
                helpText: $fieldAttr->helpText,
                min: $fieldAttr->min,
                max: $fieldAttr->max,
                step: $fieldAttr->step,
            );

            foreach ($property->getAttributes(SettingGroup::class) as $groupAttrReflection) {
                /** @var SettingGroup $groupAttr */
                $groupAttr = $groupAttrReflection->newInstance();

                $groups[$groupAttr->label] = new SettingGroupData(
                    label: $groupAttr->label,
                    description: $groupAttr->description,
                    icon: $groupAttr->icon,
                    sortOrder: $groupAttr->sortOrder,
                );
            }
        }

        return new SettingDefinitionData(
            group: $attribute->group,
            label: $attribute->label !== '' ? $attribute->label : $this->humanise($attribute->group),
            description: $attribute->description,
            icon: $attribute->icon,
            permission: $attribute->permission,
            scope: $attribute->scope,
            public: $attribute->public,
            sortOrder: $attribute->sortOrder,
            className: $reflection->getName(),
            fields: $fields,
            groups: array_values($groups),
        );
    }

    /**
     * Turn `some_snake_case` into `Some Snake Case` for
     * fallback labels.
     */
    private function humanise(string $raw): string
    {
        return ucwords(str_replace(['_', '-'], ' ', $raw));
    }
}
