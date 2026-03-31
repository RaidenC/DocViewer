import { useState, useCallback, Suspense, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FileTree } from './components/FileTree/FileTree';
import { PreviewPane } from './components/Preview/PreviewPane';
import { SearchBar } from './components/Header/SearchBar';
import FilterDropdown from './components/Header/FilterDropdown';
import SearchableSelect from './components/Header/SearchableSelect';
import DateFilter from './components/Header/DateFilter';
import ActiveFilters from './components/Header/ActiveFilters';
import StatusBar from './components/StatusBar';
import { SearchResultTree } from './components/SearchResultTree/SearchResultTree';
import BenchmarkPanel from './components/Benchmark/BenchmarkPanel';
import { transformSearchResultsToTree } from './utils/transformSearchResultsToTree';
import { useSearch } from './hooks/useSearch';
import LiveProgress from './components/LiveProgress';
import ActivityFeed from './components/ActivityFeed';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('');
  const [clientFilter, setClientFilter] = useState<string>('');
  const [clientOptions, setClientOptions] = useState<{ value: string; label: string }[]>([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data: searchResults, isLoading: isSearching } = useSearch({
    q: searchQuery,
    channel: channelFilter || undefined,
    client: clientFilter || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  });

  useEffect(() => {
    fetch('/api/documents/clients')
      .then(res => res.json())
      .then((clients: string[]) => {
        setClientOptions(clients.map(c => ({ value: c, label: c })));
      })
      .catch(console.error);
  }, []);

  const handleSelectFile = useCallback((node: TreeNode) => {
    if (node.type === 'file') {
      setSelectedFile(node);
    }
  }, []);

  const activeFilters: ActiveFilter[] = [];
  if (channelFilter) activeFilters.push({ key: 'channel', value: channelFilter, label: `Channel: ${channelFilter}` });
  if (clientFilter) activeFilters.push({ key: 'client', value: clientFilter, label: `Client: ${clientFilter}` });
  if (fromDate || toDate) {
    const label = fromDate && toDate
      ? `Date: ${fromDate} to ${toDate}`
      : fromDate
        ? `Date: ${fromDate} onwards`
        : `Date: up to ${toDate}`;
    activeFilters.push({ key: 'date', value: 'date', label });
  }

  const handleRemoveFilter = (key: string) => {
    switch (key) {
      case 'channel': setChannelFilter(''); break;
      case 'client': setClientFilter(''); break;
      case 'date': setFromDate(''); setToDate(''); break;
    }
  };

  const handleClearAll = () => {
    setChannelFilter('');
    setClientFilter('');
    setFromDate('');
    setToDate('');
    setSearchQuery('');
  };

  const hasActiveSearch = searchQuery || channelFilter || clientFilter || fromDate || toDate;

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
            <SearchableSelect
              label="Client"
              options={clientOptions}
              value={clientFilter}
              onChange={setClientFilter}
              placeholder="Search clients..."
            />
            <DateFilter
              fromDate={fromDate}
              toDate={toDate}
              onFromDateChange={setFromDate}
              onToDateChange={setToDate}
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
            {hasActiveSearch ? (
              <div className="search-results">
                {isSearching ? (
                  <div className="sidebar-loading">Searching...</div>
                ) : searchResults?.results && searchResults.results.length > 0 ? (
                  <SearchResultTree
                    tree={transformSearchResultsToTree(searchResults.results)}
                    onSelectFile={handleSelectFile}
                    selectedFileId={selectedFile?.id}
                  />
                ) : (
                  <div className="sidebar-loading">No results found</div>
                )}
              </div>
            ) : (
              <FileTree
                onSelectFile={handleSelectFile}
                selectedFileId={selectedFile?.id}
              />
            )}
          </Suspense>
        </aside>
        <section className="content">
          <PreviewPane selectedFile={selectedFile} />
        </section>

        <div className="sidebar-widgets">
          <LiveProgress />
          <ActivityFeed />
        </div>
      </main>

      <BenchmarkPanel />

      <StatusBar
        totalCount={12}
        filteredCount={hasActiveSearch ? (searchResults?.totalCount ?? 0) : 12}
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