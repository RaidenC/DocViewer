// src/DocViewer.WebApp/src/components/Header/DateFilter.tsx
import './DateFilter.css';

interface DateFilterProps {
  fromDate: string;
  toDate: string;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
}

export default function DateFilter({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
}: DateFilterProps) {
  return (
    <div className="date-filter">
      <label className="date-filter-label">
        From:
        <input
          type="date"
          className="date-filter-input"
          value={fromDate}
          onChange={(e) => onFromDateChange(e.target.value)}
        />
      </label>
      <label className="date-filter-label">
        To:
        <input
          type="date"
          className="date-filter-input"
          value={toDate}
          onChange={(e) => onToDateChange(e.target.value)}
        />
      </label>
      {(fromDate || toDate) && (
        <button
          className="date-filter-clear"
          onClick={() => {
            onFromDateChange('');
            onToDateChange('');
          }}
        >
          Clear
        </button>
      )}
    </div>
  );
}