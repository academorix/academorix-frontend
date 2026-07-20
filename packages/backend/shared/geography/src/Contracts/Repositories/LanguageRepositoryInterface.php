<?php

declare(strict_types=1);

namespace Academorix\Geography\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\Geography\Models\Language;
use Academorix\Geography\Repositories\EloquentLanguageRepository;
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
