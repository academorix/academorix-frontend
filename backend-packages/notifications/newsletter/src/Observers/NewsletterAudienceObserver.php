<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Observers;

use Academorix\Newsletter\Contracts\Data\NewsletterAudienceInterface;
use Academorix\Newsletter\Events\NewsletterAudienceCreated;
use Academorix\Newsletter\Models\NewsletterAudience;
use Illuminate\Support\Str;

/**
 * Observer for the {@see NewsletterAudience} model.
 *
 * ## Hooks
 *
 *   - `creating` — normalise the slug.
 *   - `created`  — fire {@see NewsletterAudienceCreated}. The
 *     audience builder job is dispatched by the service that owns
 *     audience creation (rather than the observer) so we can bind
 *     to the DispatchGateway explicitly instead of via a global
 *     `dispatch()` helper.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterAudienceObserver
{
    /**
     * Normalise slug before insert.
     */
    public function creating(NewsletterAudience $audience): void
    {
        $slug = (string) ($audience->{NewsletterAudienceInterface::ATTR_SLUG} ?? '');
        if ($slug === '') {
            $slug = Str::slug((string) $audience->{NewsletterAudienceInterface::ATTR_NAME});
        }
        $audience->{NewsletterAudienceInterface::ATTR_SLUG} = Str::slug($slug);
    }

    /**
     * Fire the created event after insert.
     */
    public function created(NewsletterAudience $audience): void
    {
        NewsletterAudienceCreated::dispatch((string) $audience->getKey());
    }
}
