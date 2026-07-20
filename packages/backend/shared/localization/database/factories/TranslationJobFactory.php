<?php

declare(strict_types=1);

namespace Academorix\Localization\Database\Factories;

use Academorix\Localization\Contracts\Data\TranslationJobInterface;
use Academorix\Localization\Enums\TranslationJobKind;
use Academorix\Localization\Enums\TranslationJobStatus;
use Academorix\Localization\Enums\TranslatorDriverName;
use Academorix\Localization\Models\TranslationJob;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see TranslationJob}.
 *
 * @extends Factory<TranslationJob>
 *
 * @category Localization
 *
 * @since    0.1.0
 */
final class TranslationJobFactory extends Factory
{
    /**
     * @var class-string<TranslationJob>
     */
    protected $model = TranslationJob::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            TranslationJobInterface::ATTR_ID              => 'tjb_' . Str::ulid()->toBase32(),
            TranslationJobInterface::ATTR_TENANT_ID       => 'ten_' . Str::ulid()->toBase32(),
            TranslationJobInterface::ATTR_INITIATOR_ID    => null,
            TranslationJobInterface::ATTR_KIND            => TranslationJobKind::Namespace,
            TranslationJobInterface::ATTR_DRIVER          => TranslatorDriverName::NullDriver,
            TranslationJobInterface::ATTR_DRIVER_MODEL    => null,
            TranslationJobInterface::ATTR_SOURCE_LOCALE   => 'en',
            TranslationJobInterface::ATTR_TARGET_LOCALE   => 'fr',
            TranslationJobInterface::ATTR_STATUS          => TranslationJobStatus::Queued,
            TranslationJobInterface::ATTR_TOTAL_KEYS      => 0,
            TranslationJobInterface::ATTR_TRANSLATED_KEYS => 0,
            TranslationJobInterface::ATTR_FAILED_KEYS     => 0,
            TranslationJobInterface::ATTR_NAMESPACE_FILTER => null,
            TranslationJobInterface::ATTR_GROUP_FILTER    => null,
            TranslationJobInterface::ATTR_STARTED_AT      => null,
            TranslationJobInterface::ATTR_FINISHED_AT     => null,
            TranslationJobInterface::ATTR_ERROR_MESSAGE   => null,
            TranslationJobInterface::ATTR_METADATA        => null,
        ];
    }

    /**
     * State — job is currently running.
     */
    public function running(): static
    {
        return $this->state(fn (): array => [
            TranslationJobInterface::ATTR_STATUS     => TranslationJobStatus::Running,
            TranslationJobInterface::ATTR_STARTED_AT => now(),
        ]);
    }

    /**
     * State — job completed successfully.
     */
    public function completed(): static
    {
        return $this->state(fn (): array => [
            TranslationJobInterface::ATTR_STATUS       => TranslationJobStatus::Completed,
            TranslationJobInterface::ATTR_STARTED_AT   => now()->subMinutes(5),
            TranslationJobInterface::ATTR_FINISHED_AT  => now(),
            TranslationJobInterface::ATTR_TOTAL_KEYS   => 100,
            TranslationJobInterface::ATTR_TRANSLATED_KEYS => 100,
        ]);
    }

    /**
     * State — job failed after retries.
     *
     * @param  string  $message  Error message to record.
     */
    public function failed(string $message = 'Driver unreachable'): static
    {
        return $this->state(fn () => [
            TranslationJobInterface::ATTR_STATUS        => TranslationJobStatus::Failed,
            TranslationJobInterface::ATTR_STARTED_AT    => now()->subMinutes(5),
            TranslationJobInterface::ATTR_FINISHED_AT   => now(),
            TranslationJobInterface::ATTR_ERROR_MESSAGE => $message,
        ]);
    }
}
