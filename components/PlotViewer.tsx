import Plot from 'react-plotly.js';
import { useEffect, useState } from 'react';
import pako from 'pako';

export default function PlotViewer({ signedUrl }: { signedUrl: string }) {
  const [fig, setFig] = useState<any>(null);

  useEffect(() => {
    if (!signedUrl) return;

    fetch(signedUrl)
      .then((res) => res.arrayBuffer())
      .then((buffer) => {
        const decompressed = pako.ungzip(new Uint8Array(buffer), { to: 'string' });
        return JSON.parse(decompressed);
      })
      .then((data) => setFig(data))
      .catch((err) => console.error('Decompression error:', err));
  }, [signedUrl]);

  if (!fig) return <p>Loading plot...</p>;

  return (
    <Plot
      data={fig.data}
      layout={fig.layout}
      useResizeHandler
      style={{ width: '100%', height: '100%' }}
    />
  );
}
