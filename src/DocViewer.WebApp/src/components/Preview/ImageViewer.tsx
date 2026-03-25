import { useState, useMemo } from 'react';

interface ImageViewerProps {
  blob: Blob;
  fileName: string;
}

export function ImageViewer({ blob, fileName }: ImageViewerProps) {
  const [scale, setScale] = useState(1);

  const url = useMemo(() => URL.createObjectURL(blob), [blob]);

  const handleZoomIn = () => setScale(s => Math.min(s + 0.25, 3));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.25, 0.25));
  const handleReset = () => setScale(1);

  return (
    <div className="image-viewer">
      <div className="image-controls">
        <button onClick={handleZoomOut}>−</button>
        <span>{Math.round(scale * 100)}%</span>
        <button onClick={handleZoomIn}>+</button>
        <button onClick={handleReset}>Reset</button>
      </div>
      <div className="image-container">
        <img
          src={url}
          alt={fileName}
          style={{ transform: `scale(${scale})` }}
        />
      </div>
    </div>
  );
}

export default ImageViewer;