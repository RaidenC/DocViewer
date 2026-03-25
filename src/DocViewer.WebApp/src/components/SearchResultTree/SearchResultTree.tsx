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
}

function SearchResultNode({ node, onSelectFile, selectedFileId }: SearchResultNodeProps) {
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