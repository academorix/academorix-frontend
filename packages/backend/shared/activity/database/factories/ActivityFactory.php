<?php

declare(strict_types=1);

namespace Academorix\Activity\Database\Factories;

use Academorix\Activity\Contracts\Data\ActivityInterface;
use Academorix\Activity\Models\Activity;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see Activity}.
 *
 * Produces a plausible feed row without a subject / causer — states
 * (`->withCauser($user)`, `->onSubject($model)`) attach them for
 * tests that need the full envelope.
 *
 * @extends Factory<Activity>
 *
 * @category Activity
 *
 * @since    0.1.0
 */
final class ActivityFactory extends Factory
{
    /**
     * @var class-string<Activity>
     */
    protected $model = Activity::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            ActivityInterface::ATTR_ID          => 'act_' . Str::ulid()->toBase32(),
            ActivityInterface::ATTR_TENANT_ID   => 'ten_' . Str::ulid()->toBase32(),
            ActivityInterface::ATTR_LOG_NAME    => 'default',
            ActivityInterface::ATTR_DESCRIPTION => 'did something',
            ActivityInterface::ATTR_EVENT       => 'created',
            ActivityInterface::ATTR_PROPERTIES  => null,
            ActivityInterface::ATTR_BATCH_UUID  => null,
        ];
    }

    /**
     * State: attach a specific causer to the row.
     *
     * @param  object  $causer  Any Eloquent model — its class + key
     *                          land in `causer_type` / `causer_id`.
     */
    public function withCauser(object $causer): static
    {
        return $this->state(fn (): array => [
            ActivityInterface::ATTR_CAUSER_TYPE => $causer::class,
            ActivityInterface::ATTR_CAUSER_ID   => \method_exists($causer, 'getKey')
                ? (string) $causer->getKey()
                : null,
        ]);
    }

    /**
     * State: attach a specific subject to the row.
     *
     * @param  object  $subject  Any Eloquent model — its class + key
     *                           land in `subject_type` / `subject_id`.
     */
    public function onSubject(object $subject): static
    {
        return $this->state(fn (): array => [
            ActivityInterface::ATTR_SUBJECT_TYPE => $subject::class,
            ActivityInterface::ATTR_SUBJECT_ID   => \method_exists($subject, 'getKey')
                ? (string) $subject->getKey()
                : null,
        ]);
    }
}
