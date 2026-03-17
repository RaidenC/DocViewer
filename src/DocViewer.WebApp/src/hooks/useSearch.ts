import { useQuery } from '@tanstack/react-query';
import { searchDocuments } from '../api/documents';
import type { SearchFilters } from '../types';

export function useSearch(filters: SearchFilters) {
  return useQuery({
    queryKey: ['search', filters],
    queryFn: () => searchDocuments(filters),
    staleTime: 60 * 1000, // 1 minute for search results
  });
}