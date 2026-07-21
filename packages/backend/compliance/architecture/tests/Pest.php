<?php

/**
 * @file packages/architecture/tests/Pest.php
 *
 * @description
 * Pest bootstrap for the `stackra/architecture` package.
 *
 * The package has no `vendor/` of its own — it's installed inside
 * consumer applications. To keep the test-suite runnable in every
 * layout (fresh clone with no install, package with its own
 * install, package installed under a consumer app) this bootstrap
 * hunts for a vendor autoloader in a small list of well-known
 * locations, then falls back to a hand-rolled PSR-4 autoloader for
 * the `Stackra\Architecture\` namespace.
 *
 * The manual autoloader is the same pattern used by
 * {@see \packages\architecture\tests\scan-template.php} — kept in
 * sync so both entry-points behave identically.
 *
 * ## No global TestCase binding
 *
 * These tests do NOT boot Laravel. Every rule is exercised in
 * isolation with hand-constructed `SourceFile` fixtures — there
 * is nothing to bootstrap, no service provider to register,
 * nothing that needs the container. We deliberately skip
 * `uses(TestCase::class)` and rely on plain `it(...)` blocks.
 */

declare(strict_types=1);

// -----------------------------------------------------------------
// 1) Prefer a Composer-generated autoloader when available. The
//    package's own vendor/ wins if `composer install` was run
//    inside the package; otherwise we borrow the template app's
//    autoloader (it carries Pest + every framework class the
//    scan-template smoke test exercises).
// -----------------------------------------------------------------
$vendorCandidates = [
    __DIR__ . '/../vendor/autoload.php',
    __DIR__ . '/../../../apps/template/vendor/autoload.php',
    __DIR__ . '/../../../vendor/autoload.php',
];

$vendorLoaded = false;
foreach ($vendorCandidates as $vendorPath) {
    if (is_file($vendorPath)) {
        require_once $vendorPath;
        $vendorLoaded = true;
        break;
    }
}

// -----------------------------------------------------------------
// 2) Even when a vendor autoloader is present it might not know
//    about the `Stackra\Architecture\` namespace (fresh clones,
//    partial installs). Register a defensive PSR-4 shim regardless
//    — Composer's autoloader is tried first, ours is a fallback,
//    so double-registration is safe.
// -----------------------------------------------------------------
spl_autoload_register(function (string $class): void {
    // Only handle this package's own namespace. Every other request
    // falls through to whatever else is registered.
    $prefix = 'Stackra\\Architecture\\';
    if (! str_starts_with($class, $prefix)) {
        return;
    }

    // Translate `Stackra\Architecture\Support\SourceFile` →
    // `packages/architecture/src/Support/SourceFile.php`.
    $relative = substr($class, strlen($prefix));
    $path = __DIR__ . '/../src/' . str_replace('\\', '/', $relative) . '.php';

    if (is_file($path)) {
        require_once $path;
    }
});

// Silence static-analysis "variable declared but not used" warnings
// while still keeping the value locally observable for debugging.
unset($vendorLoaded);
