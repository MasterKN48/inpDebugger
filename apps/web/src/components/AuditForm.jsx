import { useState } from 'preact/hooks';
import { useAuditStore } from '../store/useAuditStore';

export function AuditForm() {
  const [url, setUrl] = useState('');
  const triggerAudit    = useAuditStore(s => s.triggerAudit);
  const deviceProfile   = useAuditStore(s => s.deviceProfile);
  const setDeviceProfile = useAuditStore(s => s.setDeviceProfile);
  const jobStatus       = useAuditStore(s => s.jobStatus);
  const isRunning       = jobStatus === 'running' || jobStatus === 'pending';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url) return;
    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = 'https://' + finalUrl;
    triggerAudit(finalUrl);
  };

  return (
    <div className="glass-card">
      {/* Card Header */}
      <h2 className="section-heading" style={{ fontSize: 'var(--fs-xl)', marginBottom: 'var(--space-5)' }}>
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
        Start New Diagnostics Run
      </h2>

      <form id="audit-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

        {/* URL Input */}
        <div>
          <label id="label-url" className="form-label">Target Website URL</label>
          <input
            id="input-target-url"
            aria-labelledby="label-url"
            type="text"
            value={url}
            onInput={(e) => setUrl(e.target.value)}
            disabled={isRunning}
            placeholder="e.g. shop.example.com or https://mywebsite.org"
            className="form-input"
          />
        </div>

        {/* Configuration Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>

          {/* Device Profile Segment */}
          <div>
            <label className="form-label">Device Emulation Profile</label>
            <div
              className="segment-group"
              style={{ gridTemplateColumns: '1fr 1fr' }}
              role="group"
              aria-label="Device Profile"
            >
              <button
                id="btn-profile-desktop"
                type="button"
                disabled={isRunning}
                onClick={() => setDeviceProfile('desktop')}
                className={`segment-btn ${deviceProfile === 'desktop' ? 'active' : ''}`}
              >
                🖥️ Desktop
              </button>
              <button
                id="btn-profile-mobile"
                type="button"
                disabled={isRunning}
                onClick={() => setDeviceProfile('mobile')}
                className={`segment-btn ${deviceProfile === 'mobile' ? 'active mobile' : ''}`}
              >
                📱 Mobile (4G)
              </button>
            </div>
          </div>

          {/* INP Standard Note */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div className="info-note">
              👉{' '}
              <strong style={{ color: 'var(--accent-vivid)', fontWeight: 'var(--fw-bold)' }}>
                INP Audit Standard:
              </strong>{' '}
              Simulates multiple automated DOM clicks, form typing, and accordion toggles while
              correlating active Main-Thread Long Tasks.
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          id="btn-run-audit"
          type="submit"
          disabled={isRunning || !url}
          className="btn-primary"
          style={{ width: '100%', padding: 'var(--space-4) var(--space-6)', fontSize: 'var(--fs-sm)' }}
        >
          {isRunning ? (
            <>
              <svg
                className="animate-spin"
                style={{ width: '1rem', height: '1rem', flexShrink: 0 }}
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
                <path
                  fill="currentColor"
                  style={{ opacity: 0.75 }}
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Orchestrating Chromium Audit…
            </>
          ) : (
            '🚀 Run Interactive Diagnostic Audit'
          )}
        </button>
      </form>
    </div>
  );
}
