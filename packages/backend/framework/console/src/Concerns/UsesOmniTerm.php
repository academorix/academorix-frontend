<?php

/**
 * @file UsesOmniTerm.php
 * @module Academorix\Cli\Concerns
 * @description Wires the OmniTerm renderer onto every command. OmniTerm is
 *   the polished status/table/task output layer we vendor from
 *   pdphilip/omniterm v3. Full binding contract will live in
 *   .kiro/specs/utils-work/omniterm-tasks.md when that sub-spec lands.
 */

declare(strict_types=1);

namespace Academorix\Console\Concerns;

use OmniTerm\HasOmniTerm;

/**
 * Composed by every command through {@see \Academorix\Cli\Commands\AbstractCommand}.
 *
 * Every command carries a `$this->omni` handle after `bootUsesOmniTerm()`
 * runs. Commands call `$this->omni->titleBar(...)`, `->tableRow(...)`,
 * `->statusSuccess(...)` etc. directly.
 */
trait UsesOmniTerm
{
    use HasOmniTerm;
}
