<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\Newsletter\Models\NewsletterIssue;
use Stackra\Newsletter\Repositories\EloquentNewsletterIssueRepository;
use DateTimeInterface;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see NewsletterIssue}.
 *
 * Adds scheduling + due-list finders on top of the base CRUD
 * surface.
 *
 * @extends RepositoryInterface<NewsletterIssue>
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Bind(EloquentNewsletterIssueRepository::class)]
interface NewsletterIssueRepositoryInterface extends RepositoryInterface
{
    /**
     * Every issue for a given newsletter, newest-first.
     *
     * @return Collection<int, NewsletterIssue>
     */
    public function findForNewsletter(string $newsletterId, int $limit = 100): Collection;

    /**
     * Every issue in `scheduled` state whose `scheduled_at` is at or
     * before `$now`. Consumed by the `newsletter:send-scheduled`
     * command.
     *
     * @return Collection<int, NewsletterIssue>
     */
    public function findDueForSend(DateTimeInterface $now): Collection;
}
