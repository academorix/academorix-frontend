<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Events;

use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a new NewsletterAudience is persisted.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'newsletter.audience.created')]
final readonly class NewsletterAudienceCreated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public string $audienceId)
    {
    }
}
