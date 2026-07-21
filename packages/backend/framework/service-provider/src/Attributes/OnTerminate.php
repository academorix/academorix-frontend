<?php

declare(strict_types=1);

/**
 * @file packages/service-provider/src/Attributes/OnTerminate.php
 *
 * @description
 * Marks a method on a service provider to be called when the
 * application is terminating (after the response has been sent).
 *
 * The method is auto-discovered by
 * {@see \Stackra\ServiceProvider\Concerns\RegistersHooks}
 * during the boot phase and registered as a terminating callback
 * via `$this->app->terminating(...)` — zero manual registration
 * needed.
 *
 * ## Usage:
 * ```php
 * #[AsModule(name: 'Context')]
 * class ContextServiceProvider extends ServiceProvider
 * {
 *     #[OnTerminate]
 *     public function flushContext(): void
 *     {
 *         resolve(ContextManagerInterface::class)->flush();
 *     }
 *
 *     // Multiple methods can be annotated — they all run on
 *     // termination, sorted by priority ascending.
 *     #[OnTerminate(priority: 10)]
 *     public function flushCorrelationId(): void
 *     {
 *         CorrelationId::forget();
 *     }
 * }
 * ```
 *
 * ## Failure isolation
 *
 * Errors thrown inside an `#[OnTerminate]` method are caught and
 * logged (see
 * {@see \Stackra\ServiceProvider\Concerns\RegistersHooks::registerTerminateAttributes()}).
 * A single broken cleanup callback cannot corrupt the response
 * that's already been sent or leak into the next request.
 *
 * @category Attributes
 *
 * @since    1.0.0
 */

namespace Stackra\ServiceProvider\Attributes;

use Attribute;

/**
 * Marks a service provider method to run on application
 * termination. Multiple methods on the same provider are
 * dispatched in priority order (lower first) after the response
 * has been sent to the client.
 */
#[Attribute(Attribute::TARGET_METHOD | Attribute::IS_REPEATABLE)]
final readonly class OnTerminate
{
    /**
     * @param  int  $priority  Execution order — lower values run first. Default: 100.
     */
    public function __construct(
        public int $priority = 100,
    ) {}
}
