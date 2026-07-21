<?php

declare(strict_types=1);

namespace Stackra\Storage\Attributes;

use Attribute;

/**
 * Requests async variant generation for the uploaded file.
 *
 * Applied on a class or property that declares an attachment,
 * `#[GeneratesVariants(['thumbnail', 'medium', 'hero'])]` dispatches
 * one
 * {@see \Stackra\Storage\Jobs\GenerateFileVariantsJob} per key
 * on successful upload.
 *
 * The variant keys resolve against variant recipes registered on
 * {@see \Stackra\Storage\Contracts\Services\VariantGeneratorInterface}.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS | Attribute::TARGET_PROPERTY | Attribute::IS_REPEATABLE)]
final readonly class GeneratesVariants
{
    /**
     * @param  array<int, string> $variantKeys Ordered list of variant recipe keys to run.
     */
    public function __construct(
        public array $variantKeys,
    ) {
    }
}
