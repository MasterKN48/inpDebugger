import { useState } from 'preact/hooks';

export function App() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('idle');

  const handleRun = async () => {
    setStatus('running');
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      console.log('Started job:', data.jobId);
    } catch (e) {
      console.error(e);
    } finally {
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-8">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-2 tracking-tight">INP Debugger</h1>
        <p className="text-neutral-400">Interaction to Next Paint Diagnostics</p>
      </header>

      <main className="max-w-2xl mx-auto">
        <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 shadow-xl">
          <label className="block text-sm font-medium text-neutral-400 mb-2">
            Target URL
          </label>
          <div className="flex gap-4">
            <input
              type="url"
              value={url}
              onInput={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            />
            <button
              onClick={handleRun}
              disabled={status === 'running' || !url}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-700 px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              {status === 'running' ? 'Analyzing...' : 'Run Analysis'}
            </button>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6">
          <div className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 h-48 flex items-center justify-center text-neutral-500 italic">
            Recent Results will appear here...
          </div>
        </div>
      </main>
    </div>
  );
}
