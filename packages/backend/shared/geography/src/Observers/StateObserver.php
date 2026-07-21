<?php

declare(strict_types=1);

namespace Stackra\Geography\Observers;

use Stackra\Geography\Contracts\Data\CityInterface;
use Stackra\Geography\Contracts\Data\StateInterface;
use Stackra\Geography\Events\Domain\StateCreated;
use Stackra\Geography\Events\Domain\StateDeleted;
use Stackra\Geography\Events\Domain\StateUpdated;
use Stackra\Geography\Models\City;
use Stackra\Geography\Models\State;
use InvalidArgumentException;

/**
 * Lifecycle side effects for {@see State}.
 *
 * Normalises `country_code` to uppercase, refuses deletion when
 * downstream cities still reference the row, and fires the matching
 * domain events.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class StateObserver
{
    /**
     * `saving` — normalise the ISO country code to uppercase.
     */
    public function saving(State $state): void
    {
        $countryCode = $state->{StateInterface::ATTR_COUNTRY_CODE} ?? null;
        if (\is_string($countryCode) && $countryCode !== '') {
            $state->{StateInterface::ATTR_COUNTRY_CODE} = \strtoupper($countryCode);
        }
    }

    /**
     * `created` — fire the domain event.
     */
    public function created(State $state): void
    {
        StateCreated::dispatch(
            (int) $state->getKey(),
            (int) $state->{StateInterface::ATTR_COUNTRY_ID},
        );
    }

    /**
     * `updated` — fire the domain event with the dirty field list.
     */
    public function updated(State $state): void
    {
        $changes = \array_keys($state->getChanges());
        if ($changes === []) {
            return;
        }

        StateUpdated::dispatch(
            (int) $state->getKey(),
            (int) $state->{StateInterface::ATTR_COUNTRY_ID},
            $changes,
        );
    }

    /**
     * `deleting` — refuse when downstream cities still reference this
     * row.
     */
    public function deleting(State $state): void
    {
        $id = (int) $state->getKey();

        if (City::query()->where(CityInterface::ATTR_STATE_ID, $id)->exists()) {
            throw new InvalidArgumentException(\sprintf(
                'Cannot delete state %d while cities reference it.',
                $id,
            ));
        }
    }

    /**
     * `deleted` — fire the domain event.
     */
    public function deleted(State $state): void
    {
        StateDeleted::dispatch(
            (int) $state->getKey(),
            (int) $state->{StateInterface::ATTR_COUNTRY_ID},
        );
    }
}
