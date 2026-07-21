<?php

declare(strict_types=1);

namespace Stackra\Activity\Data;

use Stackra\Activity\Contracts\Data\ActivityInterface;
use Stackra\Activity\Models\Activity;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see Activity}.
 *
 * Redaction happens here — not on the model — so the DB row can
 * carry the full spatie payload for debugging while the wire
 * response omits sensitive paths. The redaction list comes from
 * `config('activity.redacted_property_paths')`.
 *
 * @category Activity
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class ActivityData extends Data
{
    /**
     * @param  string                    $id            `act_<ulid>`.
     * @param  string                    $logName       Grouping bucket.
     * @param  string                    $description   Human-readable summary.
     * @param  string                    $event         `created` / `updated` / `deleted` / `restored` / custom.
     * @param  \DateTimeInterface        $createdAt     Row creation.
     * @param  array<string, mixed>|null $properties    Spatie's payload, with sensitive paths redacted.
     * @param  string|null               $tenantId      Owning tenant.
     * @param  string|null               $subjectType   Polymorphic subject FQCN.
     * @param  string|null               $subjectId     Polymorphic subject id.
     * @param  string|null               $causerType    Polymorphic causer FQCN.
     * @param  string|null               $causerId      Polymorphic causer id.
     * @param  string|null               $batchUuid     Groups related activities.
     */
    public function __construct(
        public string $id,
        public string $logName,
        public string $description,
        public string $event,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        public ?array $properties = null,
        public ?string $tenantId = null,
        public ?string $subjectType = null,
        public ?string $subjectId = null,
        public ?string $causerType = null,
        public ?string $causerId = null,
        public ?string $batchUuid = null,
    ) {
    }

    /**
     * Build the DTO from an {@see Activity} model.
     *
     * The `properties` field is redacted per the config-declared
     * dot-paths before serialisation — the DB retains the full
     * payload, but the wire response omits sensitive keys.
     */
    public static function fromModel(Activity $activity): self
    {
        return new self(
            id: (string) $activity->getKey(),
            logName: (string) ($activity->{ActivityInterface::ATTR_LOG_NAME} ?? 'default'),
            description: (string) $activity->{ActivityInterface::ATTR_DESCRIPTION},
            event: (string) ($activity->{ActivityInterface::ATTR_EVENT} ?? ''),
            createdAt: $activity->{ActivityInterface::ATTR_CREATED_AT},
            properties: self::redactProperties(self::propertiesToArray($activity)),
            tenantId: self::nullableString($activity, ActivityInterface::ATTR_TENANT_ID),
            subjectType: self::nullableString($activity, ActivityInterface::ATTR_SUBJECT_TYPE),
            subjectId: self::nullableString($activity, ActivityInterface::ATTR_SUBJECT_ID),
            causerType: self::nullableString($activity, ActivityInterface::ATTR_CAUSER_TYPE),
            causerId: self::nullableString($activity, ActivityInterface::ATTR_CAUSER_ID),
            batchUuid: self::nullableString($activity, ActivityInterface::ATTR_BATCH_UUID),
        );
    }

    /**
     * Normalise `properties` into a plain array. spatie casts the
     * column to a `Collection` by default; we accept either shape.
     *
     * @return array<string, mixed>
     */
    private static function propertiesToArray(Activity $activity): array
    {
        $raw = $activity->{ActivityInterface::ATTR_PROPERTIES};

        if ($raw === null) {
            return [];
        }

        if (\is_array($raw)) {
            return $raw;
        }

        if (\method_exists($raw, 'toArray')) {
            /** @var array<string, mixed> $result */
            $result = $raw->toArray();

            return $result;
        }

        return [];
    }

    /**
     * Apply the config-declared redaction paths to the properties
     * payload. Every path is dot-separated (`attributes.password`);
     * matched leaves are replaced with `'[redacted]'` rather than
     * dropped, so the shape stays stable for the UI.
     *
     * @param  array<string, mixed>  $properties  Raw property bag.
     * @return array<string, mixed>|null
     */
    private static function redactProperties(array $properties): ?array
    {
        if ($properties === []) {
            return null;
        }

        /** @var list<string> $paths */
        $paths = (array) \config('activity.redacted_property_paths', []);

        foreach ($paths as $path) {
            $properties = self::redactAtPath($properties, \explode('.', $path));
        }

        return $properties;
    }

    /**
     * Walk one dot-path and stamp `'[redacted]'` at its leaf.
     *
     * @param  array<string, mixed>  $data     Current level of the tree.
     * @param  list<string>          $segments Remaining path segments.
     * @return array<string, mixed>
     */
    private static function redactAtPath(array $data, array $segments): array
    {
        $head = \array_shift($segments);

        // Path segment doesn't match anything at this level — nothing
        // to redact, return the bag as-is.
        if ($head === null || ! \array_key_exists($head, $data)) {
            return $data;
        }

        // Path fully consumed — this IS the leaf. Stamp the sentinel.
        if ($segments === []) {
            $data[$head] = '[redacted]';

            return $data;
        }

        // Path continues — recurse only when the sub-tree is itself
        // an associative array. Otherwise leave the branch untouched
        // (redacting into a scalar makes no sense).
        $branch = $data[$head];
        if (\is_array($branch)) {
            $data[$head] = self::redactAtPath($branch, $segments);
        }

        return $data;
    }

    /**
     * Read a nullable string attribute; empty strings collapse to null
     * for a clean wire payload.
     */
    private static function nullableString(Activity $activity, string $key): ?string
    {
        $value = $activity->{$key} ?? null;

        if ($value === null || $value === '') {
            return null;
        }

        return (string) $value;
    }
}
