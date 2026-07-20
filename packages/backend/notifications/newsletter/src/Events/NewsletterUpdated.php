<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a newsletter's attributes change.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'newsletter.newsletter.updated')]
final readonly class NewsletterUpdated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  string        $newsletterId   Newsletter id.
     * @param  list<string>  $changedFields  Names of changed columns.
     */
    public function __construct(
        public string $newsletterId,
        public array $changedFields,
    ) {
    }
}
