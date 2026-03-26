# Date Range Filter - Design Spec

## Overview
Add a date range filter to filter documents by `receive_time` from JSON metadata. The backend already supports date filtering - we just need to add the frontend UI and fix the JSON field mapping.

## Current State
- **Backend**: Has `fromDate`, `toDate` parameters in search API
- **Document Entity**: Has `Date` field
- **DocumentMetadata**: Uses `date` but JSON has `receive_time`
- **API Layer**: Already passes date params to OpenSearch

## Changes Needed

### 1. Backend - Map receive_time to date field
File: `src/DocViewer.Domain/Entities/Document.cs`

Add JSON property mapping to use `receive_time`:
```csharp
public class DocumentMetadata
{
    [JsonPropertyName("receive_time")]
    public DateTime? date { get; set; }
    public string? sender { get; set; }
    public string? subject { get; set; }
    public string? content { get; set; }
}
```

### 2. Frontend - Add DateFilter Component
File: `src/DocViewer.WebApp/src/components/Header/DateFilter.tsx`

- Two date inputs: "From" and "To"
- Simple HTML5 date inputs
- Props: `fromDate`, `toDate`, `onChange`

### 3. Frontend - Integrate with App.tsx
File: `src/DocViewer.WebApp/src/App.tsx`

- Add state: `fromDate`, `toDate`
- Add DateFilter to header controls
- Pass to useSearch hook
- Show in ActiveFilters

### 4. Frontend - Update types (ALREADY COMPLETE)
File: `src/DocViewer.WebApp/src/types/index.ts`

Types already exist:
- `fromDate?: string`
- `toDate?: string`

## UI Specification

### Layout
- Date inputs placed after Channel and Client filters
- "From" label + date input
- "To" label + date input
- Compact spacing between inputs

### Styling
- Match existing filter dropdown styling
- Date inputs with consistent sizing
- Clear button to reset date range

## Acceptance Criteria
1. User can select From and To dates
2. Results filter to documents within date range
3. ActiveFilters shows date range when set
4. Clearing date filter shows all results
5. Works alongside existing channel/client filters
6. Uses receive_time from JSON metadata