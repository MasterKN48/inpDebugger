import { h } from 'preact';
import { useAuditStore } from '../store/useAuditStore';

export function MetricCards() {
  const activeResult = useAuditStore(s => s.activeResult);

  if (!activeResult) return null;

  const {
    url,
    profile,
    overallINP,
    score,
    worstInteraction,
    allInteractions = [],
    longTasks = []
  } = activeResult;

  // Format latency scoring band
  const getScoreInfo = (s) => {
    switch (s) {
      case 'good':
        return {
          label: 'Good Performance',
          colorClass: 'bg-emerald-50 border-emerald-100 text-emerald-800',
          indicator: 'bg-emerald-500',
          textClass: 'text-emerald-600',
          bgHighlight: 'bg-emerald-500/10'
        };
      case 'needs-improvement':
        return {
          label: 'Needs Improvement',
          colorClass: 'bg-amber-50 border-amber-100 text-amber-800',
          indicator: 'bg-amber-500',
          textClass: 'text-amber-600',
          bgHighlight: 'bg-amber-500/10'
        };
      case 'poor':
      default:
        return {
          label: 'Poor Performance',
          colorClass: 'bg-pink-50 border-pink-100 text-pink-700',
          indicator: 'bg-pink-500',
          textClass: 'text-pink-600',
          bgHighlight: 'bg-pink-500/10'
        };
    }
  };

  const scoreInfo = getScoreInfo(score);

  // Decompose latency values for worst interaction (or fallbacks)
  const inputDelay = worstInteraction?.inputDelay || 0;
  const processingDuration = worstInteraction?.processingDuration || 0;
  const presentationDelay = worstInteraction?.presentationDelay || 0;
  const totalWorst = inputDelay + processingDuration + presentationDelay || 1;

  // Percentage calculations for stacked horizontal bar chart
  const inputPct = Math.round((inputDelay / totalWorst) * 100);
  const processPct = Math.round((processingDuration / totalWorst) * 100);
  const presentPct = 100 - inputPct - processPct;

  return (
    <div className="space-y-6">
      {/* 1. Header Overview & Main Latency Glass Card */}
      <div className="backdrop-blur-md bg-white/45 border border-white/60 rounded-3xl p-6 shadow-[0_8px_32px_0_rgba(142,155,178,0.12)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200/50">
          <div>
            <span className="text-[10px] bg-slate-200/60 text-slate-600 font-bold px-2.5 py-1 rounded-full border border-slate-300/40 uppercase tracking-wide">
              {profile === 'mobile' ? '📱 Mobile Emulated (4G)' : '🖥️ Desktop Emulated'}
            </span>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight mt-2 flex items-center gap-1.5">
              Diagnostics for <span className="text-slate-500 font-semibold">{url}</span>
            </h1>
          </div>
          
          {/* Scoring Banner */}
          <div className={`px-4 py-2 rounded-2xl border text-xs font-bold ${scoreInfo.colorClass} shadow-sm flex items-center gap-2`}>
            <span className={`h-2.5 w-2.5 rounded-full ${scoreInfo.indicator} animate-pulse`} />
            {scoreInfo.label}
          </div>
        </div>

        {/* Diagnostic Key Numbers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Overall INP Circle */}
          <div className="flex flex-col items-center justify-center p-6 bg-white/50 border border-slate-100 rounded-2xl shadow-sm text-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Overall INP</span>
            <div className="relative flex items-center justify-center">
              <span className={`text-5xl font-extrabold tracking-tight ${scoreInfo.textClass}`}>
                {overallINP}
              </span>
              <span className="text-sm font-semibold text-slate-400 ml-1 mt-4">ms</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium mt-2">
              Maximum observed user interaction latency.
            </span>
          </div>

          {/* Three-Phase breakdown bar list */}
          <div className="md:col-span-2 flex flex-col justify-center p-6 bg-white/50 border border-slate-100 rounded-2xl shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">INP Latency Breakdown</span>
            
            {/* Visual Stacked Horizontal Progress Bar */}
            <div className="h-6 w-full rounded-full bg-slate-100 flex overflow-hidden border border-slate-200/50 mb-5">
              {inputDelay > 0 && (
                <div 
                  className="bg-gradient-to-r from-amber-400 to-amber-500 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all"
                  style={{ width: `${inputPct}%` }}
                  title={`Input Delay: ${inputDelay}ms`}
                >
                  {inputPct > 15 ? `${inputPct}%` : ''}
                </div>
              )}
              {processingDuration > 0 && (
                <div 
                  className="bg-gradient-to-r from-pink-500 to-rose-500 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all"
                  style={{ width: `${processPct}%` }}
                  title={`Processing Duration: ${processingDuration}ms`}
                >
                  {processPct > 15 ? `${processPct}%` : ''}
                </div>
              )}
              {presentationDelay > 0 && (
                <div 
                  className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all"
                  style={{ width: `${presentPct}%` }}
                  title={`Presentation Delay: ${presentationDelay}ms`}
                >
                  {presentPct > 15 ? `${presentPct}%` : ''}
                </div>
              )}
            </div>

            {/* Label details */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="border-r border-slate-100">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-400 mr-1.5" />
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Input Delay</span>
                <span className="text-xs font-bold text-slate-700">{inputDelay} ms</span>
              </div>
              <div className="border-r border-slate-100">
                <span className="inline-block h-2 w-2 rounded-full bg-pink-500 mr-1.5" />
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Processing</span>
                <span className="text-xs font-bold text-slate-700">{processingDuration} ms</span>
              </div>
              <div>
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 mr-1.5" />
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Presentation</span>
                <span className="text-xs font-bold text-slate-700">{presentationDelay} ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Worst Interaction Deep-dive */}
      {worstInteraction && (
        <div className="backdrop-blur-md bg-white/45 border border-white/60 rounded-3xl p-6 shadow-[0_8px_32px_0_rgba(142,155,178,0.12)]">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight mb-4 flex items-center gap-2">
            <span>🎯</span> Slowest Event Deep-Dive
          </h2>

          <div className="bg-white/50 border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            {/* Action Meta Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Event Trigger</span>
                <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-lg border border-pink-100 mt-1 inline-block uppercase">
                  {worstInteraction.eventType}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Latency</span>
                <span className="text-xs font-bold text-slate-700 mt-1 inline-block">
                  {worstInteraction.latency} ms
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Document Load State</span>
                <span className="text-xs font-bold text-slate-700 mt-1 inline-block capitalize">
                  {worstInteraction.loadState || 'Loaded'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Interaction Score</span>
                <span className={`text-xs font-bold mt-1 inline-block uppercase ${scoreInfo.textClass}`}>
                  {worstInteraction.latency <= 200 ? 'Good' : worstInteraction.latency <= 500 ? 'Needs Imp.' : 'Poor'}
                </span>
              </div>
            </div>

            {/* Target Selector */}
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Target CSS Selector</span>
              <code className="text-xs font-mono bg-slate-900 text-pink-200 border border-slate-800 px-3 py-2 rounded-xl block overflow-x-auto shadow-inner">
                {worstInteraction.selector}
              </code>
            </div>

            {/* Target HTML Snippet */}
            {worstInteraction.htmlSnippet && (
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">DOM Node Source Markup</span>
                <pre className="text-[10.5px] font-mono bg-slate-950 text-slate-300 border border-slate-900 p-3 rounded-xl overflow-x-auto leading-relaxed shadow-inner">
                  <code>{worstInteraction.htmlSnippet}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Main-Thread Long Tasks Table */}
      <div className="backdrop-blur-md bg-white/45 border border-white/60 rounded-3xl p-6 shadow-[0_8px_32px_0_rgba(142,155,178,0.12)]">
        <h2 className="text-lg font-bold text-slate-800 tracking-tight mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span>⏰</span> Main-Thread Blocking Long Tasks
          </span>
          <span className="text-xs bg-slate-200 text-slate-600 font-bold px-2.5 py-1 rounded-full border border-slate-300/40">
            {longTasks.length} Detected
          </span>
        </h2>

        {longTasks.length === 0 ? (
          <div className="bg-emerald-50/50 border border-emerald-100/60 p-5 rounded-2xl text-xs text-emerald-700 text-center font-medium leading-relaxed">
            ❇️ <span className="font-bold">Fantastic!</span> No Main-Thread blocking tasks exceeding 50ms occurred during the diagnostic audit. The JavaScript thread execution stayed responsive.
          </div>
        ) : (
          <div className="bg-white/50 border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200/50">
                    <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Start Time</th>
                    <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Duration</th>
                    <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Overlap Correlated</th>
                    <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Details / Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {longTasks.map((task, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 text-xs text-slate-500 font-medium font-mono">
                        +{Math.round(task.startTime)} ms
                      </td>
                      <td className="p-3 text-xs font-bold text-pink-600 font-mono">
                        {Math.round(task.duration)} ms
                      </td>
                      <td className="p-3">
                        {task.interactionId ? (
                          <span className="text-[10px] bg-pink-50 border border-pink-100 text-pink-700 px-2 py-0.5 rounded-md font-bold">
                            ⚠️ Event Blocked
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-md font-semibold">
                            Background
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-xs text-slate-500 font-semibold max-w-[200px] truncate">
                        {task.source || 'Script compilation / Layout reflow'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
