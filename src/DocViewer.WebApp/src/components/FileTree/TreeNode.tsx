import { memo, useState, useCallback } from 'react';
import type { TreeNode as TreeNodeType } from '../../types';

interface TreeNodeProps {
  node: TreeNodeType;
  depth?: number;
  onSelect: (node: TreeNodeType) => void;
  onToggle: (node: TreeNodeType) => void;
  selectedId?: string;
}

const channelIcons: Record<string, string> = {
  fax: '📠',
  email: '📧',
  scan: '📄',
  ftp: '📁',
};

export const TreeNode = memo(function TreeNode({
  node,
  depth = 0,
  onSelect,
  onToggle,
  selectedId
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 1);
  const isSelected = selectedId === node.id;

  const handleClick = useCallback(() => {
    if (node.type === 'folder') {
      setIsExpanded(!isExpanded);
      onToggle(node);
    } else {
      onSelect(node);
    }
  }, [node, isExpanded, onSelect, onToggle]);

  const paddingLeft = 16 + depth * 20;

  return (
    <div className="tree-node">
      <div
        className={`tree-node-content ${isSelected ? 'selected' : ''} ${node.type}`}
        style={{ paddingLeft }}
        onClick={handleClick}
      >
        {node.type === 'folder' && (
          <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
            ▶
          </span>
        )}
        <span className="node-icon">
          {node.type === 'file' && node.channel
            ? channelIcons[node.channel] || '📄'
            : node.type === 'folder' ? (isExpanded ? '📂' : '📁') : '📄'}
        </span>
        <span className="node-name">{node.name}</span>
        {node.hasChildren && !isExpanded && <span className="child-count">→</span>}
      </div>

      {isExpanded && node.children && (
        <div className="tree-children">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
              onToggle={onToggle}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
});