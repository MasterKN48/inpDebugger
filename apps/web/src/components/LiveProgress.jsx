import { h } from 'preact';
import { useAuditStore } from '../store/useAuditStore';

export function LiveProgress() {
  const jobProgress = useAuditStore(s => s.jobProgress);
  const jobStatus = useAuditStore(s => s.jobStatus);
  const errorMsg = useAuditStore(s => s.errorMsg);
  const clearActiveJob = useAuditStore(s => s.clearActiveJob);

  if (jobStatus === 'idle') return null;

  // Map progress phases to human-readable steps
  const steps = [
    { key: 'initialized', title: 'Initialization', desc: 'Registering background job queue' },
    { key: 'context_setup', title: 'Browser Emulation', desc: 'Configuring Chromium context' },
    { key: 'navigating', title: 'Site Navigation', desc: 'Loading document object model' },
    { key: 'discovery', title: 'Interaction Discovery', desc: 'Scanning targets and inputs' },
    { key: 'replaying', title: 'Automated Replays', desc: 'Simulating user interaction script' },
    { key: 'processing', title: 'Main-Thread Diagnostic', desc: 'Correlating active long tasks' }
  ];

  // Determine the active phase
  const latestUpdate = jobProgress[jobProgress.length - 1] || {};
  const activePhase = latestUpdate.phase || 'initialized';

  // Helper to determine step status
  const getStepStatus = (stepKey, currentIndex) => {
    const activeIndex = steps.findIndex(s => s.key === activePhase);
    
    if (jobStatus === 'failed') return 'failed';
    if (stepKey === activePhase) return 'active';
    if (activeIndex > currentIndex) return 'completed';
    return 'pending';
  };

  return (
    <div className="backdrop-blur-md bg-white/45 border border-white/60 rounded-3xl p-6 shadow-[0_8px_32px_0_rgba(142,155,178,0.12)]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 tracking-tight flex items-center gap-2">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#eab308" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="w-5 h-5 drop-shadow-[0_0_4px_rgba(234,179,8,0.7)] animate-pulse"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Automated Auditing Engine
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Running Chromium headless session in the background...
          </p>
        </div>
        {jobStatus === 'failed' && (
          <button 
            onClick={clearActiveJob}
            className="text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-200/50 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        )}
      </div>

      {errorMsg ? (
        <div className="bg-pink-50/70 border border-pink-100/80 p-4 rounded-2xl text-sm font-semibold text-pink-700 leading-relaxed shadow-sm">
          ❌ <span className="font-extrabold">Audit Error:</span> {errorMsg}
          <div className="text-[11px] text-pink-500 font-medium mt-2">
            The measurement engine could not start or complete. Please check the target URL structure, secure port availability, or local connection configs.
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Log Banner */}
          <div className="bg-slate-50/80 border border-slate-200/50 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div className="text-xs font-bold text-slate-700">
                Current Activity: <span className="text-slate-500 font-semibold italic">"{latestUpdate.message || 'Queued in background'}"</span>
              </div>
            </div>
            {latestUpdate.current !== undefined && (
              <span className="text-[10px] bg-pink-100 text-pink-700 font-bold px-2.5 py-1 rounded-full border border-pink-200">
                Action {latestUpdate.current} / {latestUpdate.total}
              </span>
            )}
          </div>

          {/* Stepper Timeline */}
          <div className="relative pl-6 space-y-6 border-l border-slate-200/60 ml-3">
            {steps.map((step, idx) => {
              const status = getStepStatus(step.key, idx);
              
              return (
                <div key={step.key} className="relative group">
                  {/* Stepper Indicator Dot */}
                  <span className={`absolute -left-[31px] top-0.5 flex items-center justify-center rounded-full h-4 w-4 border transition-all ${
                    status === 'completed'
                      ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_8px_0_rgba(16,185,129,0.3)]'
                      : status === 'active'
                      ? 'bg-white border-pink-500 shadow-[0_0_12px_0_rgba(244,63,94,0.4)] animate-pulse scale-110'
                      : status === 'failed'
                      ? 'bg-pink-600 border-pink-500 text-white'
                      : 'bg-white border-slate-300'
                  }`}>
                    {status === 'completed' && (
                      <svg className="h-2 w-2" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>

                  {/* Stepper text content */}
                  <div>
                    <h4 className={`text-xs font-bold transition-colors ${
                      status === 'completed'
                        ? 'text-emerald-700'
                        : status === 'active'
                        ? 'text-pink-600'
                        : 'text-slate-400'
                    }`}>
                      {step.title}
                    </h4>
                    <p className={`text-[11px] font-medium transition-colors ${
                      status === 'active' ? 'text-slate-600' : 'text-slate-400'
                    }`}>
                      {step.desc}
                    </p>

                    {/* Selector Badge for Active Replays */}
                    {status === 'active' && latestUpdate.activeSelector && (
                      <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-pink-50 border border-pink-100 text-[10px] font-bold text-pink-700 shadow-sm animate-fade-in">
                        <span className="text-xs">🎯</span> Target element: <code className="bg-white px-1.5 py-0.5 rounded border border-pink-200 text-pink-600 font-mono text-[9px]">{latestUpdate.activeSelector}</code>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
