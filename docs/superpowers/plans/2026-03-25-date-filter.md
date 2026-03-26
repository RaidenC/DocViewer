# Date Range Filter - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add date range filter UI to filter documents by receive_time from JSON metadata

**Architecture:** Backend already supports date filtering - add JSON property mapping and frontend UI component

**Tech Stack:** C# .NET, React 19, TypeScript

---

## File Structure

### Backend Changes
- Modify: `src/DocViewer.Domain/Entities/Document.cs` - Add JsonPropertyName for receive_time

### Frontend Changes
- Create: `src/DocViewer.WebApp/src/components/Header/DateFilter.tsx` - Date input component
- Modify: `src/DocViewer.WebApp/src/App.tsx` - Integrate DateFilter

---

## Tasks

### Task 1: Backend - Map receive_time to date field

**Files:**
- Modify: `src/DocViewer.Domain/Entities/Document.cs`

- [ ] **Step 1: Add JsonPropertyName attribute**

Modify the DocumentMetadata class to map `receive_time` JSON field to `date`:

```csharp
using System.Text.Json.Serialization;

namespace DocViewer.Domain.Entities;

public class DocumentMetadata
{
    [JsonPropertyName("receive_time")]
    public DateTime? date { get; set; }
    public string? sender { get; set; }
    public string? subject { get; set; }
    public string? content { get; set; }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd src/DocViewer.Domain && dotnet build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/DocViewer.Domain/Entities/Document.cs
git commit -m "feat: map receive_time to date in DocumentMetadata

Add JsonPropertyName attribute to map JSON receive_time
field to the date property for filtering.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Frontend - Create DateFilter component

**Files:**
- Create: `src/DocViewer.WebApp/src/components/Header/DateFilter.tsx`

- [ ] **Step 1: Create DateFilter component**

```typescript
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
```

- [ ] **Step 2: Create DateFilter CSS**

```css
/* src/DocViewer.WebApp/src/components/Header/DateFilter.css */
.date-filter {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-filter-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.date-filter-input {
  padding: 4px 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.875rem;
}

.date-filter-input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.date-filter-clear {
  padding: 4px 8px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  cursor: pointer;
}

.date-filter-clear:hover {
  background: var(--color-background);
  color: var(--color-text);
}
```

- [ ] **Step 3: Run tests**

Run: `cd src/DocViewer.WebApp && npx vitest run`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add src/DocViewer.WebApp/src/components/Header/DateFilter.tsx src/DocViewer.WebApp/src/components/Header/DateFilter.css
git commit -m "feat: add DateFilter component

Add date range filter with From/To inputs and clear button.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Frontend - Integrate DateFilter in App.tsx

**Files:**
- Modify: `src/DocViewer.WebApp/src/App.tsx`

- [ ] **Step 1: Import DateFilter**

Add to imports:
```typescript
import DateFilter from './components/Header/DateFilter';
```

- [ ] **Step 2: Add state for date filters**

Add to AppContent function:
```typescript
const [fromDate, setFromDate] = useState('');
const [toDate, setToDate] = useState('');
```

- [ ] **Step 3: Pass date filters to useSearch**

Update useSearch call:
```typescript
const { data: searchResults, isLoading: isSearching } = useSearch({
  q: searchQuery,
  channel: channelFilter || undefined,
  client: clientFilter || undefined,
  fromDate: fromDate || undefined,
  toDate: toDate || undefined,
});
```

- [ ] **Step 4: Add DateFilter to header controls**

After the Client filter dropdown:
```typescript
<DateFilter
  fromDate={fromDate}
  toDate={toDate}
  onFromDateChange={setFromDate}
  onToDateChange={setToDate}
/>
```

- [ ] **Step 5: Update ActiveFilters to show date range**

Add to activeFilters array:
```typescript
if (fromDate || toDate) {
  const label = fromDate && toDate
    ? `Date: ${fromDate} to ${toDate}`
    : fromDate
      ? `Date: ${fromDate} onwards`
      : `Date: up to ${toDate}`;
  activeFilters.push({ key: 'date', value: 'date', label });
}
```

Update handleRemoveFilter:
```typescript
case 'date':
  setFromDate('');
  setToDate('');
  break;
```

Update handleClearAll:
```typescript
setFromDate('');
setToDate('');
```

- [ ] **Step 6: Run tests**

Run: `cd src/DocViewer.WebApp && npx vitest run`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add src/DocViewer.WebApp/src/App.tsx
git commit -m "feat: integrate DateFilter in App

Add date range filter to header, pass to search, and show
in active filters.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Manual testing

- [ ] **Step 1: Start the API and frontend**

```bash
# Terminal 1
nx run docviewer-api:serve

# Terminal 2
nx run docviewer-webapp:dev
```

- [ ] **Step 2: Test date filtering**

1. Open browser to http://localhost:5173
2. Select a "From" date - verify results filter
3. Select a "To" date - verify results filter to date range
4. Click "Clear" - verify all results show
5. Verify works alongside channel/client filters

- [ ] **Step 3: Push to GitHub**

```bash
git push -u origin feature/date-filter
```