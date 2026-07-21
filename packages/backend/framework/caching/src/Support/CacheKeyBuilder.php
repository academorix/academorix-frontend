<?php

/**
 * @file packages/framework/caching/src/Support/CacheKeyBuilder.php
 *
 * @description
 * Deterministic cache-key composer. Consumed by the `#[Cacheable]`
 * / `#[CachePut]` interceptors and by any caller that wants to
 * compute the same key a template would produce.
 *
 * ## Template shape
 *
 * `athletes:{tenantId}:{filters}` — every `{argName}` slot is
 * replaced by the corresponding named argument's scalar cast.
 *
 * Special tokens:
 *
 *   - `{class}`   — the class' FQCN with `\` replaced by `.`.
 *   - `{method}`  — the method name.
 *   - `{hash}`    — an xxh128 hash of every unnamed argument
 *     slot (positional args that weren't referenced by name).
 *
 * ## Non-scalar arguments
 *
 * Objects and arrays are hashed with `xxh128` (fast, non-crypto,
 * 128-bit collision surface). We hash the value once via
 * `serialize()` so identical structures always produce the same
 * key. Enums are reduced to their `->value` when backed;
 * `->name` otherwise.
 *
 * ## Purity
 *
 * The builder is stateless. Injecting the same template + args
 * always produces the same key across workers, deploys, and PHP
 * runtimes — the `xxh128` implementation is part of the PHP
 * `hash_algos()` set and is stable.
 *
 * @see \Stackra\Caching\Attributes\CacheKey Template placement.
 * @see \Stackra\Caching\Contracts\CacheKeyGenerator Custom-strategy hook.
 */

declare(strict_types=1);

namespace Stackra\Caching\Support;

use BackedEnum;
use UnitEnum;

/**
 * Turns a `{arg}`-templated key into a concrete string given a
 * class + method + argument map.
 */
final readonly class CacheKeyBuilder
{
    /**
     * @param  string                $keyPrefix   Static prefix prepended to every produced key. Read from `caching.tag_prefix` for consistency with tags.
     */
    public function __construct(
        private string $keyPrefix = '',
    ) {
    }

    /**
     * Compose a key from a template + call context.
     *
     * @param  string                     $template  Template string with `{argName}` slots.
     * @param  class-string               $class     FQCN of the class whose method is being called.
     * @param  string                     $method    Method name.
     * @param  array<int|string, mixed>   $args      Args as passed to the method — positional or named.
     */
    public function build(string $template, string $class, string $method, array $args): string
    {
        $composed = strtr($template, [
            '{class}'  => str_replace('\\', '.', $class),
            '{method}' => $method,
            '{hash}'   => $this->hashUnnamed($args),
        ]);

        foreach ($args as $name => $value) {
            if (! is_string($name)) {
                continue;
            }
            $composed = str_replace('{' . $name . '}', $this->scalarize($value), $composed);
        }

        return $this->keyPrefix === '' ? $composed : $this->keyPrefix . ':' . $composed;
    }

    /**
     * Compose a key for a call with no explicit template — falls
     * back to `<class>.<method>:<hash-of-args>`.
     *
     * @param  class-string             $class
     * @param  array<int|string, mixed> $args
     */
    public function forCall(string $class, string $method, array $args): string
    {
        return $this->build('{class}@{method}:{hash}', $class, $method, $args);
    }

    /**
     * Reduce every value to a stable string. Scalar → cast;
     * enum → value / name; anything else → xxh128 of its
     * serialized form.
     */
    private function scalarize(mixed $value): string
    {
        return match (true) {
            $value === null           => 'null',
            is_bool($value)           => $value ? 'true' : 'false',
            is_int($value), is_float($value) => (string) $value,
            is_string($value)         => $value,
            $value instanceof BackedEnum => (string) $value->value,
            $value instanceof UnitEnum   => $value->name,
            default                   => hash('xxh128', serialize($value)),
        };
    }

    /**
     * Hash the positional (unnamed) slot of the argument bag. `[]`
     * hashes to a fixed sentinel so calls with no positional
     * arguments still produce a stable key.
     *
     * @param  array<int|string, mixed>  $args
     */
    private function hashUnnamed(array $args): string
    {
        $positional = [];
        foreach ($args as $name => $value) {
            if (is_int($name)) {
                $positional[$name] = $value;
            }
        }

        return $positional === []
            ? 'empty'
            : hash('xxh128', serialize($positional));
    }
}
