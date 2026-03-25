import { useQuery } from '@tanstack/react-query';
import { fetchPreview } from '../api/documents';

export function usePreview(fileId: string | null) {
  return useQuery({
    queryKey: ['preview', fileId],
    queryFn: () => fileId ? fetchPreview(fileId) : Promise.resolve(null),
    enabled: !!fileId,
    staleTime: Infinity, // Preview doesn't change
  });
}