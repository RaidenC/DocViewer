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

    // Should show path in horizontal format - check folder "fax" exists (folder-name class)
    const folders = screen.getAllByText(/fax/);
    expect(folders.length).toBeGreaterThanOrEqual(1);
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