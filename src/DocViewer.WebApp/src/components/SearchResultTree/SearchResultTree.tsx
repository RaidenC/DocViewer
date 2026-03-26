import { useState } from 'react';
import type { TreeNode } from '../../types';
import './SearchResultTree.css';

interface SearchResultTreeProps {
  tree: TreeNode[];
  onSelectFile: (node: TreeNode) => void;
  selectedFileId?: string;
}

export function SearchResultTree({ tree, onSelectFile, selectedFileId }: SearchResultTreeProps) {
  return (
    <div className="search-result-tree">
      {tree.map((node) => (
        <SearchResultRow
          key={node.id}
          node={node}
          onSelectFile={onSelectFile}
          selectedFileId={selectedFileId}
        />
      ))}
    </div>
  );
}

interface SearchResultRowProps {
  node: TreeNode;
  onSelectFile: (node: TreeNode) => void;
  selectedFileId?: string;
  depth?: number;
}

function SearchResultRow({ node, onSelectFile, selectedFileId, depth = 0 }: SearchResultRowProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const isSelected = selectedFileId === node.id;
  const fullPath = node.type === 'file' ? node.path + node.name : node.path;

  const handleClick = () => {
    if (node.type === 'folder') {
      setIsExpanded(!isExpanded);
    } else {
      onSelectFile(node);
    }
  };

  return (
    <>
      <div
        className={`search-result-row ${isSelected ? 'selected' : ''}`}
        onClick={handleClick}
        title={fullPath}
        style={{ paddingLeft: depth * 16 + 4 }}
      >
        {node.type === 'folder' ? (
          <>
            <span className="folder-name">
              {isExpanded ? '▼' : '▶'} {node.name}
            </span>
            {isExpanded && (
              <span className="separator">&gt;</span>
            )}
          </>
        ) : (
          <>
            <span className="file-icon">📄</span>
            <span className="file-name">{node.name}</span>
          </>
        )}
      </div>

      {node.type === 'folder' && isExpanded && node.children && (
        <div className="search-result-children">
          {node.children.map((child) => (
            <SearchResultRow
              key={child.id}
              node={child}
              onSelectFile={onSelectFile}
              selectedFileId={selectedFileId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </>
  );
}