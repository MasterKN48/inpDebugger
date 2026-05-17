
export function BackgroundBlobs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Soft Pink Blob */}
      <div 
        className="absolute -top-40 -left-40 w-96 h-96 md:w-[600px] md:h-[600px] rounded-full bg-gradient-to-tr from-pink-100 to-pink-200 opacity-40 blur-[100px] animate-spin"
        style={{ animationDuration: '40s' }}
      />
      {/* Soft Green/Sage Blob */}
      <div 
        className="absolute -bottom-40 -right-40 w-96 h-96 md:w-[600px] md:h-[600px] rounded-full bg-gradient-to-br from-emerald-50 to-teal-100 opacity-45 blur-[120px] animate-pulse"
        style={{ animationDuration: '25s' }}
      />
      {/* Central Soft Warm Accent */}
      <div 
        className="absolute top-1/2 left-1/3 w-80 h-80 rounded-full bg-pink-50 opacity-30 blur-[130px]"
      />
    </div>
  );
}
