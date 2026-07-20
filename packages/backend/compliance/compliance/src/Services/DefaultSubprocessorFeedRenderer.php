<?php

declare(strict_types=1);

namespace Academorix\Compliance\Services;

use Academorix\Compliance\Contracts\Data\SubprocessorInterface;
use Academorix\Compliance\Contracts\Services\SubprocessorFeedRendererInterface;
use Academorix\Compliance\Contracts\Services\SubprocessorRegistryInterface;
use Academorix\Compliance\Enums\SubprocessorRole;
use Academorix\Compliance\Models\Subprocessor;
use Illuminate\Container\Attributes\Scoped;

/**
 * Renders the public JSON feed for the Trust Center.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Scoped]
final class DefaultSubprocessorFeedRenderer implements SubprocessorFeedRendererInterface
{
    public function __construct(
        private readonly SubprocessorRegistryInterface $registry,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function renderJson(): array
    {
        $subprocessors = $this->registry->active()->map(
            static fn (Subprocessor $s): array => [
                'name'          => (string) $s->{SubprocessorInterface::ATTR_NAME},
                'role'          => self::roleValue($s),
                'purpose'       => (string) $s->{SubprocessorInterface::ATTR_PURPOSE},
                'location'      => (string) $s->{SubprocessorInterface::ATTR_LOCATION},
                'legal_basis'   => (string) $s->{SubprocessorInterface::ATTR_LEGAL_BASIS},
                'data_classes'  => (array) ($s->{SubprocessorInterface::ATTR_DATA_CLASSES} ?? []),
                'dpa_url'       => $s->{SubprocessorInterface::ATTR_DPA_URL},
                'website_url'   => $s->{SubprocessorInterface::ATTR_WEBSITE_URL},
                'version'       => (int) $s->{SubprocessorInterface::ATTR_VERSION},
                'active_from'   => $s->{SubprocessorInterface::ATTR_ACTIVE_FROM}?->toIso8601String(),
                'active_until'  => $s->{SubprocessorInterface::ATTR_ACTIVE_UNTIL}?->toIso8601String(),
            ],
        );

        return [
            'generated_at'    => \now()->toIso8601String(),
            'total'           => $subprocessors->count(),
            'subprocessors'   => $subprocessors->all(),
        ];
    }

    /**
     * Read the subprocessor's role value.
     */
    private static function roleValue(Subprocessor $subprocessor): string
    {
        $role = $subprocessor->{SubprocessorInterface::ATTR_ROLE};

        return $role instanceof SubprocessorRole ? $role->value : (string) $role;
    }
}
