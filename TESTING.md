# DocViewer - Testing Guide

## Running Tests

### All Tests
```bash
npx nx run-many -t test
```

### Backend Tests (.NET/xUnit)
```bash
dotnet test
dotnet test tests/DocViewer.Application.Tests
```

### Frontend Tests (React/Vitest)
```bash
cd src/DocViewer.WebApp
npm test           # Run tests
npm test -- --watch  # Watch mode
npm run test:coverage  # With coverage
```

## Running the App

### Prerequisites
Start OpenSearch (required for full functionality):
```bash
docker compose up -d
```

### Development Servers

**Terminal 1 - API:**
```bash
cd src/DocViewer.Api
dotnet run --urls "http://localhost:5000"
```

**Terminal 2 - Frontend:**
```bash
cd src/DocViewer.WebApp
npm run dev
```

Then open: http://localhost:5173

## Test Coverage

| Layer | Framework | Tests | Location |
|-------|-----------|-------|----------|
| Backend | xUnit + Moq | 5 | `tests/DocViewer.Application.Tests/` |
| Frontend | Vitest + RTL | 5 | `src/DocViewer.WebApp/src/hooks/` |

### Backend Tests
- Search with no filters
- Search with query filter
- Search with channel filter
- Search with client filter
- Search with date range filter
- Search with pagination

### Frontend Tests
- Returns search results when query executed
- Transforms API response to TreeNode format
- Handles empty search results
- Sets hasMore to false
- Passes search filters to API