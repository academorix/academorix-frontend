<?php

/**
 * @file Palette.php
 * @module Stackra\Cli\Support
 * @description Eleven gradient palettes for the STACKRA banner. Each is
 *   six ANSI 256-color values chosen to look right on the 6-line block-
 *   figlet banner rendered by {@see \Stackra\Cli\Concerns\RendersBrandArt}.
 */

declare(strict_types=1);

namespace Stackra\Cli\Support;

/**
 * Static palette catalogue. Everything is `readonly` and immutable.
 */
final class Palette
{
    /** @var array<string, array<int, int>> */
    public const PALETTES = [
        'red' => [196, 202, 208, 214, 220, 226],
        'gray' => [232, 236, 240, 244, 248, 252],
        'ocean' => [17, 18, 19, 20, 21, 27],
        'vaporwave' => [201, 165, 129, 93, 57, 27],
        'sunset' => [214, 208, 202, 196, 160, 124],
        'aurora' => [82, 118, 154, 190, 226, 220],
        'ember' => [88, 124, 160, 196, 202, 208],
        'cyberpunk' => [201, 200, 199, 198, 197, 196],
        'emerald' => [22, 28, 34, 40, 46, 82],
        'azure' => [17, 19, 21, 27, 33, 39],
        'royal' => [54, 55, 56, 57, 63, 69],
    ];

    /**
     * Return one palette by name, or a random one when `null`.
     *
     * @return array<int, int>
     */
    public static function random(?string $name = null): array
    {
        if ($name !== null && isset(self::PALETTES[$name])) {
            return self::PALETTES[$name];
        }

        $keys = array_keys(self::PALETTES);
        $pick = $keys[random_int(0, count($keys) - 1)];

        return self::PALETTES[$pick];
    }

    /**
     * List every registered palette name.
     *
     * @return array<int, string>
     */
    public static function names(): array
    {
        return array_keys(self::PALETTES);
    }
}
