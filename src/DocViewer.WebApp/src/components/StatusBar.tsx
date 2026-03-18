export interface StatusBarProps {
  totalCount: number;
  filteredCount?: number;
  selectedCount: number;
  isLoading?: boolean;
}

export function StatusBar({ totalCount, filteredCount, selectedCount, isLoading }: StatusBarProps) {
  return (
    <div className="status-bar">
      <div className="status-item">
        {isLoading && <span className="loading-indicator">●</span>}
        <span>{filteredCount !== undefined
          ? `${filteredCount} of ${totalCount} documents`
          : `${totalCount} documents`}</span>
      </div>
      {selectedCount > 0 && (
        <div className="status-item">
          {selectedCount} selected
        </div>
      )}
    </div>
  );
}

export default StatusBar;