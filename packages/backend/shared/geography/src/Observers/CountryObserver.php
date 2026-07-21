<?php

declare(strict_types=1);

namespace Stackra\Geography\Observers;

use Stackra\Geography\Contracts\Data\CityInterface;
use Stackra\Geography\Contracts\Data\CountryInterface;
use Stackra\Geography\Contracts\Data\StateInterface;
use Stackra\Geography\Events\Domain\CountryCreated;
use Stackra\Geography\Events\Domain\CountryDeleted;
use Stackra\Geography\Events\Domain\CountryUpdated;
use Stackra\Geography\Models\City;
use Stackra\Geography\Models\Country;
use Stackra\Geography\Models\State;
use InvalidArgumentException;

/**
 * Lifecycle side effects for {@see Country}.
 *
 * Normalises `iso2` + `iso3` to uppercase before every save, refuses
 * deletion when downstream states / cities still reference the row,
 * and fires the matching domain events for cache invalidation.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class CountryObserver
{
    /**
     * `saving` — normalise ISO codes to uppercase.
     */
    public function saving(Country $country): void
    {
        $iso2 = $country->{CountryInterface::ATTR_ISO2} ?? null;
        if (\is_string($iso2) && $iso2 !== '') {
            $country->{CountryInterface::ATTR_ISO2} = \strtoupper($iso2);
        }

        $iso3 = $country->{CountryInterface::ATTR_ISO3} ?? null;
        if (\is_string($iso3) && $iso3 !== '') {
            $country->{CountryInterface::ATTR_ISO3} = \strtoupper($iso3);
        }
    }

    /**
     * `created` — fire the domain event.
     */
    public function created(Country $country): void
    {
        CountryCreated::dispatch(
            (int) $country->getKey(),
            (string) $country->{CountryInterface::ATTR_ISO2},
        );
    }

    /**
     * `updated` — fire the domain event with the dirty field list.
     */
    public function updated(Country $country): void
    {
        $changes = \array_keys($country->getChanges());
        if ($changes === []) {
            return;
        }

        CountryUpdated::dispatch(
            (int) $country->getKey(),
            (string) $country->{CountryInterface::ATTR_ISO2},
            $changes,
        );
    }

    /**
     * `deleting` — refuse when downstream FKs still reference the row.
     * Only states + cities are guarded here; currencies + languages +
     * timezones cascade via vendor migrations and are allowed to
     * orphan on hard-delete (rare — vendor seeder is the source of
     * truth).
     */
    public function deleting(Country $country): void
    {
        $id = (int) $country->getKey();

        // Refuse deletion when any state still references this country.
        if (State::query()->where(StateInterface::ATTR_COUNTRY_ID, $id)->exists()) {
            throw new InvalidArgumentException(\sprintf(
                'Cannot delete country %s while states reference it.',
                $country->{CountryInterface::ATTR_ISO2},
            ));
        }

        // Same guard against cities.
        if (City::query()->where(CityInterface::ATTR_COUNTRY_ID, $id)->exists()) {
            throw new InvalidArgumentException(\sprintf(
                'Cannot delete country %s while cities reference it.',
                $country->{CountryInterface::ATTR_ISO2},
            ));
        }
    }

    /**
     * `deleted` — fire the domain event.
     */
    public function deleted(Country $country): void
    {
        CountryDeleted::dispatch(
            (int) $country->getKey(),
            (string) $country->{CountryInterface::ATTR_ISO2},
        );
    }
}
