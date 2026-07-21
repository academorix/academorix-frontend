<?php

declare(strict_types=1);

namespace Stackra\Storage\Jobs;

use Stackra\Storage\Contracts\Data\FileInterface;
use Stackra\Storage\Contracts\Repositories\FileRepositoryInterface;
use Stackra\Storage\Contracts\Services\FileKindRegistryInterface;
use Stackra\Storage\Contracts\Services\VariantGeneratorInterface;
use Stackra\Storage\Events\FileVariantsCompleted;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Generate every variant registered for the file's kind.
 *
 * Reads the recipe list from
 * {@see FileKindRegistryInterface::get()} then dispatches one
 * generate call per key. When no recipes apply, the job no-ops.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Queue('media')]
#[Timeout(300)]
#[Tries(3)]
#[Backoff(60, 300, 900)]
final class GenerateFileVariantsJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly string $fileId)
    {
    }

    public function handle(
        FileRepositoryInterface $files,
        FileKindRegistryInterface $registry,
        VariantGeneratorInterface $generator,
    ): void {
        $file = $files->find($this->fileId);
        if ($file === null) {
            return;
        }

        $config = $registry->get((string) $file->{FileInterface::ATTR_KIND});
        /** @var array<int, string> $variantKeys */
        $variantKeys = (array) ($config['generatesVariants'] ?? []);

        if ($variantKeys === []) {
            return;
        }

        $completed = [];
        foreach ($variantKeys as $variantKey) {
            $recipe  = ['key' => $variantKey];
            $variant = $generator->generate($file, $variantKey, $recipe);
            if ($variant !== null) {
                $completed[] = $variantKey;
            }
        }

        if ($completed !== []) {
            $existing = (array) ($file->{FileInterface::ATTR_GENERATED_VARIANTS} ?? []);
            $file->update([
                FileInterface::ATTR_GENERATED_VARIANTS => \array_values(\array_unique(\array_merge($existing, $completed))),
            ]);

            FileVariantsCompleted::dispatch($file->refresh(), $completed);
        }
    }

    public function failed(\Throwable $e): void
    {
    }
}
