<?php

declare(strict_types=1);

namespace Academorix\Localization\Observers;

use Academorix\Localization\Contracts\Data\TranslationJobInterface;
use Academorix\Localization\Enums\TranslationJobStatus;
use Academorix\Localization\Events\TranslationJobCompleted;
use Academorix\Localization\Events\TranslationJobStarted;
use Academorix\Localization\Models\TranslationJob;

/**
 * Lifecycle side effects for {@see TranslationJob}.
 *
 * Fires the two domain events on status transitions
 * (`queued → running` = started; `running → completed` = completed).
 *
 * @category Localization
 *
 * @since    0.1.0
 */
final class TranslationJobObserver
{
    /**
     * `updated` — dispatch the state-transition events.
     */
    public function updated(TranslationJob $job): void
    {
        if (! $job->wasChanged(TranslationJobInterface::ATTR_STATUS)) {
            return;
        }

        $status = $job->{TranslationJobInterface::ATTR_STATUS};
        $current = $status instanceof TranslationJobStatus
            ? $status
            : TranslationJobStatus::tryFrom((string) $status);

        if ($current === null) {
            return;
        }

        match ($current) {
            TranslationJobStatus::Running   => TranslationJobStarted::dispatch(
                (string) $job->getKey(),
                (string) $job->{TranslationJobInterface::ATTR_TENANT_ID},
                (string) ($job->{TranslationJobInterface::ATTR_KIND}?->value ?? ''),
                (string) ($job->{TranslationJobInterface::ATTR_TARGET_LOCALE}),
                (string) ($job->{TranslationJobInterface::ATTR_DRIVER}?->value ?? ''),
            ),
            TranslationJobStatus::Completed => TranslationJobCompleted::dispatch(
                (string) $job->getKey(),
                (string) $job->{TranslationJobInterface::ATTR_TENANT_ID},
                (int) $job->{TranslationJobInterface::ATTR_TRANSLATED_KEYS},
                (int) $job->{TranslationJobInterface::ATTR_FAILED_KEYS},
            ),
            default => null,
        };
    }
}
