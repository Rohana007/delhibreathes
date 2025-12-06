import './ReportBloomPopup.css'; // reuse bloom styles for glow if needed

export default function AchievementBadge({ achievement, locked }) {
  const { title, description, icon, unlockedAt } = achievement;

  const dateLabel = unlockedAt
    ? new Date(unlockedAt).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div
      className={`rb-popup ${
        locked ? 'opacity-60 grayscale' : ''
      }`}
      style={{
        position: 'relative',
        padding: '18px 20px',
        borderRadius: 16,
        maxWidth: '100%',
        boxShadow:
          '0 6px 18px rgba(0,0,0,0.06), 0 14px 32px rgba(255,182,193,0.08)',
        border: '1px solid rgba(255,182,193,0.16)',
        background: locked
          ? 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, #f7fffb 100%)',
      }}
    >
      <div className="rb-petals" />
      <div className="flex items-start gap-3 relative z-10">
        <div
          className="flex items-center justify-center"
          style={{
            fontSize: 30,
            filter: locked ? 'grayscale(1) opacity(0.8)' : 'none',
          }}
        >
          {icon}
        </div>
        <div className="flex-1">
          <h3
            className="text-sm font-semibold mb-1"
            style={{ color: '#0F172A' }}
          >
            {title}
          </h3>
          <p
            className="text-xs mb-1"
            style={{ color: '#475569' }}
          >
            {description}
          </p>
          {dateLabel && !locked && (
            <p
              className="text-[11px]"
              style={{ color: '#6B7280' }}
            >
              Unlocked on {dateLabel}
            </p>
          )}
          {locked && (
            <p
              className="text-[11px]"
              style={{ color: '#9CA3AF' }}
            >
              Locked
            </p>
          )}
        </div>
      </div>
    </div>
  );
}


