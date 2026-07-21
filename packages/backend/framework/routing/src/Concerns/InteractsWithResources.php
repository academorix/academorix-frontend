<?php

/**
 * @file packages/routing/src/Concerns/InteractsWithResources.php
 *
 * @description
 * Manual API-resource transformation helpers. Wrap Eloquent models
 * (or arbitrary payloads) in a Laravel `JsonResource` /
 * `ResourceCollection` and return them via a {@see ResponseBuilder}.
 *
 * ## Simplification note
 *
 * Previously this trait also supported an `#[UseResource]`
 * attribute that let controllers declare a resource class at the
 * class level and auto-wrap payloads based on the calling method
 * name. That machinery lived in a separate `packages/crud/` that
 * hasn't been built yet, and depended on
 * `Stackra\Support\Reflection` which also doesn't exist. Both
 * are dropped from this trait — when the crud package lands, the
 * attribute-based wrapping can come with it and this trait stays
 * focused on the manual case.
 *
 * @see InteractsWithResponse   Provides `response()`.
 * @see \Stackra\Routing\Http\ResponseBuilder  Emitted by every helper.
 */

declare(strict_types=1);

namespace Stackra\Routing\Concerns;

use Stackra\Routing\Http\ResponseBuilder;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\Resources\Json\ResourceCollection;

/**
 * Wrap payloads in Laravel API resources.
 *
 * Depends on {@see InteractsWithResponse} for `response()`. The
 * composing class MUST include both traits.
 */
trait InteractsWithResources
{
    /**
     * Wrap a single record in a resource and emit a 200 envelope.
     *
     * @param  mixed                       $data           Model / array / whatever
     *                                                     the resource class accepts
     *                                                     in its constructor.
     * @param  class-string<JsonResource>  $resourceClass  Fully qualified
     *                                                     resource class name.
     * @param  string|null                 $message        Optional envelope message.
     */
    protected function resource(
        mixed $data,
        string $resourceClass,
        ?string $message = null,
    ): ResponseBuilder {
        // Instantiate directly (no container round-trip) — Laravel
        // resources take a single constructor argument and hold no
        // dependencies of their own.
        $resource = new $resourceClass($data);

        $builder = $this->response()->ok($resource);

        if ($message !== null) {
            $builder->message($message);
        }

        return $builder;
    }

    /**
     * Wrap a collection / array of records in
     * `Resource::collection(...)` and emit a 200 envelope.
     *
     * @param  mixed                             $data           Collection, array,
     *                                                           paginator, or
     *                                                           anything the
     *                                                           resource class'
     *                                                           `collection()` method
     *                                                           accepts.
     * @param  class-string<JsonResource>        $resourceClass  Resource class
     *                                                           providing the
     *                                                           `collection()` static.
     * @param  string|null                       $message        Optional envelope message.
     */
    protected function collection(
        mixed $data,
        string $resourceClass,
        ?string $message = null,
    ): ResponseBuilder {
        // `JsonResource::collection()` is the framework-standard
        // entrypoint for building a ResourceCollection from an
        // iterable of items. Left as a static call (not `new`)
        // because Laravel constructs the collection wrapper
        // internally.
        /** @var ResourceCollection $collection */
        $collection = $resourceClass::collection($data);

        $builder = $this->response()->ok($collection);

        if ($message !== null) {
            $builder->message($message);
        }

        return $builder;
    }

    /**
     * Same as {@see resource()} but also attaches a meta block —
     * useful when the resource's own `additional(...)` method
     * doesn't cover the shape needed (e.g. rate-limit counters,
     * A/B experiment info).
     *
     * @param  mixed                       $data
     * @param  class-string<JsonResource>  $resourceClass
     * @param  array<string, mixed>        $meta
     */
    protected function resourceWithMeta(
        mixed $data,
        string $resourceClass,
        array $meta,
        ?string $message = null,
    ): ResponseBuilder {
        return $this->resource($data, $resourceClass, $message)->meta($meta);
    }
}
