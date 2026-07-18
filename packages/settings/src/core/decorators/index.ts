/**
 * @file index.ts
 * @module @stackra/settings/core/decorators
 * @description Barrel for the `@Setting()` / `@Field()` / `@Group()` /
 *   `@Section()` decorator family plus their metadata readers.
 */

export { Setting, getSettingMetadata, type ISettingOptions } from './setting.decorator';
export { Field, getFieldDescriptors, type IFieldOptions } from './field.decorator';
export { Group, getGroupDescriptors, type IGroupOptions } from './group.decorator';
export { Section, getSectionDescriptors, type ISectionOptions } from './section.decorator';
