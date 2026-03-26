# Client Filter - Design Spec

## Overview

Replace the hardcoded client dropdown (currently showing directory names "auto", "mortgage") with a searchable dropdown that fetches real client names from JSON metadata in OpenSearch.

## Current State

- **Frontend**: Client dropdown shows hardcoded `[{value: 'auto'}, {value: 'mortgage'}]` (directory names)
- **Backend**: Filters by `Client` field which is the directory path (fax/email/scan/ftp), not client_name
- **JSON has**: `client_name` field (e.g., "XYZ Motors", "Smith Family Trust")

## Goal

1. Filter documents by `client_name` from JSON metadata
2. Dropdown shows all unique client names from the database
3. Dropdown is searchable (type to filter)

## Changes Needed

### 1. Backend - Add client_name to Document entity
File: `src/DocViewer.Domain/Entities/Document.cs`

Add `clientName` field with JSON mapping:
```csharp
[JsonPropertyName("client_name")]
public string? clientName { get; set; }
```

### 2. Backend - Update indexing to extract client_name
File: `src/DocViewer.Infrastructure/Services/DocumentSyncService.cs`

When creating Document, extract client_name from JSON metadata:
```csharp
Document document = new Document
{
    // ... existing fields
    ClientName = metadata?.clientName ?? "",
};
```

### 3. Backend - Add aggregation endpoint
File: `src/DocViewer.Infrastructure/Services/OpenSearchService.cs`

Add method to get unique client names using terms aggregation:
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

    return response.Aggregations
        .Terms("clients")
        .Buckets
        .Select(b => b.Key.ToString())
        .Where(c => !string.IsNullOrEmpty(c))
        .OrderBy(c => c)
        .ToList();
}
```

### 4. Backend - Add API endpoint
File: `src/DocViewer.Api/Controllers/DocumentsController.cs`

```csharp
[HttpGet("clients")]
public async Task<ActionResult<List<string>>> GetClients()
{
    var clients = await _searchService.GetClientNamesAsync();
    return Ok(clients);
}
```

### 5. Frontend - Create SearchableSelect component
File: `src/DocViewer.WebApp/src/components/Header/SearchableSelect.tsx`

- Props: `label`, `options`, `value`, `onChange`, `placeholder`
- Show dropdown with search input
- Filter options as user types
- Click outside to close

### 6. Frontend - Integrate in App.tsx
File: `src/DocViewer.WebApp/src/App.tsx`

- Add state for client options list
- Fetch clients on mount using useEffect
- Replace FilterDropdown with SearchableSelect for client
- Update useSearch to use client_name field
- Re-index documents to populate client_name

## UI Specification

### Layout
- Client dropdown after Channel dropdown
- Search input at top of dropdown
- Scrollable list of client names below search

### Styling
- Match existing filter dropdown styling
- Search input with placeholder "Search clients..."
- Highlight matching text in results (optional)

## Acceptance Criteria

1. ✅ Client dropdown shows all unique client_name values from OpenSearch
2. ✅ Users can search/filter as they type in the dropdown
3. ✅ Selecting a client filters results correctly
4. ✅ Clear button removes client filter
5. ✅ ActiveFilters shows selected client
6. ✅ Works alongside channel and date filters