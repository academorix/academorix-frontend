<?php

declare(strict_types=1);

namespace Academorix\Notifications\Observers;

use Academorix\Notifications\Contracts\Data\NotificationTemplateInterface;
use Academorix\Notifications\Enums\TemplateState;
use Academorix\Notifications\Events\TemplatePublished;
use Academorix\Notifications\Models\NotificationTemplate;

/**
 * Lifecycle side effects on {@see NotificationTemplate}.
 *
 * Fires `TemplatePublished` on state transitions into `published`.
 * Change-management audit rows come from the composed `Auditable`
 * trait — no explicit audit call here.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
final class NotificationTemplateObserver
{
    /**
     * `updated` — inspect the dirty state transition.
     */
    public function updated(NotificationTemplate $template): void
    {
        if (! $template->wasChanged(NotificationTemplateInterface::ATTR_STATE)) {
            return;
        }

        $stateValue = $template->{NotificationTemplateInterface::ATTR_STATE};
        $state = $stateValue instanceof TemplateState
            ? $stateValue
            : TemplateState::tryFrom((string) $stateValue);

        if ($state === TemplateState::Published) {
            TemplatePublished::dispatch($template);
        }
    }
}
