<?php

declare(strict_types=1);

namespace Stackra\Localization\Strategies;

use Stackra\Localization\Attributes\AsLocaleResolutionStrategy;
use Stackra\Localization\Contracts\Repositories\PlatformLanguageRepositoryInterface;
use Stackra\Localization\Contracts\Services\LocaleResolutionStrategyInterface;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Http\Request;

/**
 * Resolve the active locale from the `Accept-Language` request
 * header. Parses quality values (`q=0.8`) and picks the highest-q
 * tag that matches an active platform language.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsLocaleResolutionStrategy(name: 'accept_language')]
#[Scoped]
final class AcceptLanguageStrategy implements LocaleResolutionStrategyInterface
{
    /**
     * @param  PlatformLanguageRepositoryInterface  $languages  Catalogue lookup for matching.
     */
    public function __construct(
        private readonly PlatformLanguageRepositoryInterface $languages,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function resolve(Request $request): ?string
    {
        $header = $request->header('Accept-Language');
        if (! \is_string($header) || $header === '') {
            return null;
        }

        $preferences = $this->parse($header);
        if ($preferences === []) {
            return null;
        }

        // Materialise the active-language catalogue once — used for
        // exact + language-only matching.
        $catalogue = $this->languages->findAllKeyedByCode();
        if ($catalogue->isEmpty()) {
            return null;
        }

        // Prefer exact matches, then language-only matches, in
        // quality-descending order.
        foreach ($preferences as $tag) {
            if ($catalogue->has($tag)) {
                return $tag;
            }

            // Fall back to the language subtag only (`en-US` → `en`).
            $languageOnly = \explode('-', $tag)[0];
            if ($catalogue->has($languageOnly)) {
                return $languageOnly;
            }
        }

        return null;
    }

    /**
     * {@inheritDoc}
     */
    public function name(): string
    {
        return 'accept_language';
    }

    /**
     * Parse the header into a q-value-descending list of BCP-47 tags.
     *
     * @return list<string>
     */
    private function parse(string $header): array
    {
        // Split entries on commas + trim.
        $entries = \array_map('trim', \explode(',', $header));

        $withQuality = [];
        foreach ($entries as $entry) {
            if ($entry === '') {
                continue;
            }

            // Split on `;q=` — default quality is 1.0.
            $parts = \array_map('trim', \explode(';', $entry));
            $tag = \array_shift($parts);
            if (! \is_string($tag) || $tag === '' || $tag === '*') {
                continue;
            }

            $quality = 1.0;
            foreach ($parts as $part) {
                if (\str_starts_with($part, 'q=')) {
                    $quality = (float) \substr($part, 2);
                    break;
                }
            }

            $withQuality[] = ['tag' => $tag, 'q' => $quality];
        }

        // Sort quality-descending.
        \usort(
            $withQuality,
            static fn (array $a, array $b): int => $b['q'] <=> $a['q'],
        );

        return \array_map(
            static fn (array $entry): string => (string) $entry['tag'],
            $withQuality,
        );
    }
}
