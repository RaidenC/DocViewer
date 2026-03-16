# DocViewer Product Specification

## 1. Project Overview

**Project Name:** DocViewer - Unified Document Management System

**Purpose:** Centralized document management platform that consolidates 4 legacy document sources (fax, email, scan, FTP) into a single, unified interface.

**Target Users:** Business users who currently manage documents across multiple separate systems and need a unified view to search, filter, and preview documents from all sources.

---

## 2. Data Structure

### 2.1 Source Folders

The system reads directly from existing folder structure:
- `fax/` - Received fax documents
- `email/` - Email attachments and messages
- `scan/` - Scanned documents
- `ftp/` - FTP transfer documents

### 2.2 File Types Supported
- **Text files** (.txt)
- **PDF documents** (.pdf)
- **Images** (.jpg, .jpeg, .png, .gif, .bmp)

### 2.3 Metadata Model

Each document file has a corresponding `.json` metadata file with the following schema:

```json
{
  "receive_time": "ISO 8601 datetime",
  "creation_time": "ISO 8601 datetime",
  "sender": "string",
  "email": "string (optional)",
  "channel": "fax | email | scan | ftp",
  "client_id": "string",
  "client_name": "string"
}
```

### 2.4 Folder Hierarchy

The folder structure follows this pattern:
- `channel/` (fax/email/scan/ftp)
  - `department/` (auto, mortgage, etc.)
    - `year/` (2024, 2025, etc.)
      - `date/` or `client/` folders at varying levels

---

## 3. Feature List

### 3.1 Core Features

| Priority | Feature | Description |
|----------|---------|-------------|
| P0 | Unified File Tree | Left pane tree view showing folder hierarchy across all channels |
| P0 | Document Preview | Right pane preview for selected file (PDF/image/text) |
| P0 | Channel Filter | Filter documents by channel (fax/email/scan/ftp) |
| P0 | Search | Search documents by file name across all channels |
| P1 | Date Range Filter | Filter documents by receive_time range |
| P1 | Client Filter | Filter by client_id or client_name |
| P2 | Multi-select | Select multiple files for batch operations |

### 3.2 Performance Features

| Priority | Feature | Description |
|----------|---------|-------------|
| P0 | Lazy Loading | Initial load of first few levels, load more on demand |
| P0 | Large Dataset Support | Handle massive amounts of files and nested levels |
| P1 | Virtual Scrolling | Virtualized list for performance with large datasets |
| P1 | Background Loading | Pre-fetch child nodes in background |

---

## 4. UI/UX Design

### 4.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Header: Search Bar + Filters                               │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│   Left Pane  │           Right Pane                         │
│   (File      │           (Preview                           │
│    Tree)     │            Area)                             │
│              │                                              │
│   - fax/     │   ┌────────────────────────────────────┐    │
│     - auto/  │   │                                    │    │
│       - 2024 │   │    Document Preview                │    │
│   - email/   │   │    (PDF/Image/Text)                │    │
│   - scan/    │   │                                    │    │
│   - ftp/     │   └────────────────────────────────────┘    │
│              │                                              │
├──────────────┴──────────────────────────────────────────────┤
│  Status Bar: Item count, selected count, loading status     │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Components

#### Header
- **Search Bar**: Text input for filename search, debounced (300ms)
- **Channel Filter**: Multi-select dropdown or checkbox group
- **Date Range Filter**: Start/End date pickers
- **Client Filter**: Dropdown with search or text input

#### Left Pane (File Tree)
- Expandable/collapsible folder nodes
- Channel icons (fax, email, scan, ftp)
- File count badges per folder
- Lazy loading indicators (spinner for loading children)
- Click to expand, double-click to select file

#### Right Pane (Preview)
- PDF viewer with zoom controls
- Image viewer with zoom/pan
- Text viewer with scroll
- Loading state with spinner
- Error state for unsupported formats

#### Status Bar
- Total document count
- Filtered document count
- Selected document count
- Loading indicator

### 4.3 Interaction Patterns

- **Single click folder**: Expand/collapse
- **Single click file**: Select and preview
- **Ctrl+click**: Multi-select files
- **Double-click file**: Open in new tab/download
- **Right-click**: Context menu (preview, download, copy path)

---

## 5. Data Model

### 5.1 API Response Models

```typescript
interface DocumentMetadata {
  receiveTime: string;      // ISO 8601
  creationTime: string;     // ISO 8601
  sender: string;
  email?: string;
  channel: Channel;
  clientId: string;
  clientName: string;
}

type Channel = 'fax' | 'email' | 'scan' | 'ftp';

interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'folder' | 'file';
  channel?: Channel;
  metadata?: DocumentMetadata;
  children?: FileNode[];
  isLoading?: boolean;
  isExpanded?: boolean;
}

interface TreeResponse {
  nodes: FileNode[];
  totalCount: number;
  hasMore: boolean;
  nextOffset?: number;
}

interface SearchResponse {
  results: FileNode[];
  totalCount: number;
}
```

### 5.2 Query Parameters

```
GET /api/documents/tree?path={path}&depth={depth}&limit={limit}
GET /api/documents/search?q={query}&channels={ch1,ch2}&clientId={id}&startDate={date}&endDate={date}
GET /api/documents/{id}/preview
```

---

## 6. API Contract

### 6.1 Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/documents/tree` | Get folder tree structure |
| GET | `/api/documents/search` | Search documents with filters |
| GET | `/api/documents/{id}/preview` | Get document for preview |
| GET | `/api/documents/{id}/metadata` | Get document metadata |

### 6.2 Tree Endpoint

```
GET /api/documents/tree?path=&depth=2&limit=50

Query Parameters:
- path: Folder path (empty = root)
- depth: How many levels to load (default: 2)
- limit: Max children per folder (default: 50)

Response:
{
  "nodes": [
    {
      "id": "fax",
      "name": "fax",
      "path": "/fax",
      "type": "folder",
      "channel": "fax",
      "hasChildren": true,
      "children": []
    }
  ],
  "totalCount": 4,
  "hasMore": false
}
```

### 6.3 Search Endpoint

```
GET /api/documents/search?q=invoice&channels=fax,email&clientId=123&startDate=2024-01-01&endDate=2024-12-31&limit=20&offset=0

Query Parameters:
- q: Search query (filename)
- channels: Comma-separated channels
- clientId: Filter by client ID
- clientName: Filter by client name (partial match)
- startDate: Filter by receive_time >= date
- endDate: Filter by receive_time <= date
- limit: Results per page (default: 20)
- offset: Pagination offset

Response:
{
  "results": [...],
  "totalCount": 150,
  "hasMore": true
}
```

### 6.4 Preview Endpoint

```
GET /api/documents/{id}/preview

Response:
- Content-Type: application/pdf, image/*, text/plain
- Content-Disposition: inline
```

---

## 7. Architecture

### 7.1 Backend (.NET 10)

```
DocViewer.Api/
├── Controllers/
│   └── DocumentsController.cs
├── Services/
│   ├── IFileSystemService.cs
│   └── FileSystemService.cs
├── Models/
│   ├── FileNodeDto.cs
│   └── DocumentMetadataDto.cs
└── Program.cs
```

**Responsibilities:**
- Read file system structure
- Parse JSON metadata files
- Serve file previews
- Handle search and filtering

### 7.2 Frontend (React 19)

```
DocViewer.WebApp/
├── components/
│   ├── FileTree/
│   │   ├── FileTree.tsx
│   │   ├── TreeNode.tsx
│   │   └── useTreeExpansion.ts
│   ├── Preview/
│   │   ├── PreviewPane.tsx
│   │   ├── PdfViewer.tsx
│   │   ├── ImageViewer.tsx
│   │   └── TextViewer.tsx
│   ├── Search/
│   │   ├── SearchBar.tsx
│   │   └── FilterPanel.tsx
│   └── common/
├── hooks/
│   ├── useDocumentTree.ts
│   ├── useSearch.ts
│   └── usePreview.ts
└── api/
    └── documents.ts
```

### 7.3 State Management

- **React Context**: For global app state (selected files, filters)
- **React Query**: For server state (tree data, search results)
- **Local component state**: For UI interactions (expanded nodes)

---

## 8. Non-Functional Requirements

### 8.1 Performance

- Initial tree load: < 2 seconds for first 2 levels
- Lazy load expand: < 500ms per folder
- Search response: < 1 second for results
- Preview load: < 1 second for files under 10MB

### 8.2 Scalability

- Support 1M+ documents
- Handle 100k+ files per folder
- Virtual scrolling for lists > 1000 items

### 8.3 Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Edge (latest 2 versions)
- Safari (latest 2 versions)

---

## 9. Future Considerations

- User authentication and authorization
- Document tagging and custom metadata
- Batch download as ZIP
- Audit logging
- Integration with external systems
- Mobile responsive design