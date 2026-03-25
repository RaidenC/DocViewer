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