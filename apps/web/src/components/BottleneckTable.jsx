import { h } from 'preact';
import { useAuditStore } from '../store/useAuditStore';

const latencyClass = (avg) => {
  if (avg <= 200) return 'badge badge--good';
  if (avg <= 500) return 'badge badge--warning';
  return 'badge badge--poor';
};

export function BottleneckTable() {
  const analytics    = useAuditStore(s => s.analytics);
  const activeResult = useAuditStore(s => s.activeResult);

  if (!activeResult || !analytics?.bottlenecks?.length) return null;

  return (
    <div className="glass-card">
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <h3
          style={{
            margin: 0,
            fontSize: 'var(--fs-sm)',
            fontWeight: 'var(--fw-bold)',
            color: 'var(--accent-vivid)',
            textTransform: 'uppercase',
            letterSpacing: 'var(--ls-wider)',
          }}
        >
          📈 Persistent Slow Selector Bottlenecks
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: 'var(--fs-xs)', color: 'var(--accent-light)', opacity: 0.8 }}>
          Aggregated target selector latencies across all audits for this host URL.
        </p>
      </div>

      <div
        style={{
          background: 'var(--surface-raised)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Slow CSS Selector Target</th>
                <th style={{ textAlign: 'center' }}>Frequency</th>
                <th style={{ textAlign: 'right' }}>Avg INP Latency</th>
              </tr>
            </thead>
            <tbody>
              {analytics.bottlenecks.map((b, idx) => (
                <tr key={idx}>
                  <td>
                    <code className="code-surface" style={{ display: 'block', maxWidth: '18rem', fontSize: 'var(--fs-2xs)' }}>
                      {b.selector}
                    </code>
                  </td>
                  <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 'var(--fw-bold)', color: 'var(--accent-color)' }}>
                    {b.occurrences} runs
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={latencyClass(b.averageLatency)} style={{ fontFamily: 'var(--font-mono)' }}>
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
