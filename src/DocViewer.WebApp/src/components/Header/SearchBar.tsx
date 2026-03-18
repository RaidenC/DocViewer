import { useState, useCallback, useTransition, useEffect } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({ onSearch, placeholder = 'Search documents...' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      startTransition(() => {
        onSearch(query);
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, onSearch]);

  return (
    <div className="search-bar">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className={isPending ? 'pending' : ''}
      />
      {isPending && <span className="search-indicator">...</span>}
    </div>
  );
}

export default SearchBar;