<?php

/**
 * @file Gradient.php
 * @module Academorix\Cli\Support
 * @description ANSI escape helpers for 256-colour and truecolour output.
 *   Used by {@see \Academorix\Cli\Concerns\RendersBrandArt} to paint the
 *   banner line-by-line.
 */

declare(strict_types=1);

namespace Academorix\Cli\Support;

/**
 * Static helpers — do not instantiate.
 */
final class Gradient
{
    public const ESC = "\033[";

    /**
     * Foreground colour, 256-colour palette (0-255).
     */
    public static function fg256(int $color): string
    {
        return self::ESC.'38;5;'.max(0, min(255, $color)).'m';
    }

    /**
     * Background colour, 256-colour palette (0-255).
     */
    public static function bg256(int $color): string
    {
        return self::ESC.'48;5;'.max(0, min(255, $color)).'m';
    }

    /**
     * Truecolour foreground (0-255 per channel).
     */
    public static function truecolor(int $r, int $g, int $b): string
    {
        $r = max(0, min(255, $r));
        $g = max(0, min(255, $g));
        $b = max(0, min(255, $b));

        return self::ESC.'38;2;'.$r.';'.$g.';'.$b.'m';
    }

    /**
     * Reset every attribute (colour, bold, dim, underline).
     */
    public static function reset(): string
    {
        return self::ESC.'0m';
    }
}
