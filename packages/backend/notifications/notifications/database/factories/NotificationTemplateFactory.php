<?php

declare(strict_types=1);

namespace Academorix\Notifications\Database\Factories;

use Academorix\Notifications\Contracts\Data\NotificationTemplateInterface;
use Academorix\Notifications\Enums\NotificationChannel;
use Academorix\Notifications\Enums\TemplateState;
use Academorix\Notifications\Models\NotificationTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see NotificationTemplate}.
 *
 * @extends Factory<NotificationTemplate>
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class NotificationTemplateFactory extends Factory
{
    /**
     * @var class-string<NotificationTemplate>
     */
    protected $model = NotificationTemplate::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $stub = 'sample.' . Str::random(6);

        return [
            NotificationTemplateInterface::ATTR_ID                  => 'tpl_' . Str::ulid()->toBase32(),
            NotificationTemplateInterface::ATTR_TENANT_ID           => null,
            NotificationTemplateInterface::ATTR_KEY                 => $stub,
            NotificationTemplateInterface::ATTR_CATEGORY_SLUG       => $stub,
            NotificationTemplateInterface::ATTR_CHANNEL             => NotificationChannel::Mail->value,
            NotificationTemplateInterface::ATTR_LOCALE              => 'en',
            NotificationTemplateInterface::ATTR_VERSION             => 1,
            NotificationTemplateInterface::ATTR_STATE               => TemplateState::Draft->value,
            NotificationTemplateInterface::ATTR_IS_SYSTEM           => false,
            NotificationTemplateInterface::ATTR_SUBJECT_TEMPLATE    => 'Sample subject',
            NotificationTemplateInterface::ATTR_BODY_RENDERED_HTML  => '<p>Sample body</p>',
        ];
    }

    /**
     * State — a published system template.
     */
    public function system(): static
    {
        return $this->state(fn (): array => [
            NotificationTemplateInterface::ATTR_IS_SYSTEM    => true,
            NotificationTemplateInterface::ATTR_STATE        => TemplateState::Published->value,
            NotificationTemplateInterface::ATTR_PUBLISHED_AT => \now(),
        ]);
    }

    /**
     * State — a published tenant override.
     */
    public function published(): static
    {
        return $this->state(fn (): array => [
            NotificationTemplateInterface::ATTR_STATE        => TemplateState::Published->value,
            NotificationTemplateInterface::ATTR_PUBLISHED_AT => \now(),
        ]);
    }
}
