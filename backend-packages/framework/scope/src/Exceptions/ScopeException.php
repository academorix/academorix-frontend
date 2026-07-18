<?php

/**
 * @file src/Exceptions/ScopeException.php
 *
 * @description
 * Base exception for the entire scope package. Every scope-specific
 * exception extends this class so a consumer can catch scope
 * failures with a single `catch (ScopeException $e)` and route them
 * uniformly (e.g. to a 409 response for conflicts, 422 for
 * validation, 428 for missing context).
 */

declare(strict_types=1);

namespace Academorix\Scope\Exceptions;

use RuntimeException;

/**
 * Base exception for the scope package.
 *
 * Kept as an unchecked runtime exception because scope failures
 * are configuration or programming errors (missing middleware,
 * un-registered namespace, malformed slug) — not domain-level
 * conditions the caller can recover from at the call site.
 */
class ScopeException extends RuntimeException {}
