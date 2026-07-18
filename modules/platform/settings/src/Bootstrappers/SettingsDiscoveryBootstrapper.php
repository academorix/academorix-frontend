<?php

declare(strict_types=1);

namespace Academorix\Settings\Bootstrappers;

use Academorix\Foundation\Contracts\DiscoversAttributes;
use Academorix\ServiceProvider\Attributes\AsBootstrapper;
use Academorix\ServiceProvider\Bootstrappers\AbstractBootstrapper;
use Academorix\Settings\Attributes\AsSetting;
use Academorix\Settings\Attributes\SettingField;
use Academorix\Settings\Attributes\SettingGroup;
use Academorix\Settings\Contracts\Services\SettingsRegistryInterface;
use Illuminate\Container\Attributes\Log;
use Illuminate\Container\Attributes\Singleton;
use Psr\Log\LoggerInterface;

/**
 * Discovers every `#[AsSetting]` class at app boot and hydrates the
 * shared {@see SettingsRegistryInterface}.
 *
 * For every discovered class, reflection reads:
 *  1. The single `#[AsSetting]` on the class — the group metadata.
 *  2. Zero or more `#[SettingGroup]` on the class — the visual sections.
 *  3. One `#[SettingField]` per property — the field catalogue.
 *
 * The bootstrapper is discovered via `#[AsBootstrapper]` (Path 2)
 * with priority `150` — inside the domain-modules band (100..199).
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[AsBootstrapper(priority: 150)]
#[Singleton]
final class SettingsDiscoveryBootstrapper extends AbstractBootstrapper
{
    public function __construct(
        private readonly DiscoversAttributes $discovery,
        private readonly SettingsRegistryInterface $registry,
        #[Log]
        private readonly LoggerInterface $log,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function name(): string
    {
        return 'settings.discovery';
    }

    /**
     * {@inheritDoc}
     */
    public function priority(): int
    {
        return 150;
    }

    /**
     * {@inheritDoc}
     */
    public function populate(): void
    {
        $discovered = 0;

        foreach ($this->discovery->forClass(AsSetting::class) as $target) {
            $className = $target->className;
            $attribute = $target->attribute;

            try {
                $reflection = new \ReflectionClass($className);
            } catch (\ReflectionException $e) {
                $this->log->warning('settings discovery: unreadable class', [
                    'class' => $className,
                    'error' => $e->getMessage(),
                ]);
                continue;
            }

            $groupMeta = [
                'key'         => $attribute->group,
                'label'       => $attribute->label !== '' ? $attribute->label : $attribute->group,
                'description' => $attribute->description,
                'icon'        => $attribute->icon,
                'permission'  => $attribute->permission,
                'scope'       => $attribute->scope,
                'public'      => $attribute->public,
                'sort_order'  => $attribute->sortOrder,
                'sections'    => $this->extractSections($reflection),
                'class'       => $className,
            ];

            $fields = $this->extractFields($reflection);

            try {
                $this->registry->register($attribute->group, $groupMeta, $fields);
                $discovered++;
            } catch (\Throwable $t) {
                $this->log->warning('settings discovery: duplicate or invalid group', [
                    'class' => $className,
                    'group' => $attribute->group,
                    'error' => $t->getMessage(),
                ]);
            }
        }

        $this->log->info('settings discovery complete', ['count' => $discovered]);
    }

    /**
     * Extract every `#[SettingGroup]` (class- and property-level)
     * from a settings class. Deduped by label.
     *
     * @param  \ReflectionClass<object>  $reflection
     * @return array<int, array<string, mixed>>
     */
    private function extractSections(\ReflectionClass $reflection): array
    {
        $sections = [];

        foreach ($reflection->getAttributes(SettingGroup::class) as $attr) {
            $instance                        = $attr->newInstance();
            $sections[$instance->label] = [
                'label'       => $instance->label,
                'description' => $instance->description,
                'icon'        => $instance->icon,
                'sort_order'  => $instance->sortOrder,
            ];
        }

        foreach ($reflection->getProperties() as $property) {
            foreach ($property->getAttributes(SettingGroup::class) as $attr) {
                $instance = $attr->newInstance();
                if (! isset($sections[$instance->label])) {
                    $sections[$instance->label] = [
                        'label'       => $instance->label,
                        'description' => $instance->description,
                        'icon'        => $instance->icon,
                        'sort_order'  => $instance->sortOrder,
                    ];
                }
            }
        }

        return \array_values($sections);
    }

    /**
     * Extract every `#[SettingField]` off the class properties.
     *
     * @param  \ReflectionClass<object>  $reflection
     * @return array<int, array<string, mixed>>
     */
    private function extractFields(\ReflectionClass $reflection): array
    {
        $fields = [];

        foreach ($reflection->getProperties() as $property) {
            foreach ($property->getAttributes(SettingField::class) as $attr) {
                $field                    = $attr->newInstance();
                $fields[] = [
                    'key'         => $field->key,
                    'type'        => $field->type,
                    'label'       => $field->label !== ''
                        ? $field->label
                        : $this->deriveLabel($property->getName()),
                    'default'     => $field->default,
                    'rules'       => $field->rules,
                    'sensitive'   => $field->sensitive,
                    'sort_order'  => $field->sortOrder,
                    'section'     => $field->section,
                    'description' => $field->description,
                    'placeholder' => $field->placeholder,
                    'help_text'   => $field->helpText,
                    'options'     => $field->options,
                    'min'         => $field->min,
                    'max'         => $field->max,
                    'step'        => $field->step,
                    'property'    => $property->getName(),
                ];
            }
        }

        return $fields;
    }

    /**
     * Turn a snake / camel-cased property name into a Title-Cased label
     * when the `#[SettingField]` didn't declare one explicitly.
     */
    private function deriveLabel(string $propertyName): string
    {
        $spaced = \preg_replace('/(?<!^)([A-Z])/', ' $1', $propertyName) ?? $propertyName;
        $spaced = \str_replace('_', ' ', $spaced);

        return \ucwords(\strtolower($spaced));
    }
}
