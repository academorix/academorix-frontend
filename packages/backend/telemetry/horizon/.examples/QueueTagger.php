<?php

declare(strict_types=1);

namespace Stackra\Horizon\Examples;

use Stackra\Horizon\Attributes\HorizonTag;

/**
 * ## QueueTagger Example
 *
 * This example demonstrates the `#[HorizonTag]` attribute, which allows you to
 * define custom grouping and tagging logic for Horizon jobs.
 *
 * ### Features demonstrated:
 * 1.  **Dynamic Tagging**: Define tags that should be applied to specific jobs or queues.
 * 2.  **Organization**: Improve Horizon dashboard visibility by categorizing jobs.
 * 3.  **Automatic Discovery**: Tags are applied without modifying job classes or global config.
 *
 * ### Usage:
 * Apply this attribute to classes that manage or represent jobs to enhance
 * Horizon's observability.
 */
#[HorizonTag(
    tags: ['sales', 'priority'],
    enabled: true
)]
class QueueTagger
{
    /**
     * Logic to determine tags dynamically.
     *
     * @param mixed $job
     * @return array<int, string>
     */
    public function getTags($job): array
    {
        return ['sales', "type:{$job->type}"];
    }
}
