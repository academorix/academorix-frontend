<?php

declare(strict_types=1);

namespace Stackra\Notifications\Registry;

use Stackra\Notifications\Contracts\Registry\NotificationTemplateRegistryInterface;
use Illuminate\Container\Attributes\Singleton;

/**
 * In-memory registry of every published notification template.
 *
 * Populated by the seed pipeline (`notifications:seed-templates`)
 * from the emails renderer's manifest. The dispatch gateway
 * consults this registry to resolve `(key, channel, locale)` to a
 * rendered body without querying the DB every send.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Singleton]
final class NotificationTemplateRegistry implements NotificationTemplateRegistryInterface
{
    /**
     * Registered templates keyed by `<key>|<channel>|<locale>`.
     *
     * @var array<string, array{version: int, category_slug: string, body_rendered: string, subject_template: string}>
     */
    private array $templates = [];

    /**
     * {@inheritDoc}
     */
    public function register(
        string $key,
        string $channel,
        string $locale,
        int $version,
        string $categorySlug,
        string $bodyRendered,
        string $subjectTemplate,
    ): void {
        $this->templates[$this->indexKey($key, $channel, $locale)] = [
            'version'          => $version,
            'category_slug'    => $categorySlug,
            'body_rendered'    => $bodyRendered,
            'subject_template' => $subjectTemplate,
        ];
    }

    /**
     * {@inheritDoc}
     */
    public function has(string $key, string $channel, string $locale): bool
    {
        return isset($this->templates[$this->indexKey($key, $channel, $locale)]);
    }

    /**
     * {@inheritDoc}
     */
    public function all(): array
    {
        return $this->templates;
    }

    /**
     * Compose the composite index key.
     */
    private function indexKey(string $key, string $channel, string $locale): string
    {
        return \sprintf('%s|%s|%s', $key, $channel, $locale);
    }
}
