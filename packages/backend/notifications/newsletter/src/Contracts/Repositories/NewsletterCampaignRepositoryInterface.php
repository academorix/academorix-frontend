<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\Newsletter\Models\NewsletterCampaign;
use Stackra\Newsletter\Repositories\EloquentNewsletterCampaignRepository;
use DateTimeInterface;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see NewsletterCampaign}.
 *
 * Adds the due-for-send finder + reputation-window aggregate on top
 * of the base CRUD surface.
 *
 * @extends RepositoryInterface<NewsletterCampaign>
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Bind(EloquentNewsletterCampaignRepository::class)]
interface NewsletterCampaignRepositoryInterface extends RepositoryInterface
{
    /**
     * Every campaign in `pending` state whose `scheduled_at` is at or
     * before `$now`. Consumed by the send-scheduled command.
     *
     * @return Collection<int, NewsletterCampaign>
     */
    public function findDueForSend(DateTimeInterface $now): Collection;

    /**
     * Completed campaigns for `$newsletterId` inside the reputation
     * evaluation window. Consumed by the reputation monitor.
     *
     * @return Collection<int, NewsletterCampaign>
     */
    public function findCompletedInWindow(string $newsletterId, DateTimeInterface $since): Collection;
}
