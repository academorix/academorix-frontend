<?php

declare(strict_types=1);

namespace Academorix\FinanceExpensesSdk;

use Academorix\ApiSdk\Attributes\AsSdkResource;
use Academorix\ApiSdk\Resources\BaseSdkResource;

/**
 * Top-level SDK Resource for the `expenses` module.
 *
 * Registered under `#[AsSdkResource(name: 'expenses', service: 'finance')]`
 * so the Finance service umbrella auto-discovers it at boot
 * and consumers dispatch every call via `$sdk->expenses()->...`.
 *
 * ## Peer Resources
 *
 * - BudgetsResource — peer resource for `budgets`.
 * - CostCentersResource — peer resource for `cost-centers`.
 * - ExpenseCategoriesResource — peer resource for `expense-categories`.
 * - ExpensesResource — peer resource for `expenses`.
 * - PayrollLinesResource — peer resource for `payroll-lines`.
 * - PayrollRunsResource — peer resource for `payroll-runs`.
 *
 * @category ExpensesSdk
 *
 * @since    0.1.0
 */
#[AsSdkResource(name: 'expenses', service: 'finance')]
final class ExpensesSdkResource extends BaseSdkResource
{
    private ?Resources\BudgetsResource $budgets = null;
    private ?Resources\CostCentersResource $costCenters = null;
    private ?Resources\ExpenseCategoriesResource $expenseCategories = null;
    private ?Resources\ExpensesResource $expenses = null;
    private ?Resources\PayrollLinesResource $payrollLines = null;
    private ?Resources\PayrollRunsResource $payrollRuns = null;

    /**
     * Access Budgets peer Resource.
     */
    public function budgets(): Resources\BudgetsResource
    {
        return $this->budgets ??= new Resources\BudgetsResource($this->connector);
    }

    /**
     * Access CostCenters peer Resource.
     */
    public function costCenters(): Resources\CostCentersResource
    {
        return $this->costCenters ??= new Resources\CostCentersResource($this->connector);
    }

    /**
     * Access ExpenseCategories peer Resource.
     */
    public function expenseCategories(): Resources\ExpenseCategoriesResource
    {
        return $this->expenseCategories ??= new Resources\ExpenseCategoriesResource($this->connector);
    }

    /**
     * Access Expenses peer Resource.
     */
    public function expenses(): Resources\ExpensesResource
    {
        return $this->expenses ??= new Resources\ExpensesResource($this->connector);
    }

    /**
     * Access PayrollLines peer Resource.
     */
    public function payrollLines(): Resources\PayrollLinesResource
    {
        return $this->payrollLines ??= new Resources\PayrollLinesResource($this->connector);
    }

    /**
     * Access PayrollRuns peer Resource.
     */
    public function payrollRuns(): Resources\PayrollRunsResource
    {
        return $this->payrollRuns ??= new Resources\PayrollRunsResource($this->connector);
    }
}
