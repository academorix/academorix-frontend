<?php

declare(strict_types=1);

namespace Academorix\Transfer\Casts;

use Academorix\Transfer\Enums\NotifyChannel;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Eloquent cast for a JSONB `notify_channels` column — coerces the
 * stored array into a list of `NotifyChannel` cases.
 *
 * @implements CastsAttributes<list<NotifyChannel>, list<NotifyChannel|string>>
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class NotifyChannelListCast implements CastsAttributes
{
    /**
     * {@inheritDoc}
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): ?array
    {
        if ($value === null || $value === '') {
            return null;
        }

        $decoded = \is_string($value) ? \json_decode($value, true) : $value;

        if (! \is_array($decoded)) {
            return [];
        }

        $channels = [];
        foreach ($decoded as $item) {
            $channel = $item instanceof NotifyChannel ? $item : NotifyChannel::tryFrom((string) $item);
            if ($channel !== null) {
                $channels[] = $channel;
            }
        }

        return $channels;
    }

    /**
     * {@inheritDoc}
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        $encoded = [];
        foreach ((array) $value as $item) {
            $encoded[] = $item instanceof NotifyChannel ? $item->value : (string) $item;
        }

        return (string) \json_encode($encoded);
    }
}
