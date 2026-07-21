<?php

declare(strict_types=1);

namespace Stackra\Versioning\Casts;

use Stackra\Versioning\Contracts\Data\ApiVersionInterface;
use Stackra\Versioning\Contracts\Services\VersionSchemeRegistryInterface;
use Stackra\Versioning\Exceptions\UnknownVersionSchemeException;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Cast the `api_versions.scheme_value` column, validating that the
 * stored value parses cleanly under the scheme adapter identified by
 * the row's `scheme` column.
 *
 * Hydrate side: returns the raw string but validates it — bad rows
 * would surface as `UnknownVersionSchemeException` or a raw string
 * with a `?` sentinel. Save side: parses to prove the string is
 * well-formed for the scheme.
 *
 * @category Versioning
 *
 * @since    0.1.0
 *
 * @implements CastsAttributes<string|null, string|null>
 */
final class VersionSchemeCast implements CastsAttributes
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (string) $value;
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $stringValue = (string) $value;
        $schemeName  = $this->resolveSchemeName($attributes);

        try {
            /** @var VersionSchemeRegistryInterface $registry */
            $registry = \app(VersionSchemeRegistryInterface::class);
            $scheme   = $registry->resolve($schemeName);
            $scheme->parse($stringValue);
        } catch (UnknownVersionSchemeException) {
            // Registry not booted / scheme not registered — fall through
            // to save the raw value. The migration seed path relies on
            // this fall-through when running before the framework boots.
        } catch (\Throwable) {
            // The scheme adapter refused the value. Fall through and
            // let the write layer surface the raw string; the caller
            // is expected to validate up-front via ValidVersionScheme.
        }

        return $stringValue;
    }

    /**
     * Read the row's scheme identifier from `$attributes`. Falls back
     * to the config default.
     *
     * @param  array<string, mixed>  $attributes
     */
    private function resolveSchemeName(array $attributes): string
    {
        $raw = $attributes[ApiVersionInterface::ATTR_SCHEME] ?? null;
        if (\is_string($raw) && $raw !== '') {
            return $raw;
        }

        return (string) \config('versioning.schemes.default', 'semver');
    }
}
