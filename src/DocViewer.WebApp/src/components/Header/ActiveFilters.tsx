export interface ActiveFilter {
  key: string;
  value: string;
  label: string;
}

export interface ActiveFiltersProps {
  filters: ActiveFilter[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
}

export function ActiveFilters({ filters, onRemove, onClearAll }: ActiveFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <div className="active-filters">
      {filters.map(filter => (
        <div key={filter.key} className="filter-pill">
          <span className="filter-label">{filter.label}</span>
          <button
            className="filter-remove"
            onClick={() => onRemove(filter.key)}
            aria-label="Remove filter"
          >
            ×
          </button>
        </div>
      ))}
      {filters.length > 0 && (
        <button className="clear-all" onClick={onClearAll}>
          Clear all
        </button>
      )}
    </div>
  );
}

export default ActiveFilters;