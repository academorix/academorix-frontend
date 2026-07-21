<?php

declare(strict_types=1);

/**
 * Abstract Base Controller
 *
 * Support class providing Base Controller utilities for the Framework module.
 * Contains helper logic used across multiple components in this module.
 *
 * @category Support
 *
 * @since    1.0.0
 */
namespace Stackra\Routing;

/**
 * BaseController alias.
 *
 * Backward-compatible alias for the Controller class.
 * New code should use `Stackra\Routing\Controller` directly.
 *
 * @see Controller
 */
abstract class BaseController extends Controller {}
