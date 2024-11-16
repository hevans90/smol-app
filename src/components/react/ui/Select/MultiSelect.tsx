import { useState } from 'react';
import { BaseSelect, type SelectOption } from './base';

export function MultiSelect({
  className,
  compactDisplay = false,
  defaultIndices = [],
  disabled = false,
  onSelectionChange,
  options,
  placeholder,
  showSelected,
}: {
  className?: string;
  compactDisplay?: boolean;
  defaultIndices?: number[];
  disabled?: boolean;
  onSelectionChange?: (values: string[]) => void;
  options: SelectOption[];
  placeholder?: string;
  showSelected?: boolean;
}) {
  const [selectedIndices, setSelectedIndices] =
    useState<number[]>(defaultIndices);

  const handleSelectionChange = (indices: number[]) => {
    setSelectedIndices(indices);
    if (onSelectionChange) {
      onSelectionChange(indices.map((i) => options[i]?.value));
    }
  };

  return (
    <BaseSelect
      disabled={disabled}
      compactDisplay={compactDisplay}
      options={options}
      placeholder={placeholder}
      showSelected={showSelected}
      multi={true}
      selectedIndices={selectedIndices}
      onSelectionChange={handleSelectionChange}
      className={className}
    />
  );
}
