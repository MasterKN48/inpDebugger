import { useState } from 'preact/hooks';
import { useAuditStore } from '../store/useAuditStore';

export function AuditForm() {
  const [url, setUrl] = useState('');
  const triggerAudit = useAuditStore(s => s.triggerAudit);
  const deviceProfile = useAuditStore(s => s.deviceProfile);
  const setDeviceProfile = useAuditStore(s => s.setDeviceProfile);
  const jobStatus = useAuditStore(s => s.jobStatus);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url) return;
    
    // Automatically prepend https:// if the user typed a plain domain
    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }
    
    triggerAudit(finalUrl);
  };

  const isRunning = jobStatus === 'running' || jobStatus === 'pending';

  return (
    <div className="backdrop-blur-md bg-white/45 border border-white/60 rounded-3xl p-6 shadow-[0_8px_32px_0_rgba(142,155,178,0.12)]">
      <h2 className="text-xl font-semibold text-slate-800 mb-4 tracking-tight flex items-center gap-2.5">
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
        Start New Diagnostics Run
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* URL Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Target Website URL
          </label>
          <input
            type="text"
            value={url}
            onInput={(e) => setUrl(e.target.value)}
            disabled={isRunning}
            placeholder="e.g. shop.example.com or https://mywebsite.org"
            className="w-full bg-white/50 border border-slate-200 focus:border-slate-400 rounded-2xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-pink-100 transition-all text-sm font-medium"
          />
        </div>

        {/* Configuration grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Device Profile Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Device Emulation Profile
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50">
              <button
                type="button"
                disabled={isRunning}
                onClick={() => setDeviceProfile('desktop')}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  deviceProfile === 'desktop'
                    ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                🖥️ Desktop
              </button>
              <button
                type="button"
                disabled={isRunning}
                onClick={() => setDeviceProfile('mobile')}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  deviceProfile === 'mobile'
                    ? 'bg-white text-pink-600 shadow-sm border border-pink-100'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                📱 Mobile (4G CPU Throttled)
              </button>
            </div>
          </div>

          {/* Core Web Vitals Standard Note */}
          <div className="flex flex-col justify-end">
            <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-2xl text-[11px] text-slate-500 font-medium leading-relaxed">
              👉 <span className="font-bold text-slate-700">INP Audit Standard</span>: Simulates multiple automated DOM clicks, forms typing, and accordion toggles while correlating active Main-Thread Long Tasks.
            </div>
          </div>
        </div>

        {/* Trigger Button */}
        <button
          type="submit"
          disabled={isRunning || !url}
          className={`w-full py-3.5 px-6 rounded-2xl text-sm font-bold text-white shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer ${
            isRunning 
              ? 'bg-slate-400 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:from-emerald-600 active:to-teal-600 shadow-emerald-200/50 hover:shadow-xl hover:shadow-emerald-200/70'
          }`}
        >
          {isRunning ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Orchestrating Chromium Audit...
            </span>
          ) : (
            <span>🚀 Run Interactive Diagnostic Audit</span>
          )}
        </button>
      </form>
    </div>
  );
}
