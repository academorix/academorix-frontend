<?php

declare(strict_types=1);

namespace Stackra\Localization\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Localization\Contracts\Services\TranslatorDriverManagerInterface;

/**
 * `php artisan localization:translate {key} {locale}` — translate
 * one key on-demand.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'localization:translate',
    description: 'Translate one key via the configured driver.',
)]
final class TranslateCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'localization:translate
        {source : Source string}
        {target : Target BCP-47 locale (e.g. fr-CA)}
        {--from=en : Source BCP-47 locale}
        {--driver= : Optional driver override}';

    public function handle(TranslatorDriverManagerInterface $drivers): int
    {
        $source = (string) $this->argument('source');
        $target = (string) $this->argument('target');
        $from   = (string) $this->option('from');
        $driver = $this->option('driver');

        $this->omni->titleBar('Localization Translate', 'purple');

        $result = $drivers->driver(\is_string($driver) ? $driver : null)->translate(
            $source,
            $from,
            $target,
        );

        $this->omni->dataList(
            [
                'source'         => $source,
                'source_locale'  => $from,
                'target_locale'  => $target,
                'driver'         => $result->driver,
                'translated'     => $result->translatedText,
                'quality_score'  => $result->qualityScore,
                'duration_ms'    => $result->durationMs,
            ],
            title: 'Translation',
        );

        $this->omni->success('Translated.');
        $this->showDuration();

        return self::SUCCESS;
    }
}
