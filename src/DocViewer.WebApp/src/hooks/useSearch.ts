import { useQuery } from '@tanstack/react-query';
import { searchDocuments } from '../api/documents';
import type { SearchFilters, TreeNode, SearchResult } from '../types';

interface SearchApiResult {
  id: string;
  fileName: string;
  filePath: string;
  channel: string;
  client: string;
  year: number;
  month: string;
  date: string;
  sender: string;
  subject: string;
  content: string;
  metadata: Record<string, unknown>;
}

interface SearchApiResponse {
  results: SearchApiResult[];
  totalCount: number;
  hasMore: boolean;
}

function transformToTreeNode(doc: SearchApiResult): TreeNode {
  return {
    id: doc.id,
    name: doc.fileName,
    path: doc.filePath,
    type: 'file',
    channel: doc.channel as TreeNode['channel'],
    hasChildren: false,
  };
}

export function useSearch(filters: SearchFilters) {
  return useQuery<SearchResult>({
    queryKey: ['search', filters],
    queryFn: async () => {
      const response = await searchDocuments(filters) as unknown as SearchApiResponse;
      return {
        results: response.results.map(transformToTreeNode),
        totalCount: response.totalCount,
        hasMore: response.hasMore,
      };
    },
    staleTime: 60 * 1000,
  });
}