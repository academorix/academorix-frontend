<?php

declare(strict_types=1);

namespace Stackra\Notifications\Contracts\Services;

use Stackra\Notifications\Services\NotificationTemplateRegistry;
use Illuminate\Container\Attributes\Bind;

/**
 * In-memory registry of every `#[NotificationTemplate]`-marked class
 * discovered at boot AND every published template row.
 *
 * The dispatch gateway consults this registry to resolve the
 * `(key, channel, locale)` tuple to a rendered body; the tenant admin
 * surface enumerates available templates through `all()`.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Bind(NotificationTemplateRegistry::class)]
interface NotificationTemplateRegistryInterface
{
    /**
     * Register a template.
     *
     * @param  string  $key            Template key.
     * @param  string  $channel        Channel key.
     * @param  string  $locale         Locale.
     * @param  int     $version        Version number (monotonic per key+channel+locale).
     * @param  string  $categorySlug   Owning category slug.
     * @param  string  $bodyRendered   Pre-rendered HTML with Blade placeholders.
     * @param  string  $subjectTemplate Subject line template.
     */
    public function register(
        string $key,
        string $channel,
        string $locale,
        int $version,
        string $categorySlug,
        string $bodyRendered,
        string $subjectTemplate,
    ): void;

    /**
     * Whether a template for the tuple exists in the registry.
     */
    public function has(string $key, string $channel, string $locale): bool;

    /**
     * Every registered template keyed by `<key>|<channel>|<locale>`.
     *
     * @return array<string, array{version: int, category_slug: string, body_rendered: string, subject_template: string}>
     */
    public function all(): array;
}
