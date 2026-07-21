<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\Newsletter\Models\NewsletterAudience;
use Stackra\Newsletter\Repositories\EloquentNewsletterAudienceRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see NewsletterAudience}.
 *
 * Adds finders for the newsletter-scoped default audience + the
 * stale-cache list on top of the base CRUD surface.
 *
 * @extends RepositoryInterface<NewsletterAudience>
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Bind(EloquentNewsletterAudienceRepository::class)]
interface NewsletterAudienceRepositoryInterface extends RepositoryInterface
{
    /**
     * Every audience defined for a newsletter, ordered by creation.
     *
     * @return Collection<int, NewsletterAudience>
     */
    public function findForNewsletter(string $newsletterId): Collection;

    /**
     * The `is_default = true` audience for the newsletter, or `null`
     * when the seeder hasn't run yet. Every well-formed newsletter
     * has exactly one default audience.
     */
    public function findDefaultForNewsletter(string $newsletterId): ?NewsletterAudience;

    /**
     * Audiences whose cached subscriber list is older than
     * `$maxAgeSeconds`. Consumed by the audience refresh command.
     *
     * @return Collection<int, NewsletterAudience>
     */
    public function findStaleCaches(int $maxAgeSeconds): Collection;
}
