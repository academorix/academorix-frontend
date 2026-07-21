<?php

declare(strict_types=1);

namespace Stackra\Geography\Observers;

use Stackra\Geography\Contracts\Data\TimezoneInterface;
use Stackra\Geography\Events\Domain\TimezoneCreated;
use Stackra\Geography\Events\Domain\TimezoneDeleted;
use Stackra\Geography\Events\Domain\TimezoneUpdated;
use Stackra\Geography\Models\Timezone;
use DateTimeZone;
use InvalidArgumentException;

/**
 * Lifecycle side effects for {@see Timezone}.
 *
 * Validates the IANA name against PHP's timezone identifier list,
 * uppercases the ISO country code, and fires the matching domain
 * events.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class TimezoneObserver
{
    /**
     * `saving` — validate IANA name + normalise country code.
     */
    public function saving(Timezone $timezone): void
    {
        // IANA-name validation — leverages `timezone_identifiers_list`
        // rather than a bespoke regex. The vendor seed should never
        // land invalid names, but platform-admin writes can.
        $name = $timezone->{TimezoneInterface::ATTR_NAME} ?? null;
        if (\is_string($name) && $name !== '' && ! \in_array($name, DateTimeZone::listIdentifiers(), true)) {
            throw new InvalidArgumentException(\sprintf(
                'Timezone name "%s" is not a valid IANA identifier.',
                $name,
            ));
        }

        $countryCode = $timezone->{TimezoneInterface::ATTR_COUNTRY_CODE} ?? null;
        if (\is_string($countryCode) && $countryCode !== '') {
            $timezone->{TimezoneInterface::ATTR_COUNTRY_CODE} = \strtoupper($countryCode);
        }
    }

    /**
     * `created` — fire the domain event.
     */
    public function created(Timezone $timezone): void
    {
        TimezoneCreated::dispatch(
            (int) $timezone->getKey(),
            (string) $timezone->{TimezoneInterface::ATTR_NAME},
        );
    }

    /**
     * `updated` — fire the domain event with the dirty field list.
     */
    public function updated(Timezone $timezone): void
    {
        $changes = \array_keys($timezone->getChanges());
        if ($changes === []) {
            return;
        }

        TimezoneUpdated::dispatch(
            (int) $timezone->getKey(),
            (string) $timezone->{TimezoneInterface::ATTR_NAME},
            $changes,
        );
    }

    /**
     * `deleted` — fire the domain event.
     */
    public function deleted(Timezone $timezone): void
    {
        TimezoneDeleted::dispatch(
            (int) $timezone->getKey(),
            (string) $timezone->{TimezoneInterface::ATTR_NAME},
        );
    }
}
