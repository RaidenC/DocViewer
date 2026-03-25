import type { TreeNode, SearchResult, DocumentMetadata, SearchFilters } from '../types';

const API_BASE = '/api/documents';

export async function fetchTree(path: string = ''): Promise<TreeNode[]> {
  const params = new URLSearchParams();
  if (path) params.set('path', path);

  const response = await fetch(`${API_BASE}/tree?${params}`);
  if (!response.ok) throw new Error('Failed to fetch tree');
  return response.json();
}

export async function searchDocuments(filters: SearchFilters): Promise<SearchResult> {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.channel) params.set('channel', filters.channel);
  if (filters.client) params.set('client', filters.client);
  if (filters.fromDate) params.set('fromDate', filters.fromDate);
  if (filters.toDate) params.set('toDate', filters.toDate);
  params.set('page', String(filters.page ?? 1));
  params.set('pageSize', String(filters.pageSize ?? 20));

  const response = await fetch(`${API_BASE}/search?${params}`);
  if (!response.ok) throw new Error('Search failed');
  return response.json();
}

export async function fetchPreview(id: string): Promise<Blob> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(id)}/preview`);
  if (!response.ok) throw new Error('Failed to fetch preview');
  return response.blob();
}

export async function fetchMetadata(id: string): Promise<DocumentMetadata> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(id)}/metadata`);
  if (!response.ok) throw new Error('Failed to fetch metadata');
  return response.json();
}