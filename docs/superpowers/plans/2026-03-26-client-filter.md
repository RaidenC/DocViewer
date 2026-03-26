# Client Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded client dropdown with searchable dropdown fetching client_name from OpenSearch

**Architecture:** Add clientName field to Document, create aggregation endpoint, build searchable frontend component

**Tech Stack:** C# .NET, React 19, TypeScript, OpenSearch

---

## File Structure

### Backend Changes
- Modify: `src/DocViewer.Domain/Entities/Document.cs` - Add clientName field
- Modify: `src/DocViewer.Application/Interfaces/IServices.cs` - Add GetClientNamesAsync method
- Modify: `src/DocViewer.Infrastructure/Services/OpenSearchService.cs` - Add aggregation query
- Modify: `src/DocViewer.Infrastructure/Services/DocumentSyncService.cs` - Extract clientName from JSON
- Modify: `src/DocViewer.Api/Controllers/DocumentsController.cs` - Add /clients endpoint

### Frontend Changes
- Create: `src/DocViewer.WebApp/src/components/Header/SearchableSelect.tsx` - Searchable dropdown
- Create: `src/DocViewer.WebApp/src/components/Header/SearchableSelect.css` - Styles
- Modify: `src/DocViewer.WebApp/src/App.tsx` - Use SearchableSelect for client filter

---

## Tasks

### Task 1: Backend - Add clientName field to Document entity

**Files:**
- Modify: `src/DocViewer.Domain/Entities/Document.cs`

- [ ] **Step 1: Add clientName property**

Add to Document class (after Client property, line 11):
```csharp
[JsonPropertyName("client_name")]
public string? clientName { get; set; }
```

- [ ] **Step 2: Verify build**

Run: `cd src/DocViewer.Domain && dotnet build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/DocViewer.Domain/Entities/Document.cs
git commit -m "feat: add clientName field to Document entity

Add JsonPropertyName mapping for client_name from JSON metadata.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Backend - Update DocumentSyncService to extract client_name

**Files:**
- Modify: `src/DocViewer.Infrastructure/Services/DocumentSyncService.cs`

First, check the current Document creation code to see where to add ClientName:
- [ ] **Step 1: Find where Document is created**

Run: `grep -n "new Document" src/DocViewer.Infrastructure/Services/DocumentSyncService.cs`
Expected: Shows line number (around line 125)

- [ ] **Step 2: Add ClientName to Document creation**

Add after other fields in the Document constructor:
```csharp
ClientName = metadata?.clientName ?? "",
```

- [ ] **Step 3: Verify build**

Run: `cd src/DocViewer.Infrastructure && dotnet build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/DocViewer.Infrastructure/Services/DocumentSyncService.cs
git commit -m "feat: extract client_name from JSON metadata

Populate clientName field from JSON metadata during document indexing.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Backend - Add GetClientNamesAsync to ISearchService

**Files:**
- Modify: `src/DocViewer.Application/Interfaces/IServices.cs`

- [ ] **Step 1: Add method to interface**

Add after `IsHealthyAsync`:
```csharp
Task<List<string>> GetClientNamesAsync();
```

- [ ] **Step 2: Commit**

```bash
git add src/DocViewer.Application/Interfaces/IServices.cs
git commit -m "feat: add GetClientNamesAsync to ISearchService

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Backend - Implement GetClientNamesAsync in OpenSearchService

**Files:**
- Modify: `src/DocViewer.Infrastructure/Services/OpenSearchService.cs`

- [ ] **Step 1: Add GetClientNamesAsync method**

Add after `IsHealthyAsync` method:
```csharp
public async Task<List<string>> GetClientNamesAsync()
{
    var response = await _client.SearchAsync<Document>(s => s
        .Index(IndexName)
        .Size(0)
        .Aggregations(a => a
            .Terms("clients", t => t
                .Field(f => f.clientName)
                .Size(100)
            )
        )
    );

    if (!response.IsValid)
    {
        _logger.LogError("OpenSearch aggregation failed: {Error}", response.DebugInformation);
        return new List<string>();
    }

    return response.Aggregations
        .Terms("clients")
        .Buckets
        .Select(b => b.Key.ToString())
        .Where(c => !string.IsNullOrEmpty(c))
        .OrderBy(c => c)
        .ToList();
}
```

- [ ] **Step 2: Verify build**

Run: `cd src/DocViewer.Infrastructure && dotnet build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/DocViewer.Infrastructure/Services/OpenSearchService.cs
git commit -m "feat: implement GetClientNamesAsync aggregation

Add terms aggregation to fetch unique client names from OpenSearch.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Backend - Add /clients API endpoint

**Files:**
- Modify: `src/DocViewer.Api/Controllers/DocumentsController.cs`

- [ ] **Step 1: Add GetClients endpoint**

Add after existing endpoints:
```csharp
[HttpGet("clients")]
public async Task<ActionResult<List<string>>> GetClients()
{
    try
    {
        var clients = await _searchService.GetClientNamesAsync();
        return Ok(clients);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Failed to get clients");
        return StatusCode(500, "Failed to retrieve clients");
    }
}
```

- [ ] **Step 2: Verify build**

Run: `cd src/DocViewer.Api && dotnet build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/DocViewer.Api/Controllers/DocumentsController.cs
git commit -m "feat: add GET /api/documents/clients endpoint

Returns unique client names from OpenSearch for dropdown.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6: Frontend - Create SearchableSelect component

**Files:**
- Create: `src/DocViewer.WebApp/src/components/Header/SearchableSelect.tsx`
- Create: `src/DocViewer.WebApp/src/components/Header/SearchableSelect.css`

- [ ] **Step 1: Create SearchableSelect component**

```typescript
// src/DocViewer.WebApp/src/components/Header/SearchableSelect.tsx
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
```

- [ ] **Step 2: Create CSS**

```css
/* src/DocViewer.WebApp/src/components/Header/SearchableSelect.css */
.searchable-select {
  position: relative;
}

.searchable-select-trigger {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  cursor: pointer;
  font-size: 0.9rem;
  transition: all var(--transition);
  min-width: 120px;
}

.searchable-select-trigger:hover,
.searchable-select-trigger.open {
  border-color: var(--color-accent);
}

.searchable-select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 100;
  min-width: 200px;
  max-width: 300px;
  margin-top: 4px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.searchable-select-search {
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.875rem;
  box-sizing: border-box;
}

.searchable-select-search:focus {
  outline: none;
}

.searchable-select-search::placeholder {
  color: var(--color-text-secondary);
}

.searchable-select-options {
  max-height: 200px;
  overflow-y: auto;
}

.searchable-select-option {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.searchable-select-option:hover {
  background: var(--color-background);
}

.searchable-select-option.selected {
  background: var(--color-accent);
  color: white;
}

.searchable-select-empty {
  padding: 12px;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  text-align: center;
}

.checkmark {
  font-weight: bold;
}
```

- [ ] **Step 3: Run tests**

Run: `cd src/DocViewer.WebApp && npx vitest run`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add src/DocViewer.WebApp/src/components/Header/SearchableSelect.tsx src/DocViewer.WebApp/src/components/Header/SearchableSelect.css
git commit -m "feat: add SearchableSelect component

Searchable dropdown with search input and filtering.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 7: Frontend - Integrate SearchableSelect in App.tsx

**Files:**
- Modify: `src/DocViewer.WebApp/src/App.tsx`

- [ ] **Step 1: Import SearchableSelect and add state**

Add import:
```typescript
import SearchableSelect from './components/Header/SearchableSelect';
```

Add state for client options (after useState declarations):
```typescript
const [clientOptions, setClientOptions] = useState<{ value: string; label: string }[]>([]);
```

- [ ] **Step 2: Fetch client options on mount**

Add useEffect:
```typescript
useEffect(() => {
  fetch('/api/documents/clients')
    .then(res => res.json())
    .then((clients: string[]) => {
      setClientOptions(clients.map(c => ({ value: c, label: c })));
    })
    .catch(console.error);
}, []);
```

- [ ] **Step 3: Replace client FilterDropdown with SearchableSelect**

Find and replace the Client dropdown:
```typescript
<SearchableSelect
  label="Client"
  options={clientOptions}
  value={clientFilter}
  onChange={setClientFilter}
  placeholder="Search clients..."
/>
```

- [ ] **Step 4: Update frontend types for clientName**

File: `src/DocViewer.WebApp/src/types/index.ts`

Add `clientName` to SearchFilters interface:
```typescript
clientName?: string;
```

- [ ] **Step 5: Update backend search to use clientName**

File: `src/DocViewer.Infrastructure/Services/OpenSearchService.cs`

Update the client filter to use `clientName` field:
```csharp
// Client filter (using clientName from JSON metadata)
if (!string.IsNullOrWhiteSpace(client))
{
    filterQueries.Add(q => q
        .Term(t => t.Field(f => f.clientName).Value(client))
    );
}
```

- [ ] **Step 6: Run tests**

Run: `cd src/DocViewer.WebApp && npx vitest run`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add src/DocViewer.WebApp/src/App.tsx src/DocViewer.WebApp/src/types/index.ts
git commit -m "feat: integrate SearchableSelect for client filter

Fetch client list from API and use searchable dropdown.
Filter by clientName field from JSON metadata.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 8: Re-index documents and test

- [ ] **Step 1: Restart OpenSearch to clear index**

```bash
docker restart docviewer-opensearch
```

- [ ] **Step 2: Start API and trigger sync**

```bash
# Terminal 1
npx nx run docviewer-api:serve

# Terminal 2
curl -X POST http://localhost:5000/api/documents/sync
```

- [ ] **Step 3: Test in browser**

1. Open http://localhost:5173
2. Verify Client dropdown shows real client names (e.g., "XYZ Motors", "Smith Family Trust")
3. Type to search - verify filtering works
4. Select a client - verify results filter correctly
5. Test Clear button
6. Verify works with channel and date filters

- [ ] **Step 4: Push to GitHub**

```bash
git push -u origin feature/date-filter
```

**Note:** This will be merged with the date-filter branch since we're on the same branch.