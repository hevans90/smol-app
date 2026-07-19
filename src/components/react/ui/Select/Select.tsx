import { useState } from 'react';
import { BaseSelect, type SelectOption } from './base';

export function Select({
  options,
  placeholder,
  showSelected,
  defaultIndex,
  disabled = false,
  onSelectChange,
  className,
}: {
  options: SelectOption[];
  placeholder?: string;
  showSelected?: boolean;
  defaultIndex?: number;
  disabled?: boolean;
  onSelectChange?: (value: string) => void;
  className?: string;
}) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>(
    defaultIndex !== undefined ? [defaultIndex] : [],
  );

  const handleSelectionChange = (indices: number[]) => {
    setSelectedIndices(indices);
    if (onSelectChange) {
      onSelectChange(indices.length > 0 ? options[indices[0]].value : '');
    }
  };

  return (
    <BaseSelect
      options={options}
      placeholder={placeholder}
      showSelected={showSelected}
      disabled={disabled}
      multi={false}
      selectedIndices={selectedIndices}
      onSelectionChange={handleSelectionChange}
      className={className}
    />
  );
}
