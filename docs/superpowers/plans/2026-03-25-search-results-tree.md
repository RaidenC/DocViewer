# Search Results Tree - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display search results in a VS Code style horizontal tree with collapsible folder segments, showing full file path

**Architecture:** Transform flat search results to nested tree structure on frontend, render using new horizontal compact tree component

**Tech Stack:** React 19, TypeScript, existing TreeNode type

---

## File Structure

### New Files
- `src/DocViewer.WebApp/src/utils/transformSearchResultsToTree.ts` - Convert flat results to nested tree
- `src/DocViewer.WebApp/src/components/SearchResultTree/SearchResultTree.tsx` - New horizontal tree component
- `src/DocViewer.WebApp/src/components/SearchResultTree/SearchResultNode.tsx` - Individual node in horizontal tree

### Modified Files
- `src/DocViewer.WebApp/src/App.tsx:98-116` - Replace flat list with SearchResultTree component

---

## Tasks

### Task 1: Create transform utility

**Files:**
- Create: `src/DocViewer.WebApp/src/utils/transformSearchResultsToTree.ts`
- Test: `src/DocViewer.WebApp/src/utils/transformSearchResultsToTree.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/DocViewer.WebApp/src/utils/transformSearchResultsToTree.test.ts
import { transformSearchResultsToTree } from './transformSearchResultsToTree';
import type { TreeNode } from '../types';

describe('transformSearchResultsToTree', () => {
  it('should transform flat results to nested tree structure', () => {
    const flatResults: TreeNode[] = [
      { id: 'fax/auto/2024/fax_statement_001.txt', name: 'fax_statement_001.txt', path: 'fax/auto/2024/', type: 'file', channel: 'fax' },
      { id: 'ftp/auto/2024/ftp_batch_001.txt', name: 'ftp_batch_001.txt', path: 'ftp/auto/2024/', type: 'file', channel: 'ftp' },
    ];

    const result = transformSearchResultsToTree(flatResults);

    // Should create folder hierarchy: fax > auto > 2024 > file
    expect(result[0].name).toBe('fax');
    expect(result[0].type).toBe('folder');
    expect(result[0].children?.[0].name).toBe('auto');
    expect(result[0].children?.[0].children?.[0].name).toBe('2024');
    expect(result[0].children?.[0].children?.[0].children?.[0].name).toBe('fax_statement_001.txt');
  });

  it('should group files under same parent folder', () => {
    const flatResults: TreeNode[] = [
      { id: 'fax/auto/2024/file1.txt', name: 'file1.txt', path: 'fax/auto/2024/', type: 'file', channel: 'fax' },
      { id: 'fax/auto/2024/file2.txt', name: 'file2.txt', path: 'fax/auto/2024/', type: 'file', channel: 'fax' },
    ];

    const result = transformSearchResultsToTree(flatResults);

    // Both files should be under the same 2024 folder
    const yearFolder = result[0].children?.[0].children?.[0];
    expect(yearFolder?.children?.length).toBe(2);
  });

  it('should handle single file at root (empty path)', () => {
    const flatResults: TreeNode[] = [
      { id: 'rootfile.txt', name: 'rootfile.txt', path: '', type: 'file', channel: 'fax' },
    ];

    const result = transformSearchResultsToTree(flatResults);

    // Single file should be returned as-is (no folder wrapping)
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('rootfile.txt');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd src/DocViewer.WebApp && npx vitest run transformSearchResultsToTree.test.ts`
Expected: FAIL with "transformSearchResultsToTree not defined"

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/DocViewer.WebApp/src/utils/transformSearchResultsToTree.ts
import type { TreeNode } from '../types';

export function transformSearchResultsToTree(results: TreeNode[]): TreeNode[] {
  // Handle empty path (single file at root)
  const rootLevelFiles = results.filter(r => !r.path || r.path === '');
  if (rootLevelFiles.length > 0 && rootLevelFiles.length === results.length) {
    return rootLevelFiles;
  }

  const root: TreeNode[] = [];

  for (const result of results) {
    // Skip files at root level (already handled above)
    if (!result.path || result.path === '') continue;

    // Get path segments, e.g., "fax/auto/2024/" -> ["fax", "auto", "2024"]
    const pathParts = result.path
      .split('/')
      .filter(part => part.length > 0);

    // Build tree recursively
    let currentLevel = root;

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];

      // Find existing folder at this level
      let folder = currentLevel.find(
        node => node.name === part && node.type === 'folder'
      );

      if (!folder) {
        folder = {
          id: pathParts.slice(0, i + 1).join('/'),
          name: part,
          path: pathParts.slice(0, i + 1).join('/') + '/',
          type: 'folder',
          hasChildren: true,
          children: [],
        };
        currentLevel.push(folder);
      }

      currentLevel = folder.children || [];
    }

    // Add the file to the final folder's children
    currentLevel.push(result);
  }

  return root;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd src/DocViewer.WebApp && npx vitest run transformSearchResultsToTree.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/DocViewer.WebApp/src/utils/transformSearchResultsToTree.ts src/DocViewer.WebApp/src/utils/transformSearchResultsToTree.test.ts
git commit -m "feat: add transformSearchResultsToTree utility

Convert flat search results to nested folder tree structure.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Create SearchResultTree component

**Files:**
- Create: `src/DocViewer.WebApp/src/components/SearchResultTree/SearchResultTree.tsx`
- Create: `src/DocViewer.WebApp/src/components/SearchResultTree/SearchResultNode.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/DocViewer.WebApp/src/components/SearchResultTree/SearchResultTree.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SearchResultTree } from './SearchResultTree';
import type { TreeNode } from '../../types';

describe('SearchResultTree', () => {
  const mockTree: TreeNode[] = [
    {
      id: 'fax',
      name: 'fax',
      path: '',
      type: 'folder',
      children: [
        {
          id: 'fax/auto',
          name: 'auto',
          path: 'fax/auto/',
          type: 'folder',
          children: [
            {
              id: 'fax/auto/2024',
              name: '2024',
              path: 'fax/auto/2024/',
              type: 'folder',
              children: [
                { id: 'fax/auto/2024/fax_statement_001.txt', name: 'fax_statement_001.txt', path: 'fax/auto/2024/', type: 'file', channel: 'fax' },
              ],
            },
          ],
        },
      ],
    },
  ];

  it('should render horizontal path with folder > file structure', () => {
    const onSelectFile = vi.fn();
    render(<SearchResultTree tree={mockTree} onSelectFile={onSelectFile} selectedFileId={undefined} />);

    // Should show path in horizontal format
    expect(screen.getByText('fax')).toBeInTheDocument();
    expect(screen.getByText('fax_statement_001.txt')).toBeInTheDocument();
  });

  it('should call onSelectFile when file is clicked', () => {
    const onSelectFile = vi.fn();
    render(<SearchResultTree tree={mockTree} onSelectFile={onSelectFile} selectedFileId={undefined} />);

    const fileNode = screen.getByText('fax_statement_001.txt');
    fileNode.click();

    expect(onSelectFile).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd src/DocViewer.WebApp && npx vitest run SearchResultTree.test.tsx`
Expected: FAIL with "SearchResultTree not defined"

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/DocViewer.WebApp/src/components/SearchResultTree/SearchResultTree.tsx
import { useState } from 'react';
import type { TreeNode } from '../../types';
import './SearchResultTree.css';

interface SearchResultTreeProps {
  tree: TreeNode[];
  onSelectFile: (node: TreeNode) => void;
  selectedFileId?: string;
}

export function SearchResultTree({ tree, onSelectFile, selectedFileId }: SearchResultTreeProps) {
  // Build full paths for tooltip display
  const getFullPath = (node: TreeNode): string => {
    if (node.type === 'file') return node.path + node.name;
    const childPath = node.children?.find(c => c.type === 'file');
    return childPath ? childPath.path + childPath.name : node.path;
  };

  return (
    <div className="search-result-tree" title={tree.map(n => getFullPath(n)).join('\n')}>
      {tree.map((node) => (
        <SearchResultNode
          key={node.id}
          node={node}
          onSelectFile={onSelectFile}
          selectedFileId={selectedFileId}
        />
      ))}
    </div>
  );
}

interface SearchResultNodeProps {
  node: TreeNode;
  onSelectFile: (node: TreeNode) => void;
  selectedFileId?: string;
  isLast?: boolean;
}

function SearchResultNode({ node, onSelectFile, selectedFileId, isLast = true }: SearchResultNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (node.type === 'file') {
    const isSelected = selectedFileId === node.id;
    return (
      <div
        className={`search-result-file ${isSelected ? 'selected' : ''}`}
        onClick={() => onSelectFile(node)}
      >
        <span className="file-icon">📄</span>
        <span className="file-name">{node.name}</span>
      </div>
    );
  }

  // Folder node - render as horizontal path segment
  const children = node.children || [];
  const hasFileChildren = children.some(c => c.type === 'file');
  const folderChildren = children.filter(c => c.type === 'folder');

  return (
    <div className="search-result-folder">
      <span
        className={`folder-name ${isExpanded ? 'expanded' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? '📂' : '📁'} {node.name}
      </span>

      {isExpanded && (
        <>
          <span className="separator">&gt;</span>
          {folderChildren.map((child, idx) => (
            <SearchResultNode
              key={child.id}
              node={child}
              onSelectFile={onSelectFile}
              selectedFileId={selectedFileId}
              isLast={idx === folderChildren.length - 1 && !hasFileChildren}
            />
          ))}
          {hasFileChildren && children
            .filter(c => c.type === 'file')
            .map((file, idx) => (
              <SearchResultNode
                key={file.id}
                node={file}
                onSelectFile={onSelectFile}
                selectedFileId={selectedFileId}
                isLast={idx === children.filter(c => c.type === 'file').length - 1}
              />
            ))}
        </>
      )}
    </div>
  );
}
```

```css
/* src/DocViewer.WebApp/src/components/SearchResultTree/SearchResultTree.css */
.search-result-tree {
  padding: 8px;
  font-family: monospace;
  overflow: auto;
  max-height: 100%;
}

.search-result-folder {
  display: inline;
  white-space: nowrap;
}

.folder-name {
  color: #888;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
}

.folder-name:hover {
  background: #2d2d2d;
  color: #ccc;
}

.separator {
  color: #555;
  margin: 0 8px;
}

.search-result-file {
  display: inline;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
}

.file-icon {
  margin-right: 4px;
}

.file-name {
  color: #ddd;
  font-weight: 500;
}

.search-result-file:hover {
  background: #2d2d2d;
}

.search-result-file.selected {
  background: #094771;
}

.search-result-file.selected .file-name {
  color: white;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd src/DocViewer.WebApp && npx vitest run SearchResultTree.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/DocViewer.WebApp/src/components/SearchResultTree/
git commit -m "feat: add SearchResultTree component

VS Code style horizontal tree for displaying search results
with collapsible folder segments.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Integrate into App.tsx

**Files:**
- Modify: `src/DocViewer.WebApp/src/App.tsx:98-116`

- [ ] **Step 1: Import the new components**

Add to imports in App.tsx:
```typescript
import { transformSearchResultsToTree } from './utils/transformSearchResultsToTree';
import { SearchResultTree } from './components/SearchResultTree/SearchResultTree';
```

- [ ] **Step 2: Replace flat list with SearchResultTree**

Replace the flat list rendering (lines 102-115):
```typescript
{searchResults?.results && searchResults.results.length > 0 ? (
  <SearchResultTree
    tree={transformSearchResultsToTree(searchResults.results)}
    onSelectFile={handleSelectFile}
    selectedFileId={selectedFile?.id}
  />
) : (
  <div className="sidebar-loading">No results found</div>
)}
```

- [ ] **Step 3: Run tests**

Run: `cd src/DocViewer.WebApp && npx vitest run`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add src/DocViewer.WebApp/src/App.tsx
git commit -m "feat: integrate SearchResultTree in sidebar

Replace flat list with VS Code style horizontal tree
showing full path to search results.

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

- [ ] **Step 2: Test search functionality**

1. Open browser to http://localhost:5173
2. Search for "001" in the search bar
3. Verify results show as horizontal tree:
   - `fax > auto > 2024 > fax_statement_001.txt`
   - `ftp > auto > 2024 > ftp_batch_001.txt`
4. Click on folder names to collapse/expand
5. Click on file to select and preview

- [ ] **Step 3: Test other search scenarios**

1. Search for "appraisal" - should show scan path
2. Clear search - should return to normal file tree

- [ ] **Step 4: Push to GitHub**

```bash
git push
```