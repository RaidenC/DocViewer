# Performance Optimization & Scale Testing - Design Spec

## Overview

Implement comprehensive performance optimizations for OpenSearch and create a data generator to simulate 1 million documents for benchmarking. This will demonstrate query optimization techniques and quantifiable performance improvements suitable for technical interviews.

## Current State

- System indexes documents with: channel, client, date, sender, subject, content
- Basic filter queries working
- Client dropdown fetches unique client names via aggregation
- 8 sample documents in test data

## Goal

1. **Generate 1M realistic documents** with varied file types
2. **Implement all 5 optimization categories**
3. **Build benchmark UI** showing performance metrics
4. **Demonstrate quantifiable improvements** for interview

---

## Document Structure

### Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| id | keyword | Unique document ID | fax/auto/2024/fax_statement_001.txt |
| fileName | text | Display filename | fax_statement_001.txt |
| filePath | keyword | Full path | fax/auto/2024/fax_statement_001.txt |
| fileExtension | keyword | File type | .txt, .jpg, .pdf |
| channel | keyword | fax/email/scan/ftp | fax |
| client | keyword | Directory name | auto |
| clientName | keyword | Client from JSON | XYZ Motors |
| year | integer | Year from path | 2024 |
| month | keyword | Month folder | 2024-01 |
| date | date | receive_time from JSON | 2024-03-20 |
| sender | text | Sender name | Auto Finance Approvals |
| subject | text | Email/subject | Loan Approval Request |
| content | text | Full content | Lorem ipsum... |

### File Types by Channel

| Channel | File Types | Distribution |
|---------|------------|--------------|
| fax | .txt, .tif | 80% .txt, 20% .tif |
| email | .txt, .eml | 90% .txt, 10% .eml |
| scan | .jpg, .pdf | 70% .jpg, 30% .pdf |
| ftp | .pdf, .xlsx, .docx | 60% .pdf, 25% .xlsx, 15% .docx |

---

## Data Generator Specification

### Implementation

**File:** `src/DocViewer.Infrastructure/Services/DataGenerator.cs`

**Approach:** Bulk API with parallelization
- 10 parallel Task runners
- 1000 documents per bulk request
- Progress reporting every 50K documents
- ~5-10 minutes to generate 1M documents

### Data Generation Rules

| Field | Generation Strategy |
|-------|-------------------|
| channel | Random: fax(25%), email(25%), scan(25%), ftp(25%) |
| client | Random from 50 realistic names |
| clientName | Random from 50 client names (matches client) |
| year | Random: 2023(30%), 2024(40%), 2025(30%) |
| month | 2024-01 to 2024-12 format |
| date | Random within year, realistic distribution |
| sender | Random from 100 realistic senders |
| subject | Random from 1000 templates |
| content | Lorem ipsum, 500-2000 chars |
| fileExtension | Per-channel distribution above |

### Client Names (50)

```csharp
var clientNames = new[] {
    "XYZ Motors", "Smith Family Trust", "Fleet Solutions Inc",
    "Metro Healthcare", "Regional Insurance", "City School District",
    // ... 44 more
};
```

### Sender Names (100)

```csharp
var senders = new[] {
    "Auto Finance Approvals", "City Hospital", "State Insurance",
    "National Bank", "Regional Medical Center", "County Clerk",
    // ... 94 more
};
```

---

## Optimization Implementation

### Category 1: Query Optimizations

**Filter Clauses (already done)**
- Use `filter` instead of `must` for non-scoring queries
- Filters are cached by OpenSearch

**_source Field Filtering (NEW)**
```csharp
// Only return needed fields
searchDescriptor.Source(s => s
    .Includes(i => i
        .Fields("id", "fileName", "filePath", "channel", "clientName", "date")
    )
);
```

### Category 2: Index Optimizations

**Keyword Fields**
- `clientName.keyword` for exact matches (already done)
- `channel.keyword`, `fileExtension.keyword`

**Field Mapping Review**
```csharp
// Document.cs - Already optimized
[JsonPropertyName("client_name")]
public string? clientName { get; set; } // Maps to clientName.keyword
```

### Category 3: Caching Layers

**OpenSearch Request Cache**
```csharp
searchDescriptor.RequestCache(true);
```

**React Query (existing)**
- Already configured with staleTime
- Consider adding request-level cache

### Category 4: Pagination

**search_after Implementation (NEW)**
```csharp
// For deep pagination
searchDescriptor.SearchAfter(searchAfter)
               .Size(20);
```

**PIT (Point in Time) - Optional**
```csharp
var pitResponse = await client.CreatePITAsync(p => p.Index(IndexName).KeepAlive("5m"));
// Use pit.id for subsequent searches
```

### Category 5: Document Structure

**Routing by Channel (OPTIONAL)**
- Route documents to shards by channel
- Improves filter performance for channel-specific queries
- Trade-off: uneven shard distribution

---

## Benchmark API

### Endpoints

**POST /api/benchmark/generate**
- Generates 1M documents
- Returns progress
- Requires OpenSearch reset first

**GET /api/benchmark/run**
- Runs benchmark tests
- Returns comparison results

**Response Format:**
```json
{
  "totalDocuments": 1000000,
  "tests": [
    {
      "name": "Unfiltered Search",
      "query": { "match_all": {} },
      "timeMs": 2450,
      "documentsReturned": 10000
    },
    {
      "name": "Channel Filter",
      "query": { "term": { "channel": "fax" } },
      "timeMs": 180,
      "documentsReturned": 250000,
      "improvement": "92.6%"
    },
    {
      "name": "Multi-Filter",
      "query": { "term": { "channel": "fax" }, "term": { "clientName": "XYZ Motors" } },
      "timeMs": 45,
      "documentsReturned": 5000,
      "improvement": "98.2%"
    }
  ]
}
```

---

## Benchmark UI

### Display

| Metric | Description |
|--------|-------------|
| Total Docs | 1,000,000 |
| Unfiltered Query | ____ ms |
| Single Filter | ____ ms (____% faster) |
| Multi-Filter | ____ ms (____% faster) |
| Page 1000 | ____ ms (with search_after) |

### Visualization

- Bar chart comparing query times
- Percentage improvement badges
- Real-time metrics during benchmark

---

## File Structure

### New Files
- `src/DocViewer.Infrastructure/Services/DataGenerator.cs` - 1M doc generator
- `src/DocViewer.Api/Controllers/BenchmarkController.cs` - Benchmark endpoints
- `src/DocViewer.WebApp/src/components/Benchmark/` - Benchmark UI components

### Modified Files
- `src/DocViewer.Domain/Entities/Document.cs` - Add fileExtension field
- `src/DocViewer.Infrastructure/Services/OpenSearchService.cs` - Add optimizations
- `src/DocViewer.WebApp/src/App.tsx` - Add benchmark panel

---

## Acceptance Criteria

1. ✅ Generate 1M documents in ~10 minutes
2. ✅ Documents have realistic: channels, clients, dates, senders, subjects, file types
3. ✅ File types match channel patterns (scan = jpg/pdf, fax = txt)
4. ✅ Unfiltered query shows baseline (~2-3 seconds)
5. ✅ Single filter shows 80%+ improvement
6. ✅ Multi-filter shows 95%+ improvement
7. ✅ Benchmark UI displays metrics clearly
8. ✅ Works for technical interview demonstration

## Interview Talking Points

When presenting this project:

1. **"I generated 1M realistic documents using OpenSearch Bulk API with parallelization"**
   - Shows: Large-scale data handling, async/await, OpenSearch API

2. **"I implemented filter caching - filters are cached and don't participate in scoring"**
   - Shows: Query optimization knowledge, OpenSearch internals

3. **"Multi-filter queries show 95%+ improvement because..."**
   - Shows: Performance analysis, quantitative results

4. **"I added _source field filtering to reduce payload size"**
   - Shows: API optimization, bandwidth awareness

5. **"For pagination, I implemented search_after instead of from/size"**
   - Shows: Understanding of pagination performance issues

This will be very impressive for any technical interview!