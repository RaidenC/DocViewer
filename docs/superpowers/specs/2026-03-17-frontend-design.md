# DocViewer Frontend Implementation Spec

**Date:** 2026-03-17
**Feature:** React Frontend UI Implementation
**Branch:** feature/implement-frontend

---

## 1. Overview

Implement the DocViewer frontend UI according to the product specification in `docs/product.md`. The frontend provides a unified document management interface with file tree navigation, document preview, and search/filter capabilities.

---

## 2. UI/UX Specification

### 2.1 Layout Structure

**Fixed Split Pane Layout:**
- Left sidebar: 280px fixed width, file tree
- Right area: Document preview
- Resizable divider between panels

**Header:**
- Height: 64px
- Integrated search bar with dropdown filters
- Removable filter pills for active filters

**Status Bar:**
- Height: 32px
- Document count, selected count, loading status

### 2.2 Visual Design

**Color Palette:**
- Primary: `#1a1a2e` (deep navy)
- Secondary: `#16213e` (dark blue)
- Accent: `#0f3460` (medium blue)
- Highlight: `#e94560` (coral red for actions)
- Background: `#fafafa` (off-white)
- Surface: `#ffffff` (white cards)
- Text Primary: `#1a1a2e`
- Text Secondary: `#6b7280`
- Border: `#e5e7eb`

**Typography:**
- Display Font: "DM Sans" (headings, sidebar)
- Body Font: "IBM Plex Sans" (content, UI)
- Monospace: "JetBrains Mono" (file paths, code)

**Spacing System:**
- Base unit: 4px
- xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px

**Visual Effects:**
- Subtle box shadows: `0 1px 3px rgba(0,0,0,0.1)`
- Border radius: 6px (cards), 4px (inputs)
- Smooth transitions: 150ms ease-out
- Hover states with slight background shift

### 2.3 Components

#### Header
- SearchBar: Text input with 300ms debounce, useTransition for non-blocking updates
- FilterDropdown: Channel (singular), date range, client filters
- ActiveFilters: Removable pill tags

#### FileTree (Left Pane)
- TreeNode: Expandable folder items with icons
- Channel icons: fax, email, scan, ftp
- File count badges
- Loading spinner on expand
- Smooth expand/collapse animation
- Virtual scrolling for large lists (>100 items)

#### Preview (Right Pane)
- PdfViewer: Lazy-loaded embedded PDF display
- ImageViewer: Lazy-loaded zoomable image display
- TextViewer: Syntax-highlighted text
- Loading state with skeleton
- Error state for unsupported formats

#### StatusBar
- Total document count
- Filtered/selected counts
- Loading indicator

---

## 3. Functionality Specification

### 3.1 Core Features

**Tree Navigation (Vercel Best Practices):**
- Eager load first level on initial render
- Lazy load subsequent levels on expand (useTransition)
- Cache loaded children in React Query (staleTime: 5min)
- Parallel loading: Use `Promise.all` when loading multiple sibling folders
- Background pre-fetch: Prefetch adjacent folder data on hover

**Search & Filter:**
- Debounced search input (300ms) with useTransition
- Filter by channel (fax/email/scan/ftp) - note: backend uses `channel` singular
- Filter by date range (fromDate, toDate)
- Filter by client
- Active filter pills with remove button
- Pagination support (page, pageSize params)

**Document Preview:**
- Auto-load preview on file selection (lazy load component)
- Support PDF, images (jpg, png, gif), text files
- Loading state while fetching
- Error handling for unsupported types

**Multi-Select (P2):**
- Ctrl+click for multi-select
- Shift+click for range select
- Selected files highlighted with checkbox
- Batch operations placeholder (future)

### 3.2 Data Flow (Performance Optimized)

```
User Action
    ↓
useTransition (non-blocking UI)
    ↓
React Query (cached, deduplicated)
    ↓
API Layer (parallel requests where possible)
    ↓
Components (memoized)
```

### 3.3 API Integration (Corrected Endpoints)

**Endpoints (matching backend exactly):**
- `GET /api/documents/tree?path=` - Tree structure
- `GET /api/documents/search?q=&channel=&client=&fromDate=&toDate=&page=1&pageSize=20` - Search with filters
- `GET /api/documents/{id}/preview` - File content (id = URL-encoded path)
- `GET /api/documents/{id}/metadata` - File metadata

**Note:** Backend uses `channel` (singular), not `channels` (plural)

---

## 4. Performance (Vercel Best Practices)

| Best Practice | Implementation |
|---------------|----------------|
| `async-parallel` | Use `Promise.all` when loading multiple sibling folders |
| `async-suspense-boundaries` | Wrap FileTree and Preview in Suspense |
| `bundle-dynamic-imports` | Lazy load PDF/Image viewers with `React.lazy` |
| `rerender-transitions` | Use `useTransition` for search/filter operations |
| `rerender-memo` | Memoize TreeNode components with `React.memo` |
| `client-swr-dedup` | React Query handles deduplication automatically |
| `rendering-content-visibility` | Use content-visibility for large tree lists |

---

## 5. File Structure

```
src/DocViewer.WebApp/src/
├── components/
│   ├── Header/
│   │   ├── SearchBar.tsx        # debounced, useTransition
│   │   ├── FilterDropdown.tsx   # lazy loaded options
│   │   └── ActiveFilters.tsx   # removable pills
│   ├── FileTree/
│   │   ├── FileTree.tsx        # Suspense, memo, virtual scroll
│   │   └── TreeNode.tsx       # lazy load children, pre-fetch
│   ├── Preview/
│   │   ├── PreviewPane.tsx    # Suspense wrapper
│   │   ├── PdfViewer.tsx       # lazy import
│   │   ├── ImageViewer.tsx     # lazy import
│   │   └── TextViewer.tsx      # lazy import
│   └── StatusBar.tsx
├── hooks/
│   ├── useDocumentTree.ts      # parallel loading, cache
│   ├── useSearch.ts            # useTransition, pagination
│   └── usePreview.ts          # lazy fetch
├── api/
│   └── documents.ts            # fetch functions matching backend
├── types/
│   └── index.ts                # TypeScript interfaces
├── App.tsx
├── App.css
└── main.tsx
```

---

## 6. TypeScript Interfaces

```typescript
interface TreeNode {
  id: string;
  name: string;
  path: string;
  type: 'folder' | 'file';
  channel?: 'fax' | 'email' | 'scan' | 'ftp';
  hasChildren?: boolean;
  children?: TreeNode[];
  isLoading?: boolean;
}

interface SearchResult {
  results: TreeNode[];
  totalCount: number;
  hasMore: boolean;
}

interface DocumentMetadata {
  receiveTime: string;
  creationTime: string;
  sender: string;
  email?: string;
  channel: string;
  clientId: string;
  clientName: string;
}
```

---

## 7. Acceptance Criteria

- [ ] Header displays search bar with dropdown filters
- [ ] Active filters show as removable pills
- [ ] File tree loads first level on mount
- [ ] Clicking folder expands and loads children
- [ ] Clicking file shows preview in right pane
- [ ] Preview handles PDF, images, and text
- [ ] Status bar shows document counts
- [ ] Responsive layout works at 1024px+ width
- [ ] Loading states shown during data fetch
- [ ] Error states handled gracefully
- [ ] Ctrl+click multi-select works
- [ ] Virtual scrolling for large lists
- [ ] useTransition for non-blocking search
- [ ] API calls match backend (channel singular, pagination params)