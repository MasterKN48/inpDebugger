
export function BackgroundBlobs() {
  return (
    <div
      className="hide-print"
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* Pink Ambient Blob */}
      <div
        className="animate-blob-spin"
        style={{
          position: 'absolute',
          top: '-10rem',
          left: '-10rem',
          width: 'clamp(24rem, 40vw, 38rem)',
          height: 'clamp(24rem, 40vw, 38rem)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--blob-pink-color) 0%, transparent 70%)',
          filter: 'blur(80px)',
          opacity: 0.65,
        }}
      />
      {/* Green Ambient Blob */}
      <div
        style={{
          position: 'absolute',
          bottom: '-10rem',
          right: '-10rem',
          width: 'clamp(24rem, 40vw, 38rem)',
          height: 'clamp(24rem, 40vw, 38rem)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--blob-green-color) 0%, transparent 70%)',
          filter: 'blur(100px)',
          opacity: 0.55,
          animation: 'neon-pulse 25s ease-in-out infinite',
        }}
      />
      {/* Warm Central Accent */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '33%',
          transform: 'translate(-50%, -50%)',
          width: '20rem',
          height: '20rem',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--blob-warm-color) 0%, transparent 70%)',
          filter: 'blur(90px)',
          opacity: 0.40,
        }}
      />
    </div>
  );
}
