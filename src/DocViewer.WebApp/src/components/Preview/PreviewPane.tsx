import { lazy, Suspense } from 'react';
import { usePreview } from '../../hooks/usePreview';
import type { TreeNode } from '../../types';

const PdfViewer = lazy(() => import('./PdfViewer').then(m => ({ default: m.PdfViewer })));
const ImageViewer = lazy(() => import('./ImageViewer').then(m => ({ default: m.ImageViewer })));
const TextViewer = lazy(() => import('./TextViewer').then(m => ({ default: m.TextViewer })));

interface PreviewPaneProps {
  selectedFile: TreeNode | null;
}

export function PreviewPane({ selectedFile }: PreviewPaneProps) {
  const { data: blob, isLoading, error } = usePreview(selectedFile?.path || null);

  if (!selectedFile) {
    return (
      <div className="preview-pane empty">
        <p>Select a file to preview</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="preview-pane loading">
        <div className="spinner"></div>
        <p>Loading preview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="preview-pane error">
        <p>Failed to load preview</p>
      </div>
    );
  }

  if (!blob) {
    return (
      <div className="preview-pane empty">
        <p>No preview available</p>
      </div>
    );
  }

  const contentType = blob.type;

  return (
    <div className="preview-pane">
      <div className="preview-header">
        <h3>{selectedFile.name}</h3>
      </div>
      <div className="preview-content">
        <Suspense fallback={<div className="viewer-loading">Loading viewer...</div>}>
          {contentType === 'application/pdf' && <PdfViewer blob={blob} />}
          {contentType.startsWith('image/') && <ImageViewer blob={blob} fileName={selectedFile.name} />}
          {contentType === 'text/plain' && <TextViewer blob={blob} />}
          {!['application/pdf', 'text/plain'].includes(contentType) && !contentType.startsWith('image/') && (
            <div className="preview-unsupported">
              <p>Preview not available for this file type</p>
            </div>
          )}
        </Suspense>
      </div>
    </div>
  );
}

export default PreviewPane;