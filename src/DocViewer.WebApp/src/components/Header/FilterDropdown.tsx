import { useState, useRef, useEffect } from 'react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
}

export function FilterDropdown({ label, options, value, onChange, multiple = false }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const current = Array.isArray(value) ? value : [];
      if (current.includes(optionValue)) {
        onChange(current.filter(v => v !== optionValue));
      } else {
        onChange([...current, optionValue]);
      }
    } else {
      onChange(optionValue === value ? '' : optionValue);
    }
  };

  const isSelected = (optionValue: string) => {
    if (multiple) {
      return Array.isArray(value) && value.includes(optionValue);
    }
    return value === optionValue;
  };

  return (
    <div className="filter-dropdown" ref={ref}>
      <button
        className={`filter-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {label} {Array.isArray(value) && value.length > 0 ? `(${value.length})` : value ? ': ' + value : ''}
      </button>
      {isOpen && (
        <div className="filter-menu">
          {options.map(option => (
            <div
              key={option.value}
              className={`filter-option ${isSelected(option.value) ? 'selected' : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              {multiple && <span className="checkbox">{isSelected(option.value) ? '✓' : ''}</span>}
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FilterDropdown;