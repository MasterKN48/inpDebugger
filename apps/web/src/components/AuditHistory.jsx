import { h } from 'preact';
import { useEffect } from 'preact/hooks';
import { useAuditStore } from '../store/useAuditStore';

export function AuditHistory() {
  const history = useAuditStore(s => s.history);
  const fetchHistory = useAuditStore(s => s.fetchHistory);
  const loadResult = useAuditStore(s => s.loadResult);
  const deleteResult = useAuditStore(s => s.deleteResult);
  const activeResult = useAuditStore(s => s.activeResult);
  const jobStatus = useAuditStore(s => s.jobStatus);

  // Load history list initially on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const getScoreDotClass = (score) => {
    switch (score) {
      case 'good':
        return 'bg-emerald-500 shadow-[0_0_8px_0_rgba(16,185,129,0.3)]';
      case 'needs-improvement':
        return 'bg-amber-500 shadow-[0_0_8px_0_rgba(245,158,11,0.3)]';
      case 'poor':
      default:
        return 'bg-pink-500 shadow-[0_0_8px_0_rgba(244,63,94,0.3)]';
    }
  };

  const getINPTemplateColor = (inp) => {
    if (inp <= 200) return 'text-emerald-600';
    if (inp <= 500) return 'text-amber-600';
    return 'text-pink-600';
  };

  return (
    <div className="backdrop-blur-md bg-white/45 border border-white/60 rounded-3xl p-6 shadow-[0_8px_32px_0_rgba(142,155,178,0.12)] h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight uppercase tracking-wider block">
          📜 Diagnostic Audit History
        </h3>
        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
          Load past Chromium execution runs and database captures.
        </p>
      </div>

      {history.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white/30 border border-dashed border-slate-200 rounded-2xl min-h-[220px]">
          <span className="text-3xl mb-2 opacity-60">📂</span>
          <span className="text-xs font-bold text-slate-500 block">No Audits Saved Yet</span>
          <span className="text-[10px] text-slate-400 font-medium max-w-[150px] mt-1">
            Trigger a URL analysis to persist your first detailed diagnostics run.
          </span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[480px] pr-1.5 scrollbar-thin">
          {history.map((run) => {
            const isActive = activeResult?.id === run.id;
            
            return (
              <div 
                key={run.id}
                onClick={() => {
                  if (jobStatus !== 'running') {
                    loadResult(run.id);
                  }
                }}
                className={`relative group flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-white border-emerald-200/80 shadow-md shadow-emerald-50/50'
                    : 'bg-white/50 border-slate-100 hover:border-slate-300/60 hover:bg-white/80 hover:shadow-sm'
                }`}
              >
                {/* Score Dot, URL and details */}
                <div className="flex items-center gap-3 overflow-hidden mr-3">
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${getScoreDotClass(run.score)}`} />
                  
                  <div className="overflow-hidden">
                    <span className="text-xs font-bold text-slate-800 block truncate leading-tight">
                      {run.url.replace(/^https?:\/\//i, '')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold mt-0.5 inline-flex items-center gap-1.5">
                      <span>{run.profile === 'mobile' ? '📱 Mobile' : '🖥️ Desktop'}</span>
                      <span className="text-slate-300">•</span>
                      <span>{new Date(run.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </span>
                  </div>
                </div>

                {/* Latency and Quick Delete Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className={`text-xs font-extrabold font-mono ${getINPTemplateColor(run.overallINP)}`}>
                      {run.overallINP}ms
                    </span>
                  </div>

                  {/* Deletion Icon (Hidden by default, shown on hover) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete run result for ${run.url}?`)) {
                        deleteResult(run.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-pink-600 hover:bg-pink-50 border border-transparent hover:border-pink-100 transition-all cursor-pointer"
                    title="Delete record"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
