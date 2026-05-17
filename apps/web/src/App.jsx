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

  const jobStatus = useAuditStore(s => s.jobStatus);
  const isRunning = jobStatus === 'running' || jobStatus === 'pending';

  return (
    <div
      data-theme="slate"
      style={{ minHeight: '100vh', position: 'relative', fontFamily: 'var(--font-sans)', color: 'var(--accent-vivid)' }}
    >
      {/* Dynamic Ambient Background Blobs */}
      <BackgroundBlobs />


      {/* Main Container Layout */}
      <div
        className="animate-fade-in"
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '90rem',
          margin: '0 auto',
          padding: 'var(--space-6) var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-8)',
        }}
      >
        {/* ─────────────────────────────────────────────────────
            Global Glassmorphic Header
        ───────────────────────────────────────────────────── */}
        <header className="glass-card" style={{ padding: 'var(--space-5) var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>

            {/* Brand Mark */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              {/* Neon Lightning Bolt Icon */}
              <div
                id="header-brand-icon"
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: 'var(--radius-lg)',
                  background: '#0f172a',
                  border: '1px solid rgba(163, 230, 53, 0.40)',
                  boxShadow: 'var(--glow-neon)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'box-shadow var(--duration-slow) var(--ease-spring)',
                  cursor: 'default',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(135deg, rgba(163, 230, 53, 0.25), transparent)',
                    opacity: 0.6,
                  }}
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#bef264"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ width: '1.2rem', height: '1.2rem', filter: 'drop-shadow(0 0 8px rgba(163,230,53,1))', position: 'relative', zIndex: 1 }}
                  className="animate-neon-pulse"
                >
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>

              <div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 'var(--fs-xl)',
                    fontWeight: 'var(--fw-extrabold)',
                    letterSpacing: 'var(--ls-tight)',
                    color: 'var(--accent-vivid)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                  }}
                >
                  INP Debugger
                  <span
                    style={{
                      fontSize: 'var(--fs-2xs)',
                      background: 'var(--pill-bg)',
                      color: 'var(--accent-light)',
                      fontWeight: 'var(--fw-bold)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--line-color)',
                      textTransform: 'uppercase',
                      letterSpacing: 'var(--ls-widest)',
                    }}
                  >
                    v1.0.0
                  </span>
                </h1>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: 'var(--fs-2xs)',
                    fontWeight: 'var(--fw-semibold)',
                    color: 'var(--accent-light)',
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--ls-wider)',
                    opacity: 0.75,
                  }}
                >
                  Automated INP Diagnostic Workspace
                </p>
              </div>
            </div>

            {/* Actions & Engine Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              {/* GitHub Link */}
              <a
                id="header-github-link"
                href="https://github.com/MasterKN48/inpDebugger"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
                style={{ textDecoration: 'none' }}
              >
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ width: '0.9rem', height: '0.9rem', fill: 'currentColor', flexShrink: 0 }}
                >
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
                GitHub
              </a>

              {/* Vertical Divider */}
              <div
                style={{
                  width: '1px',
                  height: '1rem',
                  background: 'var(--line-color)',
                }}
              />

              {/* Engine Status Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ position: 'relative', display: 'flex', width: '0.5rem', height: '0.5rem' }}>
                  <span
                    className="animate-ping"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      background: isRunning ? 'var(--color-active)' : 'var(--color-good)',
                    }}
                  />
                  <span
                    style={{
                      position: 'relative',
                      width: '0.5rem',
                      height: '0.5rem',
                      borderRadius: '50%',
                      background: isRunning ? 'var(--color-active)' : 'var(--color-good)',
                    }}
                  />
                </span>
                <span
                  style={{
                    fontSize: 'var(--fs-2xs)',
                    fontWeight: 'var(--fw-extrabold)',
                    color: 'var(--accent-light)',
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--ls-wider)',
                  }}
                >
                  {isRunning ? 'Auditing Engine Active' : 'Measurement Engine Standby'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ─────────────────────────────────────────────────────
            Workspace Split Grid
        ───────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: 'var(--space-8)',
            alignItems: 'start',
          }}
          className="workspace-grid"
        >
          {/* Left Column: Audit History Sidebar */}
          <aside style={{ gridColumn: 'span 4', order: 2 }} className="history-col">
            <AuditHistory />
          </aside>

          {/* Right Column: Work Area */}
          <main
            style={{
              gridColumn: 'span 8',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-8)',
              order: 1,
            }}
            className="work-col"
          >
            <AuditForm />
            <LiveProgress />
            <MetricCards />
            <BottleneckTable />
          </main>
        </div>
      </div>


      {/* Responsive grid adjustments */}
      <style>{`
        @media (max-width: 1024px) {
          .workspace-grid { display: flex !important; flex-direction: column !important; }
          .history-col { order: 2 !important; }
          .work-col    { order: 1 !important; }
        }
        #header-brand-icon:hover {
          box-shadow: var(--glow-neon-hover) !important;
        }
      `}</style>
    </div>
  );
}
