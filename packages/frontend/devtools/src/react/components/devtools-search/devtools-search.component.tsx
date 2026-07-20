/**
 * @file devtools-search.component.tsx
 * @module @stackra/devtools/react/components
 * @description Top-of-drawer search input. Persists through the
 *   `frame-state.searchQuery` field.
 */

import { type ChangeEvent, type ReactElement } from 'react';
import { InputGroup } from '@stackra/ui/react';
import { MagnifyingGlassIcon } from '@stackra/ui/icons/heroicon/outline';

import { useDevtoolsSearch } from '../../hooks/use-devtools-search.hook';
import type { DevtoolsSearchProps } from './devtools-search.interface';

/**
 * Top-of-drawer panel-filter input.
 */
export function DevtoolsSearch({ className }: DevtoolsSearchProps): ReactElement {
  const { query, setQuery } = useDevtoolsSearch();

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setQuery(event.target.value);
  };

  return (
    <InputGroup className={className} variant="secondary">
      <InputGroup.Prefix>
        <MagnifyingGlassIcon aria-hidden="true" className="size-4 text-muted" />
      </InputGroup.Prefix>
      <InputGroup.Input
        aria-label="Search panels"
        placeholder="Search panels"
        value={query}
        onChange={handleChange}
        data-devtools-search=""
      />
    </InputGroup>
  );
}
