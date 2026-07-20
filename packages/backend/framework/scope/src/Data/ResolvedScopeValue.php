<?php

/**
 * @file src/Data/ResolvedScopeValue.php
 *
 * @description
 * DTO returned by
 * {@see \Academorix\Scope\Contracts\ScopeResolutionInterface::resolve()}.
 * Carries both the resolved value AND provenance (which node stored
 * it) so consumers can render "this setting is inherited from
 * <region>" hints in the admin UI without a second query.
 */

declare(strict_types=1);

namespace Academorix\Scope\Data;

/**
 * A cascading-resolution result.
 *
 * ## `sourceNodeId === null`
 *
 * The value came from the consumer's `defaultValueFactory` (i.e.
 * nothing was stored at any ancestor). Distinguishing default from
 * ancestor-stored is important — the UI should not render an
 * "override at <root>" affordance if the value is a pure default.
 */
final readonly class ResolvedScopeValue
{
    /**
     * @param  mixed  $value  Resolved value.
     * @param  string  $namespace  Consumer namespace.
     * @param  string  $key  Fully-qualified key.
     * @param  string|null  $sourceNodeId  UUID of the node that
     *                                     stored the value, or
     *                                     `null` when the default
     *                                     factory fired.
     * @param  string|null  $sourceScopeSlug  Slug of the level that
     *                                        stored it — `null` when
     *                                        falling back to default.
     * @param  bool  $isDefault  Convenience — true iff
     *                           the value came from the
     *                           default factory.
     */
    public function __construct(
        public mixed $value,
        public string $namespace,
        public string $key,
        public ?string $sourceNodeId = null,
        public ?string $sourceScopeSlug = null,
        public bool $isDefault = false,
    ) {}

    /**
     * Serialisation form used by the schema/read endpoint. Kept
     * small so the network payload stays tight.
     *
     * @return array{value: mixed, namespace: string, key: string, source: array{nodeId: ?string, scopeSlug: ?string, isDefault: bool}}
     */
    public function toArray(): array
    {
        return [
            'value' => $this->value,
            'namespace' => $this->namespace,
            'key' => $this->key,
            'source' => [
                'nodeId' => $this->sourceNodeId,
                'scopeSlug' => $this->sourceScopeSlug,
                'isDefault' => $this->isDefault,
            ],
        ];
    }
}
