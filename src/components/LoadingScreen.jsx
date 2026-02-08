// Loading Screen component
export default function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      gap: '1.5rem'
    }}>
      <div className="loading-logo animate-fade-in">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <rect x="4" y="4" width="40" height="40" rx="12" stroke="url(#grad)" strokeWidth="2.5" />
          <path d="M15 24h18M24 15v18" stroke="url(#grad)" strokeWidth="2.5" strokeLinecap="round" />
          <defs>
            <linearGradient id="grad" x1="4" y1="4" x2="44" y2="44">
              <stop stopColor="#6366f1" />
              <stop offset="1" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="loading-spinner" style={{
        width: 32, height: 32,
        border: '3px solid var(--border-primary)',
        borderTopColor: 'var(--accent-indigo)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
