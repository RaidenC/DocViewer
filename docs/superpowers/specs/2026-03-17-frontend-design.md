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
- SearchBar: Text input with 300ms debounce
- FilterDropdown: Channel, date range, client filters
- ActiveFilters: Removable pill tags

#### FileTree (Left Pane)
- TreeNode: Expandable folder items with icons
- Channel icons: fax, email, scan, ftp
- File count badges
- Loading spinner on expand
- Smooth expand/collapse animation

#### Preview (Right Pane)
- PdfViewer: Embedded PDF display
- ImageViewer: Zoomable image display
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

**Tree Navigation:**
- Eager load first 2 levels on initial render
- Lazy load subsequent levels on expand
- Cache loaded children in React Query
- Expand/collapse with smooth animation

**Search & Filter:**
- Debounced search input (300ms)
- Filter by channel (fax/email/scan/ftp)
- Filter by date range
- Filter by client
- Active filter pills with remove button

**Document Preview:**
- Auto-load preview on file selection
- Support PDF, images (jpg, png, gif), text files
- Loading state while fetching
- Error handling for unsupported types

### 3.2 Data Flow

```
API Layer (documents.ts)
    ↓
React Query Hooks (useDocumentTree, useSearch, usePreview)
    ↓
Components (FileTree, Preview, Header)
    ↓
App State (selected file, active filters)
```

### 3.3 API Integration

**Endpoints:**
- `GET /api/documents/tree?path=&depth=2` - Tree structure
- `GET /api/documents/search?q=&channels=&client=&fromDate=&toDate=` - Search
- `GET /api/documents/{id}/preview` - File content
- `GET /api/documents/{id}/metadata` - File metadata

---

## 4. Performance (Vercel Best Practices)

- `async-parallel`: Use Promise.all for parallel tree node loading
- `async-suspense-boundaries`: Wrap components in Suspense
- `bundle-dynamic-imports`: Lazy load PDF/Image viewers
- `rerender-transitions`: Use useTransition for search filtering
- `rerender-memo`: Memoize tree nodes
- `client-swr-dedup`: React Query handles deduplication

---

## 5. File Structure

```
src/DocViewer.WebApp/src/
├── components/
│   ├── Header/
│   │   ├── SearchBar.tsx
│   │   ├── FilterDropdown.tsx
│   │   └── ActiveFilters.tsx
│   ├── FileTree/
│   │   ├── FileTree.tsx
│   │   └── TreeNode.tsx
│   ├── Preview/
│   │   ├── PreviewPane.tsx
│   │   ├── PdfViewer.tsx
│   │   ├── ImageViewer.tsx
│   │   └── TextViewer.tsx
│   └── StatusBar.tsx
├── hooks/
│   ├── useDocumentTree.ts
│   ├── useSearch.ts
│   └── usePreview.ts
├── api/
│   └── documents.ts
├── types/
│   └── index.ts
├── App.tsx
├── App.css
└── main.tsx
```

---

## 6. Acceptance Criteria

- [ ] Header displays search bar with dropdown filters
- [ ] Active filters show as removable pills
- [ ] File tree loads first 2 levels on mount
- [ ] Clicking folder expands and loads children
- [ ] Clicking file shows preview in right pane
- [ ] Preview handles PDF, images, and text
- [ ] Status bar shows document counts
- [ ] Responsive layout works at 1024px+ width
- [ ] Loading states shown during data fetch
- [ ] Error states handled gracefully