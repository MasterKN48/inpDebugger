import { h } from 'preact';
import { BackgroundBlobs } from './components/BackgroundBlobs';
import { AuditForm } from './components/AuditForm';
import { LiveProgress } from './components/LiveProgress';
import { AuditHistory } from './components/AuditHistory';
import { MetricCards } from './components/MetricCards';
import { BottleneckTable } from './components/BottleneckTable';
import { useAuditStore } from './store/useAuditStore';
import { useAnimatedFavicon } from './hooks/useAnimatedFavicon';

export function App() {
  // Start the dynamically pulsing neon lightning bolt favicon in the browser tab
  useAnimatedFavicon();

  const activeResult = useAuditStore(s => s.activeResult);
  const jobStatus = useAuditStore(s => s.jobStatus);

  const isRunning = jobStatus === 'running' || jobStatus === 'pending';

  return (
    <div className="min-h-screen relative font-sans text-slate-800 antialiased">
      {/* Dynamic Ambient Background Blobs */}
      <BackgroundBlobs />

      {/* Main Container Layout */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 md:py-10 space-y-8 animate-fade-in">
        {/* Global Glassmorphic Header */}
        <header className="backdrop-blur-md bg-white/45 border border-white/60 rounded-3xl p-5 md:p-6 shadow-[0_8px_32px_0_rgba(142,155,178,0.12)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Premium intensely glowing hollow neon lightning bolt icon */}
            <div className="h-10 w-10 rounded-xl bg-slate-950 flex items-center justify-center border border-lime-400/40 relative overflow-hidden group shadow-[0_0_20px_rgba(163,230,53,0.35),inset_0_0_10px_rgba(163,230,53,0.15)] transition-all duration-300 hover:border-lime-400/60 hover:shadow-[0_0_28px_rgba(163,230,53,0.5),inset_0_0_12px_rgba(163,230,53,0.25)]">
              <div className="absolute inset-0 bg-gradient-to-tr from-lime-400/25 to-transparent opacity-60 group-hover:opacity-95 transition-opacity duration-300"></div>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#bef264" 
                strokeWidth="2.8" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-5 h-5 drop-shadow-[0_0_8px_rgba(163,230,53,1)] relative z-10 animate-pulse"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-extrabold tracking-tight text-slate-800 flex items-center gap-1.5">
                INP Debugger <span className="text-[10px] bg-slate-200/60 text-slate-500 font-bold px-2 py-0.5 rounded border border-slate-300/30 uppercase tracking-widest">v1.0.0</span>
              </h1>
              <p className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                Automated Interaction to Next Paint Diagnostic Workspace
              </p>
            </div>
          </div>

          {/* Engine Status Badge */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isRunning ? 'bg-pink-400' : 'bg-emerald-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isRunning ? 'bg-pink-500' : 'bg-emerald-500'}`}></span>
            </span>
            <span className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider">
              {isRunning ? 'Auditing Engine Active' : 'Measurement Engine Standby'}
            </span>
          </div>
        </header>

        {/* Workspace split grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Runs history sidebar (4 cols on large screens, ordered last on mobile) */}
          <aside className="lg:col-span-4 h-full order-2 lg:order-1">
            <AuditHistory />
          </aside>

          {/* Right Column: Work area & diagnostics (8 cols on large screens, ordered first on mobile) */}
          <main className="lg:col-span-8 space-y-8 order-1 lg:order-2">
            {/* Audit submission form */}
            <AuditForm />

            {/* Live active progress stepper */}
            <LiveProgress />

            {/* Hydrated run results dashboard */}
            <MetricCards />

            {/* Aggregated URL selector bottlenecks */}
            <BottleneckTable />
          </main>
        </div>
      </div>
    </div>
  );
}
