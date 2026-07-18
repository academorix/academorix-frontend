<?php

declare(strict_types=1);

namespace Academorix\Geography\Observers;

use Academorix\Geography\Contracts\Data\CityInterface;
use Academorix\Geography\Events\Domain\CityCreated;
use Academorix\Geography\Events\Domain\CityDeleted;
use Academorix\Geography\Events\Domain\CityUpdated;
use Academorix\Geography\Models\City;

/**
 * Lifecycle side effects for {@see City}.
 *
 * Normalises `country_code` to uppercase and fires the matching
 * domain events on create / update / delete.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class CityObserver
{
    /**
     * `saving` — normalise the ISO country code to uppercase.
     */
    public function saving(City $city): void
    {
        $countryCode = $city->{CityInterface::ATTR_COUNTRY_CODE} ?? null;
        if (\is_string($countryCode) && $countryCode !== '') {
            $city->{CityInterface::ATTR_COUNTRY_CODE} = \strtoupper($countryCode);
        }
    }

    /**
     * `created` — fire the domain event.
     */
    public function created(City $city): void
    {
        CityCreated::dispatch(
            (int) $city->getKey(),
            (int) $city->{CityInterface::ATTR_STATE_ID},
            (int) $city->{CityInterface::ATTR_COUNTRY_ID},
        );
    }

    /**
     * `updated` — fire the domain event with the dirty field list.
     */
    public function updated(City $city): void
    {
        $changes = \array_keys($city->getChanges());
        if ($changes === []) {
            return;
        }

        CityUpdated::dispatch((int) $city->getKey(), $changes);
    }

    /**
     * `deleted` — fire the domain event.
     */
    public function deleted(City $city): void
    {
        CityDeleted::dispatch((int) $city->getKey());
    }
}
