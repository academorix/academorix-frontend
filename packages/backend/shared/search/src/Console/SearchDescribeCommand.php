<?php

declare(strict_types=1);

namespace Stackra\Search\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Search\Contracts\Registry\EngineRegistryInterface;

/**
 * `php artisan search:describe` — print the compile-time inventory of
 * every `#[Searchable]`-marked model class.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'search:describe',
    description: 'Print every model class registered with the search catalogue.',
)]
final class SearchDescribeCommand extends BaseCommand
{
    protected $signature = 'search:describe
        {model? : Optional model FQCN to describe}
        {--engine= : Filter by engine adapter}
        {--refresh-cache : Rebuild the registry cache}
        {--json : Emit machine-parseable output}';

    public function handle(EngineRegistryInterface $registry): int
    {
        $this->omni->titleBar('Search Registry', 'emerald');

        $classes = $registry->all();

        if ($classes === []) {
            $this->omni->info('No models are registered with the search catalogue.');
            $this->showDuration();

            return self::SUCCESS;
        }

        $this->omni->tableHeader('#', 'Model class', 'Engine');

        foreach ($classes as $index => $className) {
            $attribute = $registry->attributeFor($className);
            $engine    = $attribute?->engine->value ?? 'unknown';

            $this->omni->tableRow(
                (string) ($index + 1),
                $className,
                $engine,
            );
        }

        $this->omni->success(\sprintf('%d model(s) registered.', \count($classes)));
        $this->showDuration();

        return self::SUCCESS;
    }
}
