import { useState } from 'react';
import { BaseSelect } from './base';

export function Select({
  options,
  placeholder,
  showSelected,
  defaultIndex,
  onSelectChange,
  className,
}: {
  options: { value: string; display?: string; imgSrc?: string }[];
  placeholder?: string;
  showSelected?: boolean;
  defaultIndex?: number;
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
      multi={false}
      selectedIndices={selectedIndices}
      onSelectionChange={handleSelectionChange}
      className={className}
    />
  );
}
