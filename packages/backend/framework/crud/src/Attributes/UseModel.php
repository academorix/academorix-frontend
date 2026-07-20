<?php

declare(strict_types=1);

/**
 * Use Model Attribute
 *
 * PHP 8 attribute for compile-time metadata annotation in the Framework module.
 * Discovered by the compiler to configure runtime behavior automatically.
 *
 * @category Attributes
 *
 * @since    1.0.0
 */
namespace Academorix\Crud\Attributes;

use Attribute;

/**
 * UseModel Attribute for Repository Classes.
 *
 * Defines the model interface that a repository manages. This attribute
 * eliminates the need for a `model()` method in each repository class.
 *
 * The model interface should have a #[Bind] attribute pointing to the
 * concrete model class, allowing the container to resolve it.
 *
 * ## Usage:
 * ```php
 * use Academorix\Crud\Attributes\UseModel;
 * use Academorix\Users\Contracts\Data\UserInterface;
 *
 * #[UseModel(UserInterface::class)]
 * class UserRepository extends Repository implements UserRepositoryInterface
 * {
 *     // No need for model() method - it's handled by the attribute
 * }
 * ```
 *
 * ## How it works:
 * 1. Repository base class reads the #[UseModel] attribute via reflection
 * 2. The attribute contains the model interface class name
 * 3. The interface has #[Bind(ConcreteModel::class)] attribute
 * 4. Container resolves the interface to the concrete model
 *
 * @since 1.0.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class UseModel
{
    /**
     * Create a new Model attribute instance.
     *
     * @param  class-string  $interface  The model interface class name
     */
    public function __construct(
        public string $interface,
    ) {}
}
