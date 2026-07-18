<?php

/**
 * @file packages/exceptions/src/Support/TraceCleaner.php
 *
 * @description
 * Turns a raw PHP stack trace (as returned by `Throwable::getTrace()`)
 * into the shape the JSON error envelope and Ignition solutions
 * providers expect: relative paths, no argument values, and a
 * configurable frame cap.
 *
 * ## Why we clean the trace
 *
 * 1. **Full filesystem paths** leak deployment layout to whoever
 *    reads a Sentry event or an error page — helpful in local dev,
 *    useless everywhere else. Cleaner strips the project base path
 *    when it can find one.
 *
 * 2. **Function arguments** are a common source of accidental
 *    credential leaks — a call like `login('alice', 'hunter2')`
 *    embeds `hunter2` in the trace. We drop `args` unconditionally
 *    and rely on the exception's `context` payload for the values
 *    that MUST be visible.
 *
 * 3. **Vendor frames** dominate stacks in a framework-heavy runtime
 *    like Laravel. The cleaner can (optionally) prune consecutive
 *    frames that live under `vendor/` so the "real" call site
 *    surfaces higher.
 *
 * ## Return shape
 *
 * Each cleaned frame is an associative array with these fields —
 * a subset of PHP's native trace, minus the unsafe bits:
 *
 *   [
 *     'file'     => string|null   // path (relative when possible)
 *     'line'     => int|null
 *     'function' => string
 *     'class'    => string|null   // FQCN when the frame is a method
 *     'type'     => string|null   // "->" for instance, "::" for static
 *     'source'   => string|null   // "vendor" | "app" | "internal"
 *   ]
 */

declare(strict_types=1);

namespace Academorix\Exceptions\Support;

use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Throwable;

final class TraceCleaner
{
    /** Default hard cap on returned frames. */
    public const DEFAULT_MAX_FRAMES = 20;

    /** Whether to strip full paths back to project-relative. */
    private bool $stripPaths;

    /** Whether to drop consecutive vendor frames. */
    private bool $collapseVendor;

    /** Max frames returned per trace. */
    private int $maxFrames;

    /** Base path we strip from `file` values, or null. */
    private ?string $basePath;

    public function __construct(
        ?ConfigRepository $config = null,
        bool $stripPaths = true,
        bool $collapseVendor = false,
        int $maxFrames = self::DEFAULT_MAX_FRAMES,
        ?string $basePath = null,
    ) {
        $this->stripPaths = (bool) ($config?->get('exceptions.traces.strip_paths', $stripPaths) ?? $stripPaths);
        $this->collapseVendor = (bool) ($config?->get('exceptions.traces.collapse_vendor', $collapseVendor) ?? $collapseVendor);
        $this->maxFrames = (int) ($config?->get('exceptions.traces.max_frames', $maxFrames) ?? $maxFrames);
        $this->basePath = $basePath ?? (function_exists('base_path') ? base_path() : null);
    }

    /**
     * Clean a throwable's stack trace.
     *
     * @return list<array{
     *     file: string|null,
     *     line: int|null,
     *     function: string,
     *     class: string|null,
     *     type: string|null,
     *     source: string,
     * }>
     */
    public function clean(Throwable $e): array
    {
        $raw = $e->getTrace();
        $out = [];

        foreach ($raw as $frame) {
            $file = isset($frame['file']) ? (string) $frame['file'] : null;
            $source = $this->classifyFrame($file);

            // Collapse consecutive vendor frames when the caller
            // opted in — one vendor summary line replaces N.
            if ($this->collapseVendor
                && $source === 'vendor'
                && ($out[count($out) - 1]['source'] ?? null) === 'vendor'
            ) {
                continue;
            }

            $out[] = [
                'file' => $this->normalisePath($file),
                'line' => isset($frame['line']) ? (int) $frame['line'] : null,
                'function' => (string) ($frame['function'] ?? '{unknown}'),
                'class' => isset($frame['class']) ? (string) $frame['class'] : null,
                'type' => isset($frame['type']) ? (string) $frame['type'] : null,
                'source' => $source,
            ];

            if (count($out) >= $this->maxFrames) {
                break;
            }
        }

        return $out;
    }

    /**
     * Cleaned representation of the throwable + its `previous`
     * chain, suitable for embedding in a JSON debug envelope.
     *
     * @return array{class: string, message: string, file: string|null, line: int|null, trace: list<array<string, mixed>>, previous: array<string, mixed>|null}
     */
    public function describe(Throwable $e): array
    {
        return [
            'class' => $e::class,
            'message' => $e->getMessage(),
            'file' => $this->normalisePath($e->getFile()),
            'line' => $e->getLine(),
            'trace' => $this->clean($e),
            'previous' => $e->getPrevious() !== null ? $this->describe($e->getPrevious()) : null,
        ];
    }

    /**
     * Turn an absolute path into `<PROJECT>/relative/part` when we
     * can identify the project root; leave it alone otherwise.
     */
    private function normalisePath(?string $path): ?string
    {
        if ($path === null || ! $this->stripPaths) {
            return $path;
        }

        if ($this->basePath !== null && str_starts_with($path, $this->basePath)) {
            return substr($path, strlen($this->basePath) + 1);
        }

        // Common vendored/internal roots — replace with a marker.
        foreach (['/vendor/', '/node_modules/'] as $marker) {
            if (($idx = strpos($path, $marker)) !== false) {
                return substr($path, $idx + 1);
            }
        }

        return $path;
    }

    /**
     * Assign each frame a coarse origin: our app code, vendor, or
     * PHP-internal (frames without a `file` are typically internal
     * / closures).
     */
    private function classifyFrame(?string $file): string
    {
        if ($file === null) {
            return 'internal';
        }

        if (str_contains($file, '/vendor/')) {
            return 'vendor';
        }

        return 'app';
    }
}
