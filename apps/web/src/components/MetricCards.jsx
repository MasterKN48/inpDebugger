import { h } from 'preact';
import { useAuditStore } from '../store/useAuditStore';
import { Printer, Smartphone, Monitor, Globe, Brain, AlertTriangle, Target, Flame, Clock } from './lucide';

const getScoreInfo = (s) => {
  switch (s) {
    case 'good': return {
      label: 'Good Performance',
      badgeClass: 'badge badge--good',
      dotClass: 'status-dot status-dot--good',
      textColor: 'var(--color-good)',
    };
    case 'needs-improvement': return {
      label: 'Needs Improvement',
      badgeClass: 'badge badge--warning',
      dotClass: 'status-dot status-dot--warning',
      textColor: 'var(--color-warning)',
    };
    case 'poor':
    default: return {
      label: 'Poor Performance',
      badgeClass: 'badge badge--poor',
      dotClass: 'status-dot status-dot--poor',
      textColor: 'var(--color-poor)',
    };
  }
};

const inpColor = (ms) => {
  if (ms <= 200) return 'var(--color-good)';
  if (ms <= 500) return 'var(--color-warning)';
  return 'var(--color-poor)';
};

const analyzeHeuristics = (int) => {
  const issues = [];
  if (!int) return issues;
  const inputRatio = int.inputDelay / int.total;
  const procRatio  = int.processingDuration / int.total;
  const presRatio  = int.presentationDelay / int.total;
  if (int.inputDelay > 100 && inputRatio >= 0.40)
    issues.push({
      title: 'Input Delay Bottleneck (Main Thread Busy)',
      description: `Input Delay represents ${Math.round(inputRatio * 100)}% of total interaction latency (${int.inputDelay} ms). The browser main thread was already fully occupied when the user clicked.`,
      advice: 'Reduce main-thread workload, defer non-essential scripts, or use scheduler.yield() to yield to user inputs.',
    });
  if (int.processingDuration > 100 && procRatio >= 0.40)
    issues.push({
      title: 'Heavy Event Listener Execution (Blocking JS)',
      description: `Event listener processing represents ${Math.round(procRatio * 100)}% of total interaction latency (${int.processingDuration} ms). The JavaScript callbacks are performing heavy synchronous operations.`,
      advice: 'Profile event callbacks, optimize handler algorithms, and delegate heavy calculations to background Web Workers.',
    });
  if (int.presentationDelay > 100 && presRatio >= 0.40)
    issues.push({
      title: 'Rendering & Presentation Delay (Reflows & Paint)',
      description: `Presentation Delay represents ${Math.round(presRatio * 100)}% of total interaction latency (${int.presentationDelay} ms). The browser spent too long on style recalculation, reflow, or paint.`,
      advice: 'Avoid Forced Synchronous Layouts inside click handlers, batch DOM writes, and use CSS transitions.',
    });
  return issues;
};

export function MetricCards() {
  const activeResult = useAuditStore(s => s.activeResult);
  if (!activeResult) return null;

  const { url, profile, overallINP, score, worstInteraction, interactions = [], longTasks = [] } = activeResult;
  const scoreInfo  = getScoreInfo(score);
  const heuristics = analyzeHeuristics(worstInteraction);

  const inputDelay         = worstInteraction?.inputDelay || 0;
  const processingDuration = worstInteraction?.processingDuration || 0;
  const presentationDelay  = worstInteraction?.presentationDelay || 0;
  const totalWorst         = inputDelay + processingDuration + presentationDelay || 1;
  const inputPct   = Math.round((inputDelay / totalWorst) * 100);
  const processPct = Math.round((processingDuration / totalWorst) * 100);
  const presentPct = 100 - inputPct - processPct;

  const S = { // spacing shorthand
    gap2: { display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' },
    row:  { display: 'flex', alignItems: 'center', gap: 'var(--space-2)' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

      {/* ── 1. Overview & INP Glass Card ── */}
      <div className="glass-card animate-fade-in">
        <div style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start',
          justifyContent: 'space-between', gap: 'var(--space-6)',
          paddingBottom: 'var(--space-6)', marginBottom: 'var(--space-6)',
          borderBottom: '1px solid var(--line-color)',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <span className="badge badge--neutral" style={{ gap: 'var(--space-1)' }}>
                {profile === 'mobile'
                  ? <><Smartphone style={{ width: '0.875rem', height: '0.875rem' }} /><span>Mobile Emulated (4G)</span></>
                  : <><Monitor style={{ width: '0.875rem', height: '0.875rem' }} /><span>Desktop Emulated</span></>
                }
              </span>
              <div className={scoreInfo.badgeClass} style={{ gap: 'var(--space-1)' }}>
                <span className={scoreInfo.dotClass} style={{ animation: 'neon-pulse 2s ease-in-out infinite' }} />
                {scoreInfo.label}
              </div>
            </div>

            <h1 style={{ margin: 0, fontSize: 'var(--fs-display)', fontWeight: 'var(--fw-black)', color: 'var(--accent-vivid)', letterSpacing: 'var(--ls-tight)' }}>
              Interactive Diagnostics
            </h1>

            {/* URL Bar */}
            <div style={{
              marginTop: 'var(--space-3)',
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              background: 'var(--surface-inset)', border: '1px solid var(--border-subtle)',
              padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-xl)', maxWidth: '48rem',
            }}>
              <Globe style={{ width: '1rem', height: '1rem', color: '#6366f1', flexShrink: 0 }} />
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent-light)', userSelect: 'none' }}>Target URL:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)', color: '#6366f1', fontWeight: 'var(--fw-semibold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, userSelect: 'all' }}>
                {url}
              </span>
            </div>
          </div>

          {/* Print Button */}
          <div>
            <button
              id="btn-print-report"
              onClick={() => window.print()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
                padding: 'var(--space-3) var(--space-5)',
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                color: '#fff', border: 'none', borderRadius: 'var(--radius-xl)',
                fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-bold)',
                boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
                cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all var(--duration-base) var(--ease-spring)',
              }}
              className="hide-print"
            >
              <Printer style={{ width: '1rem', height: '1rem' }} />
              Print Report
            </button>
          </div>
        </div>

        {/* Key Numbers Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-6)' }}>
          {/* Overall INP */}
          <div className="inner-panel" style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 'var(--fs-2xs)', fontWeight: 'var(--fw-bold)', color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wider)', display: 'block', marginBottom: 'var(--space-2)' }}>
              Overall INP
            </span>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '2px' }}>
              <span style={{ fontSize: '3rem', fontWeight: 'var(--fw-extrabold)', letterSpacing: 'var(--ls-tighter)', color: scoreInfo.textColor, lineHeight: 1 }}>
                {overallINP}
              </span>
              <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--accent-light)', paddingBottom: '4px' }}>ms</span>
            </div>
            <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--accent-light)', marginTop: 'var(--space-2)', display: 'block' }}>
              Maximum observed user interaction latency.
            </span>
          </div>

          {/* INP Phase Breakdown */}
          <div className="inner-panel" style={{ gridColumn: 'span 2' }}>
            <h3 style={{
              margin: '0 0 var(--space-4)',
              fontSize: 'var(--fs-2xs)', fontWeight: 'var(--fw-bold)',
              color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wider)',
              display: 'flex', justifyContent: 'space-between',
            }}>
              <span>INP Phases Distribution</span>
              <span style={{ color: 'var(--accent-color)', fontWeight: 'var(--fw-semibold)' }}>
                Total: {worstInteraction?.total || 0} ms
              </span>
            </h3>

            {/* Stacked Progress Bar */}
            <div className="progress-bar-track" style={{ marginBottom: 'var(--space-5)' }}>
              {inputPct > 0 && (
                <div
                  className="progress-bar-segment progress-bar-segment--input"
                  style={{ width: `${inputPct}%` }}
                  title={`Input Delay: ${inputDelay}ms (${inputPct}%)`}
                >
                  {inputPct > 15 ? `${inputPct}%` : ''}
                </div>
              )}
              {processPct > 0 && (
                <div
                  className="progress-bar-segment progress-bar-segment--process"
                  style={{ width: `${processPct}%` }}
                  title={`Processing Duration: ${processingDuration}ms (${processPct}%)`}
                >
                  {processPct > 15 ? `${processPct}%` : ''}
                </div>
              )}
              {presentPct > 0 && (
                <div
                  className="progress-bar-segment progress-bar-segment--present"
                  style={{ width: `${presentPct}%` }}
                  title={`Presentation Delay: ${presentationDelay}ms (${presentPct}%)`}
                >
                  {presentPct > 15 ? `${presentPct}%` : ''}
                </div>
              )}
            </div>

            {/* Legend */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center' }}>
              {[
                { label: 'Input Delay',  color: '#fbbf24', value: inputDelay },
                { label: 'Processing',   color: 'var(--color-active)', value: processingDuration },
                { label: 'Presentation', color: 'var(--color-good)',   value: presentationDelay },
              ].map((p, i) => (
                <div key={i} style={{ borderRight: i < 2 ? '1px solid var(--line-color)' : 'none' }}>
                  <span style={{ display: 'inline-block', width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: p.color, marginRight: '4px', verticalAlign: 'middle' }} />
                  <span style={{ fontSize: 'var(--fs-2xs)', fontWeight: 'var(--fw-bold)', color: 'var(--accent-light)', textTransform: 'uppercase', display: 'block' }}>{p.label}</span>
                  <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--accent-vivid)' }}>{p.value} ms</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Heuristics Panel ── */}
      {heuristics.length > 0 && (
        <div style={{
          background: 'rgba(245, 243, 255, 0.5)', border: '1px solid rgba(168,85,247,0.15)',
          borderRadius: 'var(--radius-3xl)', padding: 'var(--space-6)',
          boxShadow: '0 8px 32px 0 rgba(168,85,247,0.07)',
          display: 'flex', flexDirection: 'column', gap: 'var(--space-4)',
          backdropFilter: 'var(--blur-light)',
        }}>
          <h2 style={{ margin: 0, fontSize: 'var(--fs-lg)', fontWeight: 'var(--fw-bold)', color: '#3b0764', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', letterSpacing: 'var(--ls-tight)' }}>
            <Brain style={{ width: '1.25rem', height: '1.25rem', color: '#7c3aed' }} />
            Root-Cause Heuristics Warnings
          </h2>
          {heuristics.map((h, idx) => (
            <div key={idx} className="heuristic-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontWeight: 'var(--fw-bold)', color: '#3b0764', fontSize: 'var(--fs-sm)' }}>
                <AlertTriangle style={{ width: '1rem', height: '1rem', color: 'var(--color-poor)', flexShrink: 0 }} />
                {h.title}
              </div>
              <p style={{ margin: 0, fontSize: 'var(--fs-xs)', color: 'var(--accent-color)', lineHeight: 'var(--lh-relaxed)' }}>
                <strong>Diagnostic:</strong> {h.description}
              </p>
              <div className="heuristic-fix">
                <strong>Fix:</strong> {h.advice}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 3. Worst Interaction Deep-Dive ── */}
      {worstInteraction && (
        <div className="glass-card">
          <h2 className="section-heading">
            <Target style={{ width: '1.25rem', height: '1.25rem', color: '#6366f1' }} />
            Slowest Event Deep-Dive
          </h2>
          <div className="inner-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Meta Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--space-4)', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--line-color)' }}>
              {[
                { label: 'Event Trigger', value: worstInteraction.type, mono: false, highlight: true },
                { label: 'Total Latency', value: `${worstInteraction.total} ms`, mono: true, highlight: false },
                { label: 'Document Load State', value: worstInteraction.loadState || 'Loaded', mono: false, highlight: false },
                { label: 'Interaction Score', value: worstInteraction.total <= 200 ? 'Good' : worstInteraction.total <= 500 ? 'Needs Imp.' : 'Poor', mono: false, color: inpColor(worstInteraction.total) },
              ].map((m, i) => (
                <div key={i}>
                  <span style={{ fontSize: 'var(--fs-2xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wider)', display: 'block' }}>{m.label}</span>
                  <span style={{
                    display: 'inline-block', marginTop: '4px',
                    fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-bold)',
                    fontFamily: m.mono ? 'var(--font-mono)' : 'inherit',
                    color: m.color || (m.highlight ? 'var(--color-poor-text)' : 'var(--accent-vivid)'),
                    background: m.highlight ? 'var(--color-poor-light)' : 'transparent',
                    padding: m.highlight ? '2px 8px' : 0,
                    borderRadius: m.highlight ? 'var(--radius-md)' : 0,
                    border: m.highlight ? '1px solid var(--color-poor-border)' : 'none',
                    textTransform: m.highlight ? 'uppercase' : 'none',
                  }}>{m.value}</span>
                </div>
              ))}
            </div>
            {/* CSS Selector */}
            <div>
              <span style={{ fontSize: 'var(--fs-2xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wider)', display: 'block', marginBottom: 'var(--space-1)' }}>Target CSS Selector</span>
              <code className="code-surface" style={{ display: 'block' }}>{worstInteraction.selector}</code>
            </div>
            {/* HTML Snippet */}
            {worstInteraction.targetHtmlSnippet && (
              <div>
                <span style={{ fontSize: 'var(--fs-2xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wider)', display: 'block', marginBottom: 'var(--space-1)' }}>DOM Node Source Markup</span>
                <pre className="code-surface" style={{ color: '#cbd5e1', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  <code>{worstInteraction.targetHtmlSnippet}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 4. Interaction Heatmap ── */}
      <div className="glass-card">
        <h2 className="section-heading">
          <Flame style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-active)' }} />
          Interaction Selector Latency Heatmap
        </h2>
        {interactions.length === 0 ? (
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent-light)', textAlign: 'center', padding: 'var(--space-4)' }}>
            No interactions recorded.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
            {interactions.map((int, idx) => {
              const tier = int.total <= 200 ? 'good' : int.total <= 500 ? 'warning' : 'poor';
              const badgeColor = { good: 'var(--color-good)', warning: 'var(--color-warning)', poor: 'var(--color-poor)' }[tier];
              return (
                <div key={idx} className={`heatmap-card heatmap-card--${tier}`}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                      <span style={{ fontSize: 'var(--fs-2xs)', textTransform: 'uppercase', fontWeight: 'var(--fw-bold)', letterSpacing: 'var(--ls-wider)', padding: '2px 8px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.06)' }}>
                        {int.type}
                      </span>
                      <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-extrabold)', padding: '2px 10px', borderRadius: 'var(--radius-full)', background: badgeColor, color: '#fff' }}>
                        {int.total} ms
                      </span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)', background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.04)', padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-md)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', userSelect: 'all', marginBottom: 'var(--space-2)' }}>
                      {int.selector}
                    </div>
                  </div>
                  <div>
                    {int.targetText && (
                      <div style={{ fontSize: 'var(--fs-2xs)', fontWeight: 'var(--fw-semibold)', opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px' }}>
                        Inner Text: "{int.targetText}"
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--fs-2xs)', fontWeight: 'var(--fw-bold)', opacity: 0.6, fontFamily: 'var(--font-mono)' }}>
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

      {/* ── 5. Long Tasks Table ── */}
      <div className="glass-card">
        <h2 className="section-heading" style={{ justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Clock style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-active)' }} />
            Main-Thread Blocking Long Tasks
          </span>
          <span className="badge badge--neutral">{longTasks.length} Detected</span>
        </h2>

        {longTasks.length === 0 ? (
          <div style={{
            background: 'var(--color-good-light)', border: '1px solid var(--color-good-border)',
            borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)',
            fontSize: 'var(--fs-xs)', color: 'var(--color-good-text)', textAlign: 'center', lineHeight: 'var(--lh-relaxed)',
          }}>
            ❇️ <strong>Fantastic!</strong> No Main-Thread blocking tasks exceeding 50ms occurred. The JavaScript thread stayed responsive.
          </div>
        ) : (
          <div style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Start Time</th>
                    <th>Duration</th>
                    <th>Overlap Correlated</th>
                    <th>Details / Source</th>
                  </tr>
                </thead>
                <tbody>
                  {longTasks.map((task, idx) => (
                    <tr key={idx}>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>+{Math.round(task.startTime)} ms</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 'var(--fw-bold)', color: 'var(--color-poor)' }}>{Math.round(task.duration)} ms</td>
                      <td>
                        {task.interactionId ? (
                          <span style={{ fontSize: 'var(--fs-2xs)', background: 'var(--color-poor-light)', border: '1px solid var(--color-poor-border)', color: 'var(--color-poor-text)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontWeight: 'var(--fw-bold)' }}>⚠️ Event Blocked</span>
                        ) : (
                          <span style={{ fontSize: 'var(--fs-2xs)', background: 'var(--pill-bg)', color: 'var(--accent-light)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontWeight: 'var(--fw-semibold)' }}>Background</span>
                        )}
                      </td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
