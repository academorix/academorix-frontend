<?php

declare(strict_types=1);

namespace Academorix\SportsPerformanceSdk;

use Academorix\ApiSdk\Attributes\AsSdkResource;
use Academorix\ApiSdk\Resources\BaseSdkResource;

/**
 * Top-level SDK Resource for the `performance` module.
 *
 * Registered under `#[AsSdkResource(name: 'performance', service: 'sports')]`
 * so the Sports service umbrella auto-discovers it at boot
 * and consumers dispatch every call via `$sdk->performance()->...`.
 *
 * ## Peer Resources
 *
 * - BenchmarksResource — peer resource for `benchmarks`.
 * - PerformanceTestResultsResource — peer resource for `performance-test-results`.
 * - PerformanceTestsResource — peer resource for `performance-tests`.
 * - TestBatteriesResource — peer resource for `test-batteries`.
 *
 * @category PerformanceSdk
 *
 * @since    0.1.0
 */
#[AsSdkResource(name: 'performance', service: 'sports')]
final class PerformanceSdkResource extends BaseSdkResource
{
    private ?Resources\BenchmarksResource $benchmarks = null;
    private ?Resources\PerformanceTestResultsResource $performanceTestResults = null;
    private ?Resources\PerformanceTestsResource $performanceTests = null;
    private ?Resources\TestBatteriesResource $testBatteries = null;

    /**
     * Access Benchmarks peer Resource.
     */
    public function benchmarks(): Resources\BenchmarksResource
    {
        return $this->benchmarks ??= new Resources\BenchmarksResource($this->connector);
    }

    /**
     * Access PerformanceTestResults peer Resource.
     */
    public function performanceTestResults(): Resources\PerformanceTestResultsResource
    {
        return $this->performanceTestResults ??= new Resources\PerformanceTestResultsResource($this->connector);
    }

    /**
     * Access PerformanceTests peer Resource.
     */
    public function performanceTests(): Resources\PerformanceTestsResource
    {
        return $this->performanceTests ??= new Resources\PerformanceTestsResource($this->connector);
    }

    /**
     * Access TestBatteries peer Resource.
     */
    public function testBatteries(): Resources\TestBatteriesResource
    {
        return $this->testBatteries ??= new Resources\TestBatteriesResource($this->connector);
    }
}
