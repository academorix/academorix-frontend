<?php

/**
 * @file packages/architecture/tests/Unit/Rules/NoRoutesFolderRuleTest.php
 *
 * @description
 * Behaviour tests for
 * {@see \Stackra\Architecture\Rules\NoRoutesFolderRule}.
 *
 * Route files are forbidden — every URL is declared on a
 * controller via routing attributes. This suite builds real
 * filesystem fixtures under `sys_get_temp_dir()` so we exercise
 * the rule's actual `file_exists()` / `scandir()` calls rather
 * than a mocked filesystem.
 *
 * Layouts covered:
 *
 *   - Mono-repo — scan root has no `composer.json`; each direct
 *     child that DOES have one is treated as an app.
 *   - Single-app — scan root itself has `composer.json`; the root
 *     is the app.
 *
 * Every temp directory is torn down in `finally` so a failing
 * test doesn't leak fixtures.
 */

declare(strict_types=1);

use Stackra\Architecture\Rules\NoRoutesFolderRule;

/**
 * Build the rule with the shipped config defaults. Kept as a
 * helper so tests focus on the fixtures they build, not the
 * config knobs they enable.
 */
function make_no_routes_folder_rule(): NoRoutesFolderRule
{
    return new NoRoutesFolderRule([
        'severity' => 'error',
        'forbidden_files' => [
            'routes/api.php',
            'routes/web.php',
            'routes/channels.php',
        ],
    ]);
}

/**
 * Create a unique temp directory under the system temp root. We
 * use `bin2hex(random_bytes(...))` for uniqueness so parallel
 * test workers can't collide.
 */
function make_tmp_root(): string
{
    $root = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'arch-routes-' . bin2hex(random_bytes(4));
    if (! mkdir($root, 0o777, true) && ! is_dir($root)) {
        throw new RuntimeException("Failed to create temp dir: {$root}");
    }

    return $root;
}

/**
 * Recursively remove a directory tree. Used by every test's
 * `finally` clause — plain `rmdir()` is not enough because tests
 * create nested fixtures.
 */
function remove_recursive(string $path): void
{
    if (! file_exists($path)) {
        return;
    }
    if (is_file($path) || is_link($path)) {
        @unlink($path);
        return;
    }
    // Directory — recurse into children first.
    $entries = @scandir($path) ?: [];
    foreach ($entries as $entry) {
        if ($entry === '.' || $entry === '..') {
            continue;
        }
        remove_recursive($path . DIRECTORY_SEPARATOR . $entry);
    }
    @rmdir($path);
}

/**
 * Convenience — write `$contents` to `$path`, creating parent
 * directories as needed.
 */
function write_fixture_file(string $path, string $contents = ''): void
{
    $dir = dirname($path);
    if (! is_dir($dir)) {
        mkdir($dir, 0o777, true);
    }
    file_put_contents($path, $contents);
}

it('fires when apps/foo/routes/api.php exists in a monorepo layout', function (): void {
    $root = make_tmp_root();
    try {
        // Build the app root — composer.json marks it as an app,
        // routes/api.php is the forbidden file the rule watches.
        write_fixture_file($root . '/apps/foo/composer.json', '{}');
        write_fixture_file($root . '/apps/foo/routes/api.php', "<?php\n");

        // Scan the monorepo `/apps` directory — no composer.json
        // at that level, so the rule iterates children.
        $violations = make_no_routes_folder_rule()->check($root . '/apps');

        expect($violations)->toHaveCount(1)
            ->and($violations[0]->offender)->toBe('routes/api.php')
            ->and($violations[0]->ruleId)->toBe('architecture.no_routes_folder');
    } finally {
        remove_recursive($root);
    }
});

it('fires when apps/foo/routes/web.php exists in a monorepo layout', function (): void {
    $root = make_tmp_root();
    try {
        write_fixture_file($root . '/apps/foo/composer.json', '{}');
        write_fixture_file($root . '/apps/foo/routes/web.php', "<?php\n");

        $violations = make_no_routes_folder_rule()->check($root . '/apps');

        expect($violations)->toHaveCount(1)
            ->and($violations[0]->offender)->toBe('routes/web.php');
    } finally {
        remove_recursive($root);
    }
});

it('does not fire when the routes folder is empty', function (): void {
    $root = make_tmp_root();
    try {
        // App exists and has a routes/ folder — but none of the
        // forbidden files live inside it. The rule tests specific
        // file existence, so this is a clean run.
        write_fixture_file($root . '/apps/foo/composer.json', '{}');
        mkdir($root . '/apps/foo/routes', 0o777, true);

        $violations = make_no_routes_folder_rule()->check($root . '/apps');

        expect($violations)->toBe([]);
    } finally {
        remove_recursive($root);
    }
});

it('supports single-app layouts where the scan root is the app itself', function (): void {
    $root = make_tmp_root();
    try {
        // Single-app layout: composer.json sits at the scan root.
        // The rule's `candidateAppRoots()` helper treats the root
        // itself as the app and doesn't try to enumerate children.
        write_fixture_file($root . '/composer.json', '{}');
        write_fixture_file($root . '/routes/api.php', "<?php\n");

        $violations = make_no_routes_folder_rule()->check($root);

        expect($violations)->toHaveCount(1)
            ->and($violations[0]->offender)->toBe('routes/api.php');
    } finally {
        remove_recursive($root);
    }
});
