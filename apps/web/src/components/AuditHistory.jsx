import { useEffect } from 'preact/hooks';
import { useAuditStore } from '../store/useAuditStore';

/** Returns INP-score color CSS variable name */
const scoreColor = (inp) => {
  if (inp <= 200) return 'var(--color-good)';
  if (inp <= 500) return 'var(--color-warning)';
  return 'var(--color-poor)';
};

/** Returns the status dot class for the history list */
const getScoreDotClass = (score) => {
  switch (score) {
    case 'good':             return 'status-dot status-dot--good';
    case 'needs-improvement': return 'status-dot status-dot--warning';
    case 'poor':
    default:                  return 'status-dot status-dot--poor';
  }
};

export function AuditHistory() {
  const history      = useAuditStore(s => s.history);
  const fetchHistory = useAuditStore(s => s.fetchHistory);
  const loadResult   = useAuditStore(s => s.loadResult);
  const deleteResult = useAuditStore(s => s.deleteResult);
  const activeResult = useAuditStore(s => s.activeResult);
  const jobStatus    = useAuditStore(s => s.jobStatus);

  useEffect(() => { fetchHistory(); }, []);

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
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
          📜 Diagnostic Audit History
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: 'var(--fs-xs)', color: 'var(--accent-light)', opacity: 0.8 }}>
          Load past Chromium execution runs and database captures.
        </p>
      </div>

      {/* Empty State */}
      {history.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: 'var(--space-6)',
            background: 'var(--surface-raised)',
            border: '1px dashed var(--line-color)',
            borderRadius: 'var(--radius-xl)',
            minHeight: '14rem',
            gap: 'var(--space-2)',
          }}
        >
          <span style={{ fontSize: '2rem', opacity: 0.5 }}>📂</span>
          <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--accent-light)' }}>
            No Audits Saved Yet
          </span>
          <span
            style={{
              fontSize: 'var(--fs-2xs)',
              color: 'var(--accent-light)',
              opacity: 0.7,
              maxWidth: '10rem',
              lineHeight: 'var(--lh-relaxed)',
            }}
          >
            Trigger a URL analysis to persist your first detailed diagnostics run.
          </span>
        </div>
      ) : (
        /* History List */
        <div
          className="scrollbar-thin"
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
            maxHeight: '30rem',
            paddingRight: '4px',
          }}
        >
          {history.map((run) => {
            const isActive = activeResult?.id === run.id;
            return (
              <div
                key={run.id}
                id={`history-item-${run.id}`}
                role="button"
                tabIndex={0}
                onClick={() => jobStatus !== 'running' && loadResult(run.id)}
                onKeyDown={(e) => e.key === 'Enter' && jobStatus !== 'running' && loadResult(run.id)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-xl)',
                  border: isActive
                    ? '1px solid var(--color-good-border)'
                    : '1px solid var(--border-subtle)',
                  background: isActive
                    ? 'rgba(255, 255, 255, 0.85)'
                    : 'var(--surface-raised)',
                  boxShadow: isActive ? 'var(--shadow-raised)' : 'none',
                  cursor: jobStatus === 'running' ? 'not-allowed' : 'pointer',
                  transition: 'all var(--duration-base) var(--ease-snappy)',
                  outline: 'none',
                }}
                className="history-row"
              >
                {/* Score Dot + URL */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', overflow: 'hidden', flex: 1 }}>
                  <span className={getScoreDotClass(run.score)} />
                  <div style={{ overflow: 'hidden' }}>
                    <span
                      style={{
                        display: 'block',
                        fontSize: 'var(--fs-xs)',
                        fontWeight: 'var(--fw-bold)',
                        color: 'var(--accent-vivid)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {run.url.replace(/^https?:\/\//i, '')}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 'var(--space-1)',
                        fontSize: 'var(--fs-2xs)',
                        color: 'var(--accent-light)',
                        fontWeight: 'var(--fw-semibold)',
                        marginTop: '2px',
                      }}
                    >
                      <span>{run.profile === 'mobile' ? '📱 Mobile' : '🖥️ Desktop'}</span>
                      <span style={{ color: 'var(--line-color)' }}>•</span>
                      <span>
                        {new Date(run.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </span>
                  </div>
                </div>

                {/* INP + Delete */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}
                  className="history-row-actions"
                >
                  <span
                    style={{
                      fontSize: 'var(--fs-xs)',
                      fontWeight: 'var(--fw-extrabold)',
                      fontFamily: 'var(--font-mono)',
                      color: scoreColor(run.overallINP),
                    }}
                  >
                    {run.overallINP}ms
                  </span>
                  <button
                    id={`btn-delete-run-${run.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete run result for ${run.url}?`)) deleteResult(run.id);
                    }}
                    title="Delete record"
                    style={{
                      opacity: 0,
                      padding: 'var(--space-1)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid transparent',
                      background: 'transparent',
                      color: 'var(--accent-light)',
                      cursor: 'pointer',
                      transition: 'all var(--duration-fast) var(--ease-snappy)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    className="delete-btn"
                  >
                    <svg style={{ width: '0.875rem', height: '0.875rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* History row hover styles (scoped inline) */}
      <style>{`
        .history-row:hover { background: rgba(255, 255, 255, 0.75) !important; border-color: var(--border-strong) !important; }
        .history-row:hover .delete-btn { opacity: 1 !important; }
        .delete-btn:hover { color: var(--color-poor-text) !important; background: var(--color-poor-light) !important; border-color: var(--color-poor-border) !important; }
      `}</style>
    </div>
  );
}
