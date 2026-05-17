import { h } from 'preact';
import { useAuditStore } from '../store/useAuditStore';

import { Printer, Smartphone, Monitor, Globe, Brain, AlertTriangle, Target, Flame, Clock } from './lucide';
export function MetricCards() {
  const activeResult = useAuditStore(s => s.activeResult);

  if (!activeResult) return null;

  const {
    id,
    url,
    profile,
    overallINP,
    score,
    worstInteraction,
    interactions = [],
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

  // Run dynamic heuristics diagnostics
  const analyzeHeuristics = (int) => {
    const issues = [];
    if (!int) return issues;

    const inputRatio = int.inputDelay / int.total;
    const procRatio = int.processingDuration / int.total;
    const presRatio = int.presentationDelay / int.total;

    if (int.inputDelay > 100 && inputRatio >= 0.40) {
      issues.push({
        title: 'Input Delay Bottleneck (Main Thread Busy)',
        description: `Input Delay represents ${Math.round(inputRatio * 100)}% of total interaction latency (${int.inputDelay} ms). This indicates the browser main thread was already fully occupied when the user clicked.`,
        advice: 'Reduce main-thread workload during early execution, defer non-essential scripts, or use scheduler.yield() to yield to user inputs.'
      });
    }

    if (int.processingDuration > 100 && procRatio >= 0.40) {
      issues.push({
        title: 'Heavy Event Listener Execution (Blocking JS)',
        description: `Event listener processing represents ${Math.round(procRatio * 100)}% of total interaction latency (${int.processingDuration} ms). The JavaScript callbacks triggered by this click are performing heavy synchronous operations.`,
        advice: 'Profile event callbacks, optimize event handler algorithms, and delegate heavy calculations to background Web Workers.'
      });
    }

    if (int.presentationDelay > 100 && presRatio >= 0.40) {
      issues.push({
        title: 'Rendering & Presentation Delay (Reflows & Paint)',
        description: `Presentation Delay represents ${Math.round(presRatio * 100)}% of total interaction latency (${int.presentationDelay} ms). The browser spent too long style recalculating, reflowing layouts, or paint drawing.`,
        advice: 'Avoid Forced Synchronous Layouts (layout thrashing) inside click handlers, batch DOM writes, and use CSS transitions.'
      });
    }

    return issues;
  };

  const heuristics = analyzeHeuristics(worstInteraction);

  return (
    <div className="space-y-6">
      {/* 1. Header Overview & Main Latency Glass Card */}
      <div className="backdrop-blur-md bg-white/45 border border-white/60 rounded-3xl p-6 shadow-[0_8px_32px_0_rgba(142,155,178,0.12)] animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6 pb-6 border-b border-slate-200/50">
          <div className="flex-1 min-w-0">
            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 text-[10px] bg-slate-200/60 text-slate-600 font-bold px-3 py-1.5 rounded-full border border-slate-300/40 uppercase tracking-wider">
                {profile === 'mobile' ? (
                  <>
                    <Smartphone className="h-3.5 w-3.5 text-slate-500" />
                    <span>Mobile Emulated (4G)</span>
                  </>
                ) : (
                  <>
                    <Monitor className="h-3.5 w-3.5 text-slate-500" />
                    <span>Desktop Emulated</span>
                  </>
                )}
              </span>
              
              {/* Scoring Banner */}
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${scoreInfo.colorClass} shadow-sm`}>
                <span className={`h-2 w-2 rounded-full ${scoreInfo.indicator} animate-pulse`} />
                {scoreInfo.label}
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              Interactive Diagnostics
            </h1>

            {/* Target URL Info Bar */}
            <div className="mt-2.5 flex items-center gap-2 bg-slate-50/80 border border-slate-200/40 p-2 px-3.5 rounded-2xl max-w-3xl">
              <Globe className="h-4 w-4 text-indigo-500 flex-shrink-0" />
              <span className="text-slate-400 text-xs select-none">Target URL:</span>
              <span className="font-mono text-xs text-indigo-600 font-semibold truncate select-all flex-1">
                {url}
              </span>
            </div>
          </div>
          
          {/* Action Row */}
          <div className="flex items-center justify-start lg:justify-end gap-3 flex-shrink-0">
            {/* Print Diagnostics Button */}
            <button 
              onClick={() => window.print()}
              className="px-5 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:from-violet-700 active:to-indigo-700 text-white text-xs font-bold rounded-2xl shadow-[0_4px_12px_rgba(99,102,241,0.2)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.35)] transition-all flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap cursor-pointer border-0"
            >
              <Printer className="h-4 w-4" />
              <span>Print Report</span>
            </button>
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
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex justify-between">
              <span>INP Phases Distribution</span>
              <span className="text-slate-600 font-semibold">Total: {worstInteraction?.total || 0} ms</span>
            </h3>

            {/* Interactive Stacked Progress Bar */}
            <div className="w-full h-7 rounded-2xl overflow-hidden flex shadow-inner border border-slate-200/50 bg-slate-100/50 mb-6">
              {inputPct > 0 && (
                <div 
                  className="bg-amber-400 h-full flex items-center justify-center text-[10px] font-bold text-amber-950 transition-all cursor-pointer hover:brightness-105"
                  style={{ width: `${inputPct}%` }}
                  title={`Input Delay: ${inputDelay}ms (${inputPct}%)`}
                >
                  {inputPct > 15 ? `${inputPct}%` : ''}
                </div>
              )}
              {processPct > 0 && (
                <div 
                  className="bg-pink-500 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all cursor-pointer hover:brightness-105"
                  style={{ width: `${processPct}%` }}
                  title={`Processing Duration: ${processingDuration}ms (${processPct}%)`}
                >
                  {processPct > 15 ? `${processPct}%` : ''}
                </div>
              )}
              {presentPct > 0 && (
                <div 
                  className="bg-emerald-400 h-full flex items-center justify-center text-[10px] font-bold text-emerald-950 transition-all cursor-pointer hover:brightness-105"
                  style={{ width: `${presentPct}%` }}
                  title={`Presentation Delay: ${presentationDelay}ms (${presentPct}%)`}
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

      {/* 2. Heuristics Diagnostics Panel */}
      {heuristics.length > 0 && (
        <div className="backdrop-blur-md bg-purple-50/20 border border-purple-100 rounded-3xl p-6 shadow-[0_8px_32px_0_rgba(168,85,247,0.06)] space-y-4">
          <h2 className="text-lg font-bold text-purple-900 tracking-tight flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <span>Root-Cause Heuristics Warnings</span>
          </h2>
          <div className="space-y-3">
            {heuristics.map((h, idx) => (
              <div key={idx} className="bg-white/80 border border-purple-100/60 rounded-2xl p-5 shadow-sm space-y-2">
                <div className="font-bold text-purple-950 text-sm flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <span>{h.title}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Diagnostic:</strong> {h.description}
                </p>
                <div className="bg-purple-50/80 border-l-4 border-purple-500 p-2.5 rounded-r-xl text-xs text-purple-950 font-medium">
                  <strong>Fix:</strong> {h.advice}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Worst Interaction Deep-dive */}
      {worstInteraction && (
        <div className="backdrop-blur-md bg-white/45 border border-white/60 rounded-3xl p-6 shadow-[0_8px_32px_0_rgba(142,155,178,0.12)]">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-600" />
            <span>Slowest Event Deep-Dive</span>
          </h2>

          <div className="bg-white/50 border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            {/* Action Meta Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Event Trigger</span>
                <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-lg border border-pink-100 mt-1 inline-block uppercase">
                  {worstInteraction.type}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Latency</span>
                <span className="text-xs font-bold text-slate-700 mt-1 inline-block">
                  {worstInteraction.total} ms
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
                <span className={`text-xs font-bold mt-1 inline-block uppercase ${
                  worstInteraction.total <= 200 ? 'text-emerald-600' : worstInteraction.total <= 500 ? 'text-amber-600' : 'text-pink-600'
                }`}>
                  {worstInteraction.total <= 200 ? 'Good' : worstInteraction.total <= 500 ? 'Needs Imp.' : 'Poor'}
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
            {worstInteraction.targetHtmlSnippet && (
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">DOM Node Source Markup</span>
                <pre className="text-[10.5px] font-mono bg-slate-950 text-slate-300 border border-slate-900 p-3 rounded-xl overflow-x-auto leading-relaxed shadow-inner">
                  <code>{worstInteraction.targetHtmlSnippet}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Visual Interaction Selector Heatmap */}
      <div className="backdrop-blur-md bg-white/45 border border-white/60 rounded-3xl p-6 shadow-[0_8px_32px_0_rgba(142,155,178,0.12)]">
        <h2 className="text-lg font-bold text-slate-800 tracking-tight mb-4 flex items-center gap-2">
          <Flame className="h-5 w-5 text-pink-500" />
          <span>Interaction Selector Latency Heatmap</span>
        </h2>
        
        {interactions.length === 0 ? (
          <div className="text-slate-500 text-xs text-center py-4">No interactions recorded.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interactions.map((int, idx) => {
              const isGood = int.total <= 200;
              const isNeedsImp = int.total <= 500;
              const heatClass = isGood 
                ? 'bg-emerald-50/40 border-emerald-100 text-emerald-800 shadow-emerald-50' 
                : isNeedsImp 
                  ? 'bg-amber-50/40 border-amber-100 text-amber-800 shadow-amber-50' 
                  : 'bg-pink-50/40 border-pink-100 text-pink-800 shadow-pink-50';

              const heatBadge = isGood ? 'bg-emerald-500' : isNeedsImp ? 'bg-amber-500' : 'bg-pink-500';

              return (
                <div key={idx} className={`border rounded-2xl p-4 shadow-sm transition-all hover:scale-[1.01] flex flex-col justify-between ${heatClass}`}>
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/60 border border-current/10">
                        {int.type}
                      </span>
                      <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full text-white ${heatBadge}`}>
                        {int.total} ms
                      </span>
                    </div>
                    <div className="text-xs font-mono bg-white/50 border border-current/5 px-2.5 py-1.5 rounded-xl truncate select-all mb-2">
                      {int.selector}
                    </div>
                  </div>
                  <div className="space-y-1 mt-1">
                    {int.targetText && (
                      <div className="text-[10px] font-semibold opacity-75 truncate">
                        Inner Text: "{int.targetText}"
                      </div>
                    )}
                    <div className="flex gap-3 text-[9px] font-bold opacity-60">
                      <span>IN: {int.inputDelay}ms</span>
                      <span>PROC: {int.processingDuration}ms</span>
                      <span>PRES: {int.presentationDelay}ms</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Main-Thread Long Tasks Table */}
      <div className="backdrop-blur-md bg-white/45 border border-white/60 rounded-3xl p-6 shadow-[0_8px_32px_0_rgba(142,155,178,0.12)]">
        <h2 className="text-lg font-bold text-slate-800 tracking-tight mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-pink-500" />
            <span>Main-Thread Blocking Long Tasks</span>
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
