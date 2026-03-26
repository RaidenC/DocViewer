export type Channel = 'fax' | 'email' | 'scan' | 'ftp';

export interface TreeNode {
  id: string;
  name: string;
  path: string;
  type: 'folder' | 'file';
  channel?: Channel;
  hasChildren?: boolean;
  children?: TreeNode[];
  isLoading?: boolean;
}

export interface SearchResult {
  results: TreeNode[];
  totalCount: number;
  hasMore: boolean;
}

export interface DocumentMetadata {
  receiveTime: string;
  creationTime: string;
  sender: string;
  email?: string;
  channel: string;
  clientId: string;
  clientName: string;
}

export interface SearchFilters {
  q?: string;
  channel?: string;
  client?: string;
  clientName?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export interface ActiveFilter {
  key: string;
  value: string;
  label: string;
}