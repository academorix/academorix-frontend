<?php

/**
 * @file packages/events/src/Support/DiscoveryManifest.php
 *
 * @description
 * Aggregated output of {@see EventDiscovery::discover()}. Groups the
 * resolved listener bindings and broadcast metadata into a single
 * immutable value the service provider can iterate at boot — or
 * serialise to `bootstrap/cache/events.php` and reload verbatim on
 * subsequent boots without a re-scan.
 */

declare(strict_types=1);

namespace Academorix\Events\Support;

final class DiscoveryManifest
{
    /**
     * @param  list<ListenerBinding>                        $listeners           Resolved listener bindings, one per
     *                                                                            `#[OnEvent]` / `#[ListensFor]`
     *                                                                            attribute instance discovered.
     * @param  array<class-string, BroadcastMetadata>       $broadcastMetadata   Resolved broadcast metadata, keyed
     *                                                                            by the event class it applies to.
     */
    public function __construct(
        public readonly array $listeners,
        public readonly array $broadcastMetadata,
    ) {}

    /**
     * Serialise the whole manifest to a plain array suitable for
     * `var_export()` into the on-disk cache.
     *
     * @return array{
     *   listeners: list<array{
     *     eventClass: class-string,
     *     listenerClass: class-string,
     *     method: string,
     *     priority: int,
     *     queued: bool,
     *     afterCommit: bool,
     *   }>,
     *   broadcastMetadata: array<class-string, array{
     *     eventClass: class-string,
     *     channels: list<string>,
     *     channelType: string|null,
     *     broadcastAs: string|null,
     *     queue: string|null,
     *   }>,
     * }
     */
    public function toArray(): array
    {
        return [
            'listeners' => array_map(
                static fn (ListenerBinding $binding): array => $binding->toArray(),
                $this->listeners,
            ),
            'broadcastMetadata' => array_map(
                static fn (BroadcastMetadata $meta): array => $meta->toArray(),
                $this->broadcastMetadata,
            ),
        ];
    }

    /**
     * Rehydrate a manifest from the array shape produced by
     * {@see self::toArray()}.
     *
     * @param  array{
     *   listeners: list<array{
     *     eventClass: class-string,
     *     listenerClass: class-string,
     *     method: string,
     *     priority: int,
     *     queued: bool,
     *     afterCommit: bool,
     *   }>,
     *   broadcastMetadata: array<class-string, array{
     *     eventClass: class-string,
     *     channels: list<string>,
     *     channelType: string|null,
     *     broadcastAs: string|null,
     *     queue: string|null,
     *   }>,
     * }  $data
     */
    public static function fromArray(array $data): self
    {
        $listeners = [];
        foreach ($data['listeners'] as $binding) {
            $listeners[] = ListenerBinding::fromArray($binding);
        }

        $broadcasts = [];
        foreach ($data['broadcastMetadata'] as $key => $meta) {
            $broadcasts[$key] = BroadcastMetadata::fromArray($meta);
        }

        return new self(listeners: $listeners, broadcastMetadata: $broadcasts);
    }
}
