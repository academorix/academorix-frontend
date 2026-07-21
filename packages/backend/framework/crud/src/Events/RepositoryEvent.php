<?php

declare(strict_types=1);

/**
 * Repository Event.
 *
 * Generic event wrapper for repository-level events dispatched via
 * the HasEvents::fire() method. Carries the event name, payload object,
 * and dispatch options (queue, broadcast, afterCommit).
 *
 * Listeners can match on the event name:
 *   Event::listen('comment.created', fn (RepositoryEvent $e) => ...);
 *
 * Or listen to all repository events:
 *   Event::listen(RepositoryEvent::class, fn (RepositoryEvent $e) => ...);
 *
 * @category Events
 *
 * @since    2.0.0
 */

namespace Stackra\Crud\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithBroadcasting;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Stackra\Events\Attributes\AsEvent;

/**
 * Generic repository event carrying a name and payload.
 */
#[AsEvent]
class RepositoryEvent implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithBroadcasting;

    /**
     * @param  string       $name        The event name (e.g. 'comment.created', 'user.suspended').
     * @param  mixed        $payload     The payload object (model, DTO, array, or null).
     * @param  string       $repository  The repository class that fired the event.
     * @param  bool|string  $queue       Queue configuration.
     * @param  bool|string  $broadcast   Broadcast configuration.
     * @param  bool         $afterCommit Whether to dispatch after DB commit.
     */
    public function __construct(
        public readonly string $name,
        public readonly mixed $payload = null,
        public readonly string $repository = '',
        public readonly bool|string $queue = false,
        public readonly bool|string $broadcast = false,
        public readonly bool $afterCommit = false,
    ) {}

    /**
     * Get the broadcast channel for this event.
     *
     * @param  string|null  $channel  Custom channel name (defaults to event name).
     * @return array<Channel>
     */
    public function broadcastOn(?string $channel = null): array
    {
        if ($this->broadcast === false) {
            return [];
        }

        $channelName = is_string($this->broadcast) ? $this->broadcast : ($channel ?? $this->name);

        return [new Channel($channelName)];
    }

    /**
     * Get the broadcast event name.
     *
     * @return string The event name used for broadcasting.
     */
    public function broadcastAs(): string
    {
        return $this->name;
    }

    /**
     * Get the payload data for broadcasting.
     *
     * @return array<string, mixed> The broadcast payload.
     */
    public function broadcastWith(): array
    {
        if ($this->payload === null) {
            return ['repository' => $this->repository];
        }

        if (is_array($this->payload)) {
            return [...$this->payload, 'repository' => $this->repository];
        }

        if (method_exists($this->payload, 'toArray')) {
            return [...$this->payload->toArray(), 'repository' => $this->repository];
        }

        return ['payload' => $this->payload, 'repository' => $this->repository];
    }

    /**
     * Determine if this event should be broadcast.
     *
     * @return bool True if broadcasting is enabled.
     */
    public function shouldBroadcast(): bool
    {
        return $this->broadcast !== false;
    }

    /**
     * Determine if this event should be queued.
     *
     * @return bool True if queueing is enabled.
     */
    public function shouldQueue(): bool
    {
        return $this->queue !== false;
    }

    /**
     * Get the queue name for this event.
     *
     * @return string|null The queue name or null for default.
     */
    public function queueName(): ?string
    {
        return is_string($this->queue) ? $this->queue : null;
    }
}
