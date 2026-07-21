<?php

declare(strict_types=1);

namespace Stackra\Domains\Observers;

use Stackra\Domains\Events\DomainRecordCreated;
use Stackra\Domains\Events\DomainRecordRemoved;
use Stackra\Domains\Events\DomainRecordUpdated;
use Stackra\Domains\Models\DomainRecord;

/**
 * Lifecycle side effects on {@see DomainRecord}.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
final class DomainRecordObserver
{
    public function created(DomainRecord $record): void
    {
        DomainRecordCreated::dispatch($record);
    }

    public function updated(DomainRecord $record): void
    {
        $dirty = \array_keys($record->getChanges());
        if ($dirty === []) {
            return;
        }

        DomainRecordUpdated::dispatch($record, $dirty);
    }

    public function deleted(DomainRecord $record): void
    {
        DomainRecordRemoved::dispatch(
            (string) $record->tenant_id,
            (string) $record->domain_id,
            (string) $record->getKey(),
        );
    }
}
