import { useEffect, useRef } from 'react';

interface PdfViewerProps {
  blob: Blob;
}

export function PdfViewer({ blob }: PdfViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current && blob) {
      const url = URL.createObjectURL(blob);
      iframeRef.current.src = url;
      return () => URL.revokeObjectURL(url);
    }
  }, [blob]);

  return (
    <div className="pdf-viewer">
      <iframe
        ref={iframeRef}
        title="PDF Preview"
        className="pdf-iframe"
      />
    </div>
  );
}

export default PdfViewer;