import { useQuery } from '@tanstack/react-query';
import { fetchTree } from '../api/documents';

export function useDocumentTree(path: string = '') {
  return useQuery({
    queryKey: ['tree', path],
    queryFn: () => fetchTree(path),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTreeNode(path: string) {
  return useQuery({
    queryKey: ['tree', path],
    queryFn: () => fetchTree(path),
    staleTime: 5 * 60 * 1000,
    enabled: !!path,
  });
}