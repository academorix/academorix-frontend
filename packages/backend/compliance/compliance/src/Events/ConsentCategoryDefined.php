<?php

declare(strict_types=1);

namespace Stackra\Compliance\Events;

use Stackra\Compliance\Models\ConsentCategory;
use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a new consent category is added to the catalogue.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'compliance.consent.category.defined')]
final readonly class ConsentCategoryDefined implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public ConsentCategory $category)
    {
    }
}
