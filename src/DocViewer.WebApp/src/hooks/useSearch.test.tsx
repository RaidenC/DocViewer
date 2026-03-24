import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSearch } from '../hooks/useSearch';
import type { ReactNode } from 'react';

// Mock the API
vi.mock('../api/documents', () => ({
  searchDocuments: vi.fn(),
}));

import { searchDocuments } from '../api/documents';
const mockedSearchDocuments = searchDocuments as ReturnType<typeof vi.fn>;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('useSearch', () => {
  beforeEach(() => {
    mockedSearchDocuments.mockReset();
    queryClient.clear();
  });

  it('should return search results when query is executed', async () => {
    const mockResults = [
      {
        id: 'doc1',
        fileName: 'fax1.txt',
        filePath: 'fax/mortgage/fax1.txt',
        channel: 'fax',
        client: 'mortgage',
        year: 2025,
        month: '03',
        date: '2025-03-15',
        sender: 'John Doe',
        subject: 'Mortgage App',
        content: 'Mortgage application content',
        metadata: {},
      },
    ];

    mockedSearchDocuments.mockResolvedValue(mockResults);

    const { result } = renderHook(() => useSearch({ q: 'mortgage' }), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedSearchDocuments).toHaveBeenCalledWith({ q: 'mortgage' });
    expect(result.current.data?.results).toHaveLength(1);
    expect(result.current.data?.results[0].name).toBe('fax1.txt');
  });

  it('should transform API response to TreeNode format', async () => {
    const mockResults = [
      {
        id: 'doc1',
        fileName: 'test.txt',
        filePath: 'path/to/test.txt',
        channel: 'email',
        client: 'client1',
        year: 2025,
        month: '03',
        date: '2025-03-15',
        sender: 'Sender',
        subject: 'Subject',
        content: 'Content',
        metadata: {},
      },
    ];

    mockedSearchDocuments.mockResolvedValue(mockResults);

    const { result } = renderHook(() => useSearch({}), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const treeNode = result.current.data?.results[0];
    expect(treeNode).toMatchObject({
      id: 'doc1',
      name: 'test.txt',
      path: 'path/to/test.txt',
      type: 'file',
      channel: 'email',
      hasChildren: false,
    });
  });

  it('should handle empty search results', async () => {
    mockedSearchDocuments.mockResolvedValue([]);

    const { result } = renderHook(() => useSearch({ q: 'nonexistent' }), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.results).toHaveLength(0);
    expect(result.current.data?.totalCount).toBe(0);
  });

  it('should set hasMore to false', async () => {
    mockedSearchDocuments.mockResolvedValue([
      { id: 'doc1', fileName: 'doc1.txt', filePath: 'doc1.txt', channel: 'fax', client: 'c', year: 2025, month: '03', date: '2025-03-15', sender: 's', subject: 's', content: 'c', metadata: {} },
    ]);

    const { result } = renderHook(() => useSearch({}), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.hasMore).toBe(false);
  });

  it('should pass search filters to API', async () => {
    mockedSearchDocuments.mockResolvedValue([]);

    const filters = {
      q: 'test',
      channel: 'fax',
      client: 'mortgage',
      fromDate: '2025-01-01',
      toDate: '2025-12-31',
      page: 2,
      pageSize: 10,
    };

    renderHook(() => useSearch(filters), { wrapper: Wrapper });

    await waitFor(() => {
      expect(mockedSearchDocuments).toHaveBeenCalled();
    });

    expect(mockedSearchDocuments).toHaveBeenCalledWith(filters);
  });
});