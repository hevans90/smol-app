import { useState } from 'react';
import { BaseSelect } from './base';

export function MultiSelect({
  options,
  placeholder,
  showSelected,
  defaultIndices = [],
  onSelectionChange,
  className,
}: {
  options: { value: string; display?: string; imgSrc?: string }[];
  placeholder?: string;
  showSelected?: boolean;
  defaultIndices?: number[];
  onSelectionChange?: (values: string[]) => void;
  className?: string;
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
