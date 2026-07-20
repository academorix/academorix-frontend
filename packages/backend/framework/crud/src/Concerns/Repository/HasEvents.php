<?php

declare(strict_types=1);

/**
 * Has Events Trait
 *
 * Provides Events capabilities to models and classes that use this trait.
 * Encapsulates reusable Events logic for the Framework module.
 *
 * @category Concerns
 *
 * @since    1.0.0
 */
namespace Academorix\Crud\Concerns\Repository;

use Academorix\Crud\Contracts\HasRepositoryEvents;
use Academorix\Crud\Events\RepositoryEvent;

/**
 * HasEvents Trait.
 *
 * Provides repository event dispatching with support for queueing,
 * broadcasting, and flexible payload types.
 *
 * Supports three calling conventions:
 *   $this->fire(new CommentPosted(...));                          // dedicated event class
 *   $this->fire('comment.created', $model);                      // name + object payload
 *   $this->fire('comment.created', $model, queue: true);         // queued
 *   $this->fire('comment.created', $model, broadcast: true);     // broadcast
 *   $this->fire('comment.created', $model, queue: 'high');       // specific queue
 *   $this->fire('comment.created', $model, afterCommit: true);   // after DB commit
 *
 * @since 2.0.0
 */
trait HasEvents
{
    /**
     * Dispatch a repository event.
     *
     * @param  object|string  $event        Event instance or event name string.
     * @param  mixed          $payload      The payload object (model, DTO, array) — used when $event is a string.
     * @param  bool|string    $queue        false = sync, true = default queue, string = specific queue name.
     * @param  bool|string    $broadcast    false = no broadcast, true = default channel, string = channel name.
     * @param  bool           $afterCommit  Dispatch after the current DB transaction commits.
     */
    protected function fire(
        object|string $event,
        mixed $payload = null,
        bool|string $queue = false,
        bool|string $broadcast = false,
        bool $afterCommit = false,
    ): void {
        if (! $this instanceof HasRepositoryEvents) {
            return;
        }

        if (! $this->shouldDispatchRepositoryEvents()) {
            return;
        }

        // Dedicated event class — dispatch directly
        if (is_object($event)) {
            event($event);

            return;
        }

        // String event name — wrap in RepositoryEvent
        $repoEvent = new RepositoryEvent(
            name: $event,
            payload: $payload,
            repository: static::class,
            queue: $queue,
            broadcast: $broadcast,
            afterCommit: $afterCommit,
        );

        if ($queue !== false) {
            $queueName = is_string($queue) ? $queue : null;
            dispatch(fn() => event($repoEvent))
                ->onQueue($queueName)
                ->afterCommit($afterCommit);
        } elseif ($afterCommit) {
            dispatch(fn() => event($repoEvent))->afterCommit();
        } else {
            event($repoEvent);
        }

        if ($broadcast !== false) {
            $channel = is_string($broadcast) ? $broadcast : $event;
            broadcast($repoEvent->broadcastOn($channel));
        }
    }
}
