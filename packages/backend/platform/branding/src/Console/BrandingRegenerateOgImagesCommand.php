<?php

declare(strict_types=1);

namespace Stackra\Branding\Console;

use Stackra\Branding\Contracts\Repositories\BrandingRepositoryInterface;
use Stackra\Branding\Jobs\RegenerateOgImageJob;
use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;

/**
 * `php artisan branding:regenerate-og-images` — dispatch
 * {@see RegenerateOgImageJob} for every default branding across the
 * platform.
 *
 * @category Branding
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'branding:regenerate-og-images',
    description: 'Dispatch RegenerateOgImageJob for every default branding.',
)]
final class BrandingRegenerateOgImagesCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'branding:regenerate-og-images {--tenant= : Limit to a single tenant id}';

    public function handle(BrandingRepositoryInterface $brandings): int
    {
        $this->omni->titleBar('Regenerate OG Images', 'sky');

        $q = $brandings->query()->where('is_default', true);
        if (($tenant = $this->option('tenant')) !== null && $tenant !== '') {
            $q->where('tenant_id', $tenant);
        }

        $rows = $q->get();
        if ($rows->isEmpty()) {
            $this->omni->info('No default branding rows found.');
            $this->showDuration();

            return self::SUCCESS;
        }

        foreach ($rows as $branding) {
            RegenerateOgImageJob::dispatch((string) $branding->getKey());
        }

        $this->omni->success(\sprintf('Dispatched %d RegenerateOgImageJob(s).', $rows->count()));
        $this->showDuration();

        return self::SUCCESS;
    }
}
