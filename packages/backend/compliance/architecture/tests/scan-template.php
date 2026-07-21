<?php

declare(strict_types=1);

/**
 * @file packages/architecture/tests/scan-template.php
 *
 * @description
 * Manual real-world scan of `apps/template/src` using EVERY
 * shipped rule with the config-file defaults. Serves as both:
 *
 *   1. A "does the scanner actually work end-to-end?" test.
 *   2. A false-positive audit of the current template app.
 *
 * Reports per-rule violation counts + prints the first two
 * violations per rule so I can eyeball whether each is a real
 * problem or a rule needing adjustment.
 *
 * Run: php packages/architecture/tests/scan-template.php
 */

spl_autoload_register(function (string $class): void {
    $prefix = 'Stackra\\Architecture\\';
    if (! str_starts_with($class, $prefix)) {
        return;
    }

    $base = __DIR__ . '/../src/';
    $relative = substr($class, strlen($prefix));
    $path = $base . str_replace('\\', '/', $relative) . '.php';

    if (file_exists($path)) {
        require $path;
    }
});

// Also autoload symfony/finder from the composer vendor if it
// exists in any parent app; otherwise fall back to a minimal
// shim. The template app should have it via its own vendor/
// directory once composer install runs.
$vendorAutoloads = [
    __DIR__ . '/../vendor/autoload.php',
    __DIR__ . '/../../../apps/template/vendor/autoload.php',
    __DIR__ . '/../../../vendor/autoload.php',
];
foreach ($vendorAutoloads as $vendor) {
    if (file_exists($vendor)) {
        require_once $vendor;
        break;
    }
}

use Stackra\Architecture\Rules\CommandUsesAttributeSignatureRule;
use Stackra\Architecture\Rules\ControllerExtendsBaseRule;
use Stackra\Architecture\Rules\ControllerNeedsAsControllerRule;
use Stackra\Architecture\Rules\EnumIsBackedStringRule;
use Stackra\Architecture\Rules\EventReadonlyPropertiesRule;
use Stackra\Architecture\Rules\FinalDomainClassesRule;
use Stackra\Architecture\Rules\JobHasQueueAttributeRule;
use Stackra\Architecture\Rules\JobImplementsFailedRule;
use Stackra\Architecture\Rules\MiddlewareNeedsAsMiddlewareRule;
use Stackra\Architecture\Rules\ModelNoSideEffectsRule;
use Stackra\Architecture\Rules\ModelUsesFillableAttributeRule;
use Stackra\Architecture\Rules\NoAppMakeInConstructorRule;
use Stackra\Architecture\Rules\NoDirectModelAccessRule;
use Stackra\Architecture\Rules\NoEnvOutsideConfigRule;
use Stackra\Architecture\Rules\NoFacadesInServicesRule;
use Stackra\Architecture\Rules\NoFormRequestRule;
use Stackra\Architecture\Rules\NoHttpNamespaceNestingRule;
use Stackra\Architecture\Rules\NoJsonResourceRule;
use Stackra\Architecture\Rules\NoQueryBuilderInServicesRule;
use Stackra\Architecture\Rules\NoRepositoryFromControllerRule;
use Stackra\Architecture\Rules\NoRequestValidateInControllerRule;
use Stackra\Architecture\Rules\NoRouteFacadeRule;
use Stackra\Architecture\Rules\NoSingletonOnScopedDepsRule;
use Stackra\Architecture\Rules\NoStaticStateInServicesRule;
use Stackra\Architecture\Rules\RepositoryNeedsBindRule;
use Stackra\Architecture\Rules\RequireFileDocblockRule;
use Stackra\Architecture\Rules\RequireStrictTypesRule;
use Stackra\Architecture\Rules\NoRoutesFolderRule;
use Stackra\Architecture\Rules\NoResourcesFolderRule;
use Stackra\Architecture\Rules\NoAppFolderRule;
use Stackra\Architecture\Rules\NoRouteServiceProviderRule;
use Stackra\Architecture\Rules\MigrationHasDownRule;
use Stackra\Architecture\Rules\NoEnvFileRule;
use Stackra\Architecture\Rules\RepositoryInterfaceSuffixRule;
use Stackra\Architecture\Support\LayerResolver;
use Stackra\Architecture\Support\SourceFileParser;

$appPath = realpath(__DIR__ . '/../../../apps/template');
if ($appPath === false) {
    echo "ERROR: could not resolve apps/template path\n";
    exit(1);
}

$scanPath = $appPath . '/src';

echo "Scanning: $scanPath\n\n";

$parser = new SourceFileParser();

// Resolver — mirrors the shipped config.
$resolver = new LayerResolver(
    namespaceMap: [
        'model' => ['App\\Models\\'],
        'repository' => ['App\\Repositories\\'],
        'service' => ['App\\Services\\'],
        'action' => ['App\\Actions\\'],
        'controller' => ['App\\Http\\Controllers\\'],
        'infrastructure' => [
            'App\\Providers\\', 'App\\Http\\Middleware\\', 'App\\Console\\',
            'App\\Observers\\', 'App\\Policies\\', 'App\\Notifications\\',
            'App\\Broadcasting\\', 'App\\Jobs\\', 'App\\Events\\',
            'App\\Listeners\\', 'App\\Mail\\',
            'Database\\Factories\\', 'Database\\Seeders\\',
        ],
    ],
    modelBaseClasses: ['Model', 'Authenticatable', 'Pivot', 'MorphPivot'],
    controllerBaseClasses: ['Controller', 'BaseController'],
    testPathPrefixes: [$appPath . '/tests'],
    infraPathPrefixes: [],
);

// Build every source rule with its config subtree (mirrors what
// the ServiceProvider does at runtime).
$sourceRules = [
    new NoDirectModelAccessRule($resolver, ['severity' => 'error', 'model_namespaces' => ['App\\Models\\']]),
    new NoRepositoryFromControllerRule($resolver, ['enabled' => false, 'severity' => 'warning', 'repository_namespaces' => ['App\\Repositories\\']]),
    new NoFormRequestRule($resolver, ['severity' => 'error', 'forbidden_bases' => ['Illuminate\\Foundation\\Http\\FormRequest']]),
    new NoJsonResourceRule($resolver, ['severity' => 'error', 'forbidden_bases' => ['Illuminate\\Http\\Resources\\Json\\JsonResource', 'Illuminate\\Http\\Resources\\Json\\ResourceCollection']]),
    new NoFacadesInServicesRule($resolver, ['severity' => 'error', 'forbidden_namespaces' => ['Illuminate\\Support\\Facades\\'], 'allowed_facades' => []]),
    new ControllerExtendsBaseRule($resolver, ['severity' => 'error', 'required_base' => 'Stackra\\Routing\\BaseController', 'forbidden_bases' => ['Illuminate\\Routing\\Controller']]),
    new ControllerNeedsAsControllerRule($resolver, ['severity' => 'error', 'required_attribute' => 'Stackra\\Routing\\Attributes\\AsController']),
    new RepositoryNeedsBindRule($resolver, ['severity' => 'error', 'required_attribute' => 'Illuminate\\Container\\Attributes\\Bind']),
    new MiddlewareNeedsAsMiddlewareRule($resolver, ['severity' => 'error', 'required_attribute' => 'Stackra\\Routing\\Attributes\\AsMiddleware', 'middleware_namespaces' => ['App\\Http\\Middleware\\']]),
    new FinalDomainClassesRule($resolver, ['severity' => 'error', 'required_layers' => ['controller', 'service', 'action']]),
    new RequireStrictTypesRule($resolver, ['severity' => 'error', 'exempt_paths' => ['/config/', '/bootstrap/']]),
    new RequireFileDocblockRule($resolver, ['severity' => 'warning', 'required_tags' => ['@file', '@description'], 'exempt_paths' => ['/config/', '/bootstrap/', '/database/migrations/']]),
    new NoEnvOutsideConfigRule($resolver, ['severity' => 'error', 'exempt_paths' => ['/config/', '/database/factories/', '/database/seeders/']]),
    new NoRouteFacadeRule($resolver, ['severity' => 'error']),
    new NoStaticStateInServicesRule($resolver, ['severity' => 'error', 'targeted_layers' => ['service', 'action', 'repository', 'controller']]),
    new NoRequestValidateInControllerRule($resolver, ['severity' => 'error']),
    new NoAppMakeInConstructorRule($resolver, ['severity' => 'error']),
    new NoQueryBuilderInServicesRule($resolver, ['severity' => 'error', 'model_namespaces' => ['App\\Models\\'], 'query_facades' => ['DB::table', 'DB::query']]),
    new NoSingletonOnScopedDepsRule($resolver, ['severity' => 'error', 'scoped_attributes' => ['Illuminate\\Container\\Attributes\\CurrentUser', 'Illuminate\\Container\\Attributes\\Authenticated', 'Illuminate\\Container\\Attributes\\RouteParameter', 'Illuminate\\Container\\Attributes\\Context']]),
    new ModelUsesFillableAttributeRule($resolver, ['severity' => 'warning', 'accepted_attributes' => ['Illuminate\\Database\\Eloquent\\Attributes\\Fillable', 'Illuminate\\Database\\Eloquent\\Attributes\\Guarded', 'Illuminate\\Database\\Eloquent\\Attributes\\Unguarded']]),
    new ModelNoSideEffectsRule($resolver, ['severity' => 'warning', 'forbidden_method_names' => ['send', 'notify', 'process', 'charge', 'refund', 'dispatch', 'execute', 'handle']]),
    new EnumIsBackedStringRule($resolver, ['severity' => 'error']),
    new EventReadonlyPropertiesRule($resolver, ['severity' => 'warning', 'event_indicators' => ['namespace_contains' => ['\\Events\\']]]),
    new JobHasQueueAttributeRule($resolver, ['severity' => 'warning', 'required_attributes' => ['Illuminate\\Queue\\Attributes\\Queue', 'Illuminate\\Queue\\Attributes\\Timeout', 'Illuminate\\Queue\\Attributes\\Tries'], 'triggering_interface' => 'ShouldQueue']),
    new JobImplementsFailedRule($resolver, ['severity' => 'warning', 'required_method' => 'failed', 'triggering_interface' => 'ShouldQueue']),
    new CommandUsesAttributeSignatureRule($resolver, ['severity' => 'warning', 'required_attribute' => 'Illuminate\\Console\\Attributes\\Signature', 'command_bases' => ['Illuminate\\Console\\Command']]),
    new NoHttpNamespaceNestingRule($resolver, ['severity' => 'warning', 'forbidden_segments' => ['\\Http\\']]),
];

$pathRules = [
    new NoRoutesFolderRule(['severity' => 'error', 'forbidden_files' => ['routes/api.php', 'routes/web.php', 'routes/channels.php']]),
    new NoResourcesFolderRule(['severity' => 'error', 'forbidden_directories' => ['resources']]),
    new NoAppFolderRule(['severity' => 'error', 'forbidden_directories' => ['app']]),
    new NoRouteServiceProviderRule(['severity' => 'error', 'forbidden_file_names' => ['RouteServiceProvider.php']]),
    new MigrationHasDownRule(['severity' => 'error', 'migration_directories' => ['database/migrations']]),
    new NoEnvFileRule(['severity' => 'error', 'forbidden_files' => ['.env', '.env.local', '.env.production'], 'allowed_files' => ['.env.example']]),
    new RepositoryInterfaceSuffixRule(['severity' => 'warning', 'contracts_directory' => 'Contracts', 'repository_pattern' => '/Repository$/']),
];

// Walk every .php file under $scanPath.
$violationsByRule = [];
$samplesByRule = [];

$directory = new RecursiveDirectoryIterator($scanPath, RecursiveDirectoryIterator::SKIP_DOTS);
$iterator = new RecursiveIteratorIterator($directory);

$fileCount = 0;
foreach ($iterator as $file) {
    if (! $file->isFile() || $file->getExtension() !== 'php') {
        continue;
    }

    $fileCount++;
    $sourceFile = $parser->parseFile($file->getPathname());
    if ($sourceFile === null) {
        continue;
    }

    foreach ($sourceRules as $rule) {
        try {
            $violations = $rule->check($sourceFile);
        } catch (\Throwable $t) {
            $violations = [];
            echo "CRASH in rule " . $rule->id() . " on " . $file->getPathname() . ": " . $t->getMessage() . "\n";
        }
        foreach ($violations as $v) {
            $violationsByRule[$rule->id()] = ($violationsByRule[$rule->id()] ?? 0) + 1;
            if (! isset($samplesByRule[$rule->id()])) {
                $samplesByRule[$rule->id()] = [];
            }
            if (count($samplesByRule[$rule->id()]) < 2) {
                $samplesByRule[$rule->id()][] = $v;
            }
        }
    }
}

// Path rules run once against the app root.
foreach ($pathRules as $rule) {
    try {
        $violations = $rule->check($appPath);
    } catch (\Throwable $t) {
        $violations = [];
        echo "CRASH in path rule " . $rule->id() . ": " . $t->getMessage() . "\n";
    }
    foreach ($violations as $v) {
        $violationsByRule[$rule->id()] = ($violationsByRule[$rule->id()] ?? 0) + 1;
        if (! isset($samplesByRule[$rule->id()])) {
            $samplesByRule[$rule->id()] = [];
        }
        if (count($samplesByRule[$rule->id()]) < 2) {
            $samplesByRule[$rule->id()][] = $v;
        }
    }
}

echo "Scanned $fileCount files\n\n";
echo "=== Violation counts per rule ===\n";
if ($violationsByRule === []) {
    echo "  (none)\n";
} else {
    ksort($violationsByRule);
    foreach ($violationsByRule as $ruleId => $count) {
        echo "  $count  $ruleId\n";
    }
}

echo "\n=== Sample violations (first 2 per rule) ===\n";
foreach ($samplesByRule as $ruleId => $samples) {
    echo "\n[$ruleId]\n";
    foreach ($samples as $v) {
        $relativePath = str_replace($appPath . '/', '', $v->filePath);
        echo "  * $relativePath" . ($v->line ? ":{$v->line}" : '') . "\n";
        echo "    " . $v->message . "\n";
    }
}
