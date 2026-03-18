import { useCallback, Suspense } from 'react';
import { useDocumentTree } from '../../hooks/useDocumentTree';
import { TreeNode } from './TreeNode';
import type { TreeNode as TreeNodeType } from '../../types';

interface FileTreeProps {
  onSelectFile: (node: TreeNodeType) => void;
  selectedFileId?: string;
}

export function FileTree({ onSelectFile, selectedFileId }: FileTreeProps) {
  const { data: nodes, isLoading, error } = useDocumentTree('');

  const handleToggle = useCallback((node: TreeNodeType) => {
    // Handle expand/collapse - TreeNode manages its own state
    console.log('Toggle:', node.path);
  }, []);

  if (isLoading) {
    return <div className="file-tree-loading">Loading...</div>;
  }

  if (error) {
    return <div className="file-tree-error">Error loading tree</div>;
  }

  return (
    <div className="file-tree">
      <Suspense fallback={<div>Loading tree...</div>}>
        {nodes?.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            onSelect={onSelectFile}
            onToggle={handleToggle}
            selectedId={selectedFileId}
          />
        ))}
      </Suspense>
    </div>
  );
}