import { useState, useCallback, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FileTree } from './components/FileTree/FileTree';
import { PreviewPane } from './components/Preview/PreviewPane';
import { SearchBar } from './components/Header/SearchBar';
import FilterDropdown from './components/Header/FilterDropdown';
import ActiveFilters from './components/Header/ActiveFilters';
import StatusBar from './components/StatusBar';
import type { TreeNode, ActiveFilter } from './types';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

function AppContent() {
  const [selectedFile, setSelectedFile] = useState<TreeNode | null>(null);
  const [_searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('');
  const [clientFilter, setClientFilter] = useState<string>('');

  const handleSelectFile = useCallback((node: TreeNode) => {
    if (node.type === 'file') {
      setSelectedFile(node);
    }
  }, []);

  const activeFilters: ActiveFilter[] = [];
  if (channelFilter) activeFilters.push({ key: 'channel', value: channelFilter, label: `Channel: ${channelFilter}` });
  if (clientFilter) activeFilters.push({ key: 'client', value: clientFilter, label: `Client: ${clientFilter}` });

  const handleRemoveFilter = (key: string) => {
    switch (key) {
      case 'channel': setChannelFilter(''); break;
      case 'client': setClientFilter(''); break;
    }
  };

  const handleClearAll = () => {
    setChannelFilter('');
    setClientFilter('');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-top">
          <h1>DocViewer</h1>
          <div className="header-controls">
            <SearchBar onSearch={setSearchQuery} />
            <FilterDropdown
              label="Channel"
              options={[
                { value: 'fax', label: 'Fax' },
                { value: 'email', label: 'Email' },
                { value: 'scan', label: 'Scan' },
                { value: 'ftp', label: 'FTP' },
              ]}
              value={channelFilter}
              onChange={(v) => setChannelFilter(v as string)}
            />
            <FilterDropdown
              label="Client"
              options={[
                { value: 'auto', label: 'Auto' },
                { value: 'mortgage', label: 'Mortgage' },
              ]}
              value={clientFilter}
              onChange={(v) => setClientFilter(v as string)}
            />
          </div>
        </div>
        <ActiveFilters
          filters={activeFilters}
          onRemove={handleRemoveFilter}
          onClearAll={handleClearAll}
        />
      </header>

      <main className="app-main">
        <aside className="sidebar">
          <Suspense fallback={<div className="sidebar-loading">Loading...</div>}>
            <FileTree
              onSelectFile={handleSelectFile}
              selectedFileId={selectedFile?.id}
            />
          </Suspense>
        </aside>
        <section className="content">
          <PreviewPane selectedFile={selectedFile} />
        </section>
      </main>

      <StatusBar
        totalCount={12}
        filteredCount={activeFilters.length > 0 || _searchQuery ? 8 : 12}
        selectedCount={0}
      />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;