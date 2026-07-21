<?php

/**
 * @file modules/shared/geography/lang/en/geography.php
 *
 * @description
 * English translations for the `stackra/geography` module.
 * Every `errors.*` key maps to an error code in `blueprints/geography/errors.json`.
 */

declare(strict_types=1);

return [
    'errors' => [
        'country_not_found'       => 'The requested country does not exist or is not visible.',
        'state_not_found'         => 'The requested state does not exist or is not visible.',
        'city_not_found'          => 'The requested city does not exist or is not visible.',
        'currency_not_found'      => 'The requested currency does not exist or is not visible.',
        'language_not_found'      => 'The requested language does not exist or is not visible.',
        'timezone_not_found'      => 'The requested timezone does not exist or is not visible.',
        'cities_index_unscoped'   => 'The cities index requires a `filter[country_id]` or `filter[state_id]` parameter.',
        'states_index_unscoped'   => 'The states index requires a `filter[country_id]` parameter.',
        'geolocate_invalid_ip'    => 'The submitted value is not a valid IPv4 or IPv6 address.',
        'geolocate_private_ip'    => 'The submitted IP is private, loopback, or reserved and cannot be geolocated.',
        'geolocate_unresolvable'  => 'The IP could not be resolved by any configured source.',
        'geolocate_quota_exceeded' => 'The monthly geolocate entitlement quota has been exhausted.',
        'world_not_seeded'        => 'The world reference catalog has not been seeded. Run `php artisan world:install`.',
        'maxmind_missing'         => 'The GeoLite2-City database is not present. Run `php artisan geography:refresh-maxmind`.',
        'maxmind_stale'           => 'The GeoLite2-City database is older than the configured stale window.',
    ],

    'labels' => [
        'country'     => 'Country',
        'countries'   => 'Countries',
        'state'       => 'State',
        'states'      => 'States',
        'city'        => 'City',
        'cities'      => 'Cities',
        'currency'    => 'Currency',
        'currencies'  => 'Currencies',
        'language'    => 'Language',
        'languages'   => 'Languages',
        'timezone'    => 'Timezone',
        'timezones'   => 'Timezones',
        'geolocation' => 'Geolocation',
        'iso2'        => 'ISO alpha-2',
        'iso3'        => 'ISO alpha-3',
        'code'        => 'Code',
        'region'      => 'Region',
        'subregion'   => 'Subregion',
        'phone_code'  => 'Phone code',
        'emoji'       => 'Flag',
        'symbol'      => 'Symbol',
        'precision'   => 'Precision',
        'native'      => 'Native name',
        'direction'   => 'Direction',
        'is_rtl'      => 'Right-to-left',
    ],

    'permissions' => [
        'geolocate'        => 'Call the IP geolocation endpoint',
        'platform_manage'  => 'Manage the reference catalog (platform admin)',
        'platform_view'    => 'View the reference catalog administratively',
    ],
];
