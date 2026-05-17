import { h } from 'preact';
import { useAuditStore } from '../store/useAuditStore';

export function BottleneckTable() {
  const analytics = useAuditStore(s => s.analytics);
  const activeResult = useAuditStore(s => s.activeResult);

  if (!activeResult || !analytics || !analytics.bottlenecks || analytics.bottlenecks.length === 0) {
    return null;
  }

  const getLatencyColorClass = (avg) => {
    if (avg <= 200) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (avg <= 500) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-pink-600 bg-pink-50 border-pink-100';
  };

  return (
    <div className="backdrop-blur-md bg-white/45 border border-white/60 rounded-3xl p-6 shadow-[0_8px_32px_0_rgba(142,155,178,0.12)]">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight uppercase tracking-wider block">
          📈 Persistent Slow Selector Bottlenecks
        </h3>
        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
          Aggregated target selector latencies across all audits for this host URL.
        </p>
      </div>

      <div className="bg-white/50 border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200/50">
                <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Slow CSS Selector Target</th>
                <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Frequency</th>
                <th className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Avg INP Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics.bottlenecks.map((b, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3">
                    <code className="text-[10.5px] font-mono bg-slate-900 text-pink-200 border border-slate-800 px-2.5 py-1.5 rounded-xl block max-w-[280px] md:max-w-md overflow-x-auto shadow-inner">
                      {b.selector}
                    </code>
                  </td>
                  <td className="p-3 text-xs font-bold text-slate-600 text-center font-mono">
                    {b.occurrences} runs
                  </td>
                  <td className="p-3 text-right">
                    <span className={`inline-block px-2.5 py-1 rounded-xl border text-xs font-extrabold font-mono ${getLatencyColorClass(b.averageLatency)}`}>
                      {Math.round(b.averageLatency)} ms
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
