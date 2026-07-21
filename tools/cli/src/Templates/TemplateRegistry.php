<?php

/**
 * @file TemplateRegistry.php
 * @module Stackra\Cli\Templates
 * @description Maps `backend-app` / `web-app` / `mobile-app` to their
 *   source directories under `<workspaceRoot>/templates/`. v0.1 CLI
 *   ships without templates; that's expected — the registry raises a
 *   `TemplateException::forMissingTemplateDir(...)` when the source dir
 *   isn't there yet.
 */

declare(strict_types=1);

namespace Stackra\Cli\Templates;

use Stackra\Cli\Exceptions\TemplateException;
use Stackra\Cli\Support\PathResolver;

/**
 * Fixed list of template kinds the CLI supports.
 */
final class TemplateRegistry
{
    public const KINDS = ['backend-app', 'web-app', 'mobile-app'];

    public function __construct(private readonly PathResolver $pathResolver) {}

    /**
     * Resolve the on-disk directory for a template kind.
     */
    public function directoryFor(string $kind): string
    {
        if (! in_array($kind, self::KINDS, true)) {
            throw TemplateException::forInvalidTemplateKind($kind, self::KINDS);
        }

        $path = $this->pathResolver->templatesRoot().'/'.$kind;
        if (! is_dir($path)) {
            throw TemplateException::forMissingTemplateDir($kind);
        }

        return $path;
    }

    /**
     * @return array<int, string>
     */
    public function kinds(): array
    {
        return self::KINDS;
    }
}
