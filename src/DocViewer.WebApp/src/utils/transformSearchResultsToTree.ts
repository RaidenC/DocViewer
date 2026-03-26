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

    // Extract directory path by removing the filename
    // result.path is the full path including filename (e.g., "fax/auto/2024/file.txt")
    const lastSlashIndex = result.path.lastIndexOf('/');
    const dirPath = lastSlashIndex >= 0 ? result.path.substring(0, lastSlashIndex + 1) : '';

    // Get path segments, e.g., "fax/auto/2024/" -> ["fax", "auto", "2024"]
    const pathParts = dirPath
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