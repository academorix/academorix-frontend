<?php

declare(strict_types=1);

namespace Academorix\Branding\Jobs;

use Academorix\Branding\Contracts\Repositories\BrandingRepositoryInterface;
use Academorix\Branding\Contracts\Services\OgImageRendererInterface;
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
 * Regenerate the open-graph card for a branding profile.
 *
 * Delegates to the bound {@see OgImageRendererInterface}. The default
 * `NullOgImageRenderer` returns `null` — real deployments bind a
 * Puppeteer / Playwright renderer.
 *
 * @category Branding
 *
 * @since    0.1.0
 */
#[Queue('media')]
#[Timeout(120)]
#[Tries(3)]
#[Backoff(60, 300, 900)]
final class RegenerateOgImageJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly string $brandingId)
    {
    }

    public function handle(
        BrandingRepositoryInterface $brandings,
        OgImageRendererInterface $renderer,
    ): void {
        $branding = $brandings->find($this->brandingId);
        if ($branding === null) {
            return;
        }

        $url = $renderer->render($branding);
        if ($url === null) {
            return;
        }

        // Persist the URL via metadata bag — model doesn't ship a
        // dedicated `og_image_url` column, but consumers can add one
        // by extending the schema.
        $meta                = (array) ($branding->metadata ?? []);
        $meta['og_image_url'] = $url;
        $branding->update(['metadata' => $meta]);
    }

    public function failed(\Throwable $e): void
    {
    }
}
