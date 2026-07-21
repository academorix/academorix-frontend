<?php

declare(strict_types=1);

namespace Stackra\Geography\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\Geography\Models\Language;
use Stackra\Geography\Repositories\EloquentLanguageRepository;
use Illuminate\Container\Attributes\Bind;

/**
 * Repository contract for {@see Language}.
 *
 * @extends RepositoryInterface<Language>
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[Bind(EloquentLanguageRepository::class)]
interface LanguageRepositoryInterface extends RepositoryInterface
{
    /**
     * Find a language by ISO-639-1 code (case-insensitive).
     *
     * @param  string  $code  Two-letter ISO code (e.g. `en`).
     * @return Language|null
     */
    public function findByCode(string $code): ?Language;
}
