<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a new {@see \Academorix\Newsletter\Models\Newsletter}
 * row is persisted.
 *
 * ## Consumers
 *   - `compliance::AuditListener` — writes the audit trail entry.
 *   - `newsletter::CreateDefaultAudience` — seeds the default
 *     audience segment.
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/newsletter/events.json
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'newsletter.newsletter.created')]
final readonly class NewsletterCreated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  string  $newsletterId  Persisted newsletter id (`nlp_<ulid>`).
     * @param  string  $tenantId      Owning tenant id.
     * @param  string  $slug          Tenant-unique slug.
     * @param  string  $cadence       Cadence backing value.
     */
    public function __construct(
        public string $newsletterId,
        public string $tenantId,
        public string $slug,
        public string $cadence,
    ) {
    }
}
