import { useState, useRef, useEffect } from 'react';
import './SearchableSelect.css';

interface SearchableSelectProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchableSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Search...',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedLabel = options.find(o => o.value === value)?.label || '';

  const handleSelect = (optionValue: string) => {
    onChange(optionValue === value ? '' : optionValue);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="searchable-select" ref={ref}>
      <button
        className={`searchable-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {label}: {selectedLabel || 'All'}
      </button>
      {isOpen && (
        <div className="searchable-select-dropdown">
          <input
            type="text"
            className="searchable-select-search"
            placeholder={placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className="searchable-select-options">
            {filteredOptions.length === 0 ? (
              <div className="searchable-select-empty">No results</div>
            ) : (
              filteredOptions.map(option => (
                <div
                  key={option.value}
                  className={`searchable-select-option ${option.value === value ? 'selected' : ''}`}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.value === value && <span className="checkmark">✓</span>}
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}