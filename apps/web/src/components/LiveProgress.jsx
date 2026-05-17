import { h } from 'preact';
import { useAuditStore } from '../store/useAuditStore';

const STEPS = [
  { key: 'initialized',   title: 'Initialization',        desc: 'Registering background job queue' },
  { key: 'context_setup', title: 'Browser Emulation',     desc: 'Configuring Chromium context' },
  { key: 'navigating',    title: 'Site Navigation',        desc: 'Loading document object model' },
  { key: 'discovery',     title: 'Interaction Discovery',  desc: 'Scanning targets and inputs' },
  { key: 'replaying',     title: 'Automated Replays',      desc: 'Simulating user interaction script' },
  { key: 'processing',    title: 'Main-Thread Diagnostic', desc: 'Correlating active long tasks' },
];

export function LiveProgress() {
  const jobProgress    = useAuditStore(s => s.jobProgress);
  const jobStatus      = useAuditStore(s => s.jobStatus);
  const errorMsg       = useAuditStore(s => s.errorMsg);
  const clearActiveJob = useAuditStore(s => s.clearActiveJob);

  if (jobStatus === 'idle') return null;

  const latestUpdate = jobProgress[jobProgress.length - 1] || {};
  const activePhase  = latestUpdate.phase || 'initialized';

  const getStepStatus = (stepKey, idx) => {
    const activeIndex = STEPS.findIndex(s => s.key === activePhase);
    if (jobStatus === 'failed') return 'failed';
    if (stepKey === activePhase)  return 'active';
    if (activeIndex > idx)        return 'completed';
    return 'pending';
  };

  return (
    <div className="glass-card animate-fade-in">
      {/* Card Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)' }}>
        <div>
          <h2 className="section-heading" style={{ marginBottom: 'var(--space-1)' }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-warning)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="section-heading-icon animate-neon-pulse"
              style={{ filter: 'drop-shadow(0 0 5px rgba(245,158,11,0.7))' }}
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Automated Auditing Engine
          </h2>
          <p style={{ margin: 0, fontSize: 'var(--fs-xs)', color: 'var(--accent-light)', opacity: 0.8 }}>
            Running Chromium headless session in the background…
          </p>
        </div>

        {jobStatus === 'failed' && (
          <button
            id="btn-dismiss-error"
            onClick={clearActiveJob}
            className="btn-dismiss"
          >
            Dismiss
          </button>
        )}
      </div>

      {/* Error Panel */}
      {errorMsg ? (
        <div
          style={{
            background: 'var(--color-poor-light)',
            border: '1px solid var(--color-poor-border)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-4)',
            fontSize: 'var(--fs-sm)',
            fontWeight: 'var(--fw-semibold)',
            color: 'var(--color-poor-text)',
            lineHeight: 'var(--lh-relaxed)',
          }}
        >
          ❌{' '}
          <strong style={{ fontWeight: 'var(--fw-extrabold)' }}>Audit Error:</strong> {errorMsg}
          <div
            style={{
              fontSize: 'var(--fs-xs)',
              marginTop: 'var(--space-2)',
              opacity: 0.8,
            }}
          >
            The measurement engine could not start or complete. Please check the target URL structure,
            secure port availability, or local connection configs.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Active Log Banner */}
          <div className="activity-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              {/* Animated status ring */}
              <span style={{ position: 'relative', display: 'flex', width: '0.75rem', height: '0.75rem', flexShrink: 0 }}>
                <span
                  className="animate-ping"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: 'var(--color-good)',
                    opacity: 0.75,
                  }}
                />
                <span
                  style={{
                    position: 'relative',
                    width: '0.75rem',
                    height: '0.75rem',
                    borderRadius: '50%',
                    background: 'var(--color-good)',
                  }}
                />
              </span>
              <div
                style={{ fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--accent-vivid)' }}
              >
                Current Activity:{' '}
                <span style={{ color: 'var(--accent-light)', fontWeight: 'var(--fw-semibold)', fontStyle: 'italic' }}>
                  "{latestUpdate.message || 'Queued in background'}"
                </span>
              </div>
            </div>

            {latestUpdate.current !== undefined && (
              <span
                className="badge badge--poor"
                style={{ flexShrink: 0 }}
              >
                Action {latestUpdate.current} / {latestUpdate.total}
              </span>
            )}
          </div>

          {/* Stepper Timeline */}
          <div className="stepper">
            {STEPS.map((step, idx) => {
              const status = getStepStatus(step.key, idx);
              return (
                <div key={step.key} className="stepper-item">
                  {/* Indicator Dot */}
                  <span
                    className={`stepper-dot stepper-dot--${
                      status === 'completed' ? 'completed'
                      : status === 'active'    ? 'active'
                      : status === 'failed'    ? 'failed'
                      : ''
                    }`}
                  >
                    {status === 'completed' && (
                      <svg style={{ width: '0.5rem', height: '0.5rem' }} fill="none" stroke="white" strokeWidth="4" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>

                  {/* Step Text */}
                  <h4
                    style={{
                      margin: 0,
                      fontSize: 'var(--fs-xs)',
                      fontWeight: 'var(--fw-bold)',
                      color: status === 'completed'
                        ? 'var(--color-good-text)'
                        : status === 'active'
                        ? 'var(--color-active)'
                        : 'var(--accent-light)',
                      opacity: status === 'pending' ? 0.55 : 1,
                      transition: 'color var(--duration-base)',
                    }}
                  >
                    {step.title}
                  </h4>
                  <p
                    style={{
                      margin: '2px 0 0',
                      fontSize: 'var(--fs-2xs)',
                      fontWeight: 'var(--fw-medium)',
                      color: status === 'active' ? 'var(--accent-color)' : 'var(--accent-light)',
                      opacity: status === 'pending' ? 0.5 : 0.85,
                      transition: 'color var(--duration-base)',
                    }}
                  >
                    {step.desc}
                  </p>

                  {/* Active Selector Badge */}
                  {status === 'active' && latestUpdate.activeSelector && (
                    <div
                      className="animate-fade-in"
                      style={{
                        marginTop: 'var(--space-2)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 'var(--space-1)',
                        padding: 'var(--space-1) var(--space-3)',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--color-active-light)',
                        border: '1px solid var(--color-active-border)',
                        fontSize: 'var(--fs-2xs)',
                        fontWeight: 'var(--fw-bold)',
                        color: 'var(--color-active)',
                      }}
                    >
                      <span style={{ fontSize: 'var(--fs-xs)' }}>🎯</span>
                      Target element:{' '}
                      <code
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 'var(--fs-2xs)',
                          background: '#fff',
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-active-border)',
                          color: 'var(--color-active)',
                        }}
                      >
                        {latestUpdate.activeSelector}
                      </code>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
