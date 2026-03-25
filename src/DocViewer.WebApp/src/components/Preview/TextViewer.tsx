import { useEffect, useState } from 'react';

interface TextViewerProps {
  blob: Blob;
}

export function TextViewer({ blob }: TextViewerProps) {
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    blob.text().then(setContent).catch(() => setContent('Error loading text'));
  }, [blob]);

  return (
    <div className="text-viewer">
      <pre>{content}</pre>
    </div>
  );
}

export default TextViewer;