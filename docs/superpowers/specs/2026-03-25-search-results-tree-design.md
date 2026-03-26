# Search Results File Explorer - VS Code Style

## Overview
Display search results in a horizontal, compact tree structure similar to VS Code's search results, showing the full file path with collapsible folder segments.

## Current State
- Search results display as a flat list showing only filename
- User cannot see where files are located in the folder hierarchy
- Deep paths create excessive vertical scrolling

## Target State
- Search results show complete path to each file: `fax > auto > 2024 > fax_statement_001.txt`
- Each folder segment is collapsible/expandable (VS Code style)
- Horizontal layout minimizes vertical space
- Path text in gray, filename in bold

## Data Flow

### Backend (No Changes)
- `SearchDocumentsAsync` returns flat list with `FilePath` field
- Already returns path via Document entity

### Frontend Changes

#### 1. Transform Flat Results to Tree
Create utility function to convert:
```
Input: [
  { id: "fax/auto/2024/fax_statement_001.txt", fileName: "fax_statement_001.txt", path: "fax/auto/2024/" },
  ...
]
Output: Tree structure with nested folders + files
```

#### 2. New Component: SearchResultTree
- Renders tree in horizontal compact style
- Each folder node shows name + chevron `>`
- Clicking folder name toggles collapse/expand
- File nodes are clickable for preview

#### 3. Update App.tsx
- Replace flat list rendering (lines 102-115) with SearchResultTree component

## UI/UX Specification

### Visual Design
- **Font**: Monospace for path, regular for filename
- **Path color**: `#888` (gray)
- **Filename color**: `#ddd` (light gray, white when selected)
- **Folder icons**: 📁 (collapsed), 📂 (expanded) - optional, can use just text
- **Separator**: `>` with padding `8px`
- **Hover**: Background highlight `#2d2d2d`
- **Selected**: Background `#094771`, filename `white`

### Interaction
- Click folder name → toggle expand/collapse of that segment's children
- Click file → select for preview (existing behavior)
- Hover → show full path in tooltip (for truncation cases)

### Edge Cases
- Single file at root: Show just filename
- Many results: Scrollable container
- Deep paths: All expanded by default, user can collapse

## Acceptance Criteria
1. Search for "001" shows two files with full paths displayed horizontally
2. Each folder segment in path is clickable to collapse/expand
3. Clicking file selects it for preview (existing behavior works)
4. Path text is gray, filename is distinguishable
5. No excessive vertical space used for deep paths