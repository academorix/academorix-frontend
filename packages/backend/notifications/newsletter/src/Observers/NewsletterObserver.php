<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Observers;

use Stackra\Newsletter\Contracts\Data\NewsletterInterface;
use Stackra\Newsletter\Enums\NewsletterStatus;
use Stackra\Newsletter\Events\NewsletterArchived;
use Stackra\Newsletter\Events\NewsletterCreated;
use Stackra\Newsletter\Events\NewsletterUpdated;
use Stackra\Newsletter\Models\Newsletter;
use Illuminate\Support\Str;

/**
 * Observer for the {@see Newsletter} model.
 *
 * ## Hooks
 *
 *   - `creating`  — apply platform-default reputation thresholds
 *     when the row doesn't ship its own, and normalise the slug.
 *   - `created`   — fire {@see NewsletterCreated}.
 *   - `updated`   — fire {@see NewsletterUpdated} + when status
 *     transitions to `archived`, also fire
 *     {@see NewsletterArchived}.
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/newsletter/observers.json
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterObserver
{
    /**
     * Populate defaults + normalise the slug before insert.
     */
    public function creating(Newsletter $newsletter): void
    {
        // Normalise slug — lowercase, dash-separated.
        $slug = (string) ($newsletter->{NewsletterInterface::ATTR_SLUG} ?? '');
        if ($slug === '') {
            $slug = Str::slug((string) $newsletter->{NewsletterInterface::ATTR_NAME});
        }
        $newsletter->{NewsletterInterface::ATTR_SLUG} = Str::slug($slug);

        // Apply platform-default reputation thresholds when missing.
        if ($newsletter->{NewsletterInterface::ATTR_REPUTATION_THRESHOLDS} === null) {
            $defaults = \config('newsletter.reputation.default_thresholds', []);
            $newsletter->{NewsletterInterface::ATTR_REPUTATION_THRESHOLDS} = \is_array($defaults)
                ? $defaults
                : [];
        }
    }

    /**
     * Fire the created event after insert.
     */
    public function created(Newsletter $newsletter): void
    {
        NewsletterCreated::dispatch(
            (string) $newsletter->getKey(),
            (string) $newsletter->{NewsletterInterface::ATTR_TENANT_ID},
            (string) $newsletter->{NewsletterInterface::ATTR_SLUG},
            (string) ($newsletter->{NewsletterInterface::ATTR_CADENCE} instanceof \BackedEnum
                ? $newsletter->{NewsletterInterface::ATTR_CADENCE}->value
                : $newsletter->{NewsletterInterface::ATTR_CADENCE}),
        );
    }

    /**
     * Fire the updated event + the archived event on state
     * transition.
     */
    public function updated(Newsletter $newsletter): void
    {
        $changed = \array_keys($newsletter->getChanges());
        if ($changed === []) {
            return;
        }

        NewsletterUpdated::dispatch((string) $newsletter->getKey(), $changed);

        // Detect the transition to archived — status originally
        // something else, now Archived.
        if (! \in_array(NewsletterInterface::ATTR_STATUS, $changed, true)) {
            return;
        }

        $current = $newsletter->{NewsletterInterface::ATTR_STATUS};
        $isArchived = $current === NewsletterStatus::Archived
            || $current === NewsletterStatus::Archived->value;

        if ($isArchived) {
            NewsletterArchived::dispatch((string) $newsletter->getKey(), null);
        }
    }
}
