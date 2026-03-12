import './LoadingSkeleton.css';

/* ── AdminLayoutSkeleton ── */
export function AdminLayoutSkeleton() {
  return (
    <div className="admin-skel">
      {/* Sidebar */}
      <div className="admin-skel-sidebar">
        <div className="admin-skel-logo">
          <div className="admin-skel-logo-icon skel-rect skel-shimmer" />
          <div className="admin-skel-logo-text skel-line" />
        </div>

        <div className="admin-skel-org skel-rect skel-shimmer" />

        <div className="admin-skel-nav">
          <div className="admin-skel-nav-section">
            <div className="admin-skel-nav-title skel-line sm" />
            {[70, 55, 60].map((w, i) => (
              <div key={i} className="admin-skel-nav-item">
                <div className="admin-skel-nav-icon skel-rect skel-shimmer" />
                <div className="admin-skel-nav-label skel-line" style={{ width: `${w}%` }} />
              </div>
            ))}
          </div>

          <div className="admin-skel-nav-section">
            <div className="admin-skel-nav-title skel-line sm" />
            {[65, 80, 50, 60, 45].map((w, i) => (
              <div key={i} className="admin-skel-nav-item">
                <div className="admin-skel-nav-icon skel-rect skel-shimmer" />
                <div className="admin-skel-nav-label skel-line" style={{ width: `${w}%` }} />
              </div>
            ))}
          </div>
        </div>

        <div className="admin-skel-footer">
          <div className="admin-skel-nav-item">
            <div className="admin-skel-nav-icon skel-rect skel-shimmer" />
            <div className="admin-skel-nav-label skel-line" style={{ width: '50%' }} />
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="admin-skel-content">
        <div className="admin-skel-topbar">
          <div className="skel-line" style={{ width: 100 }} />
          <div className="admin-skel-avatar skel-circle" />
        </div>

        <div className="admin-skel-main">
          <div className="admin-skel-title skel-line xl" />
          <div className="admin-skel-subtitle skel-line sm" />

          <div className="admin-skel-lines">
            <div className="skel-line w80" />
            <div className="skel-line w60" />
            <div className="skel-line w70" />
            <div className="skel-line w50" />
          </div>

          <div className="admin-skel-grid">
            <div className="admin-skel-grid-card skel-card" />
            <div className="admin-skel-grid-card skel-card" />
            <div className="admin-skel-grid-card skel-card" />
            <div className="admin-skel-grid-card skel-card" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── LoadingSkeleton (variant-based) ── */
export default function LoadingSkeleton({ variant = 'content' }) {
  switch (variant) {
    case 'list':
      return (
        <div className="skel-container">
          <div className="skel-line xl w40" />
          <div className="skel-list">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skel-list-item">
                <div className="skel-circle" style={{ width: 36, height: 36 }} />
                <div className="skel-list-item-text">
                  <div className="skel-line w60" />
                  <div className="skel-line sm w40" />
                </div>
                <div className="skel-line" style={{ width: 60 }} />
              </div>
            ))}
          </div>
        </div>
      );

    case 'cards':
      return (
        <div className="skel-container">
          <div className="skel-line xl w30" />
          <div className="skel-line sm w50" />
          <div className="skel-cards-grid">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skel-card">
                <div className="skel-line lg w40" />
                <div className="skel-line sm w60" />
                <div style={{ flex: 1 }} />
                <div className="skel-line sm w30" />
              </div>
            ))}
          </div>
        </div>
      );

    case 'form':
      return (
        <div className="skel-container">
          <div className="skel-line xl w40" />
          <div className="skel-form">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skel-form-group">
                <div className="skel-line sm w20" />
                {i === 3 ? (
                  <div className="skel-form-textarea skel-rect skel-shimmer" />
                ) : (
                  <div className="skel-form-input skel-rect skel-shimmer" />
                )}
              </div>
            ))}
            <div className="skel-form-button skel-rect skel-shimmer" />
          </div>
        </div>
      );

    case 'stats':
      return (
        <div className="skel-container">
          <div className="skel-line xl w30" />
          <div className="skel-stats-grid">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skel-stat-card skel-rect skel-shimmer" />
            ))}
          </div>
          <div className="skel-content-block" style={{ marginTop: '1rem' }}>
            <div className="skel-line w80" />
            <div className="skel-line w60" />
            <div className="skel-line w70" />
          </div>
        </div>
      );

    case 'content':
    default:
      return (
        <div className="skel-container">
          <div className="skel-line xl w40" />
          <div className="skel-line sm w60" />
          <div className="skel-content">
            <div className="skel-content-block">
              <div className="skel-line w100" />
              <div className="skel-line w80" />
              <div className="skel-line w70" />
            </div>
            <div className="skel-content-block">
              <div className="skel-line lg w30" />
              <div className="skel-line w100" />
              <div className="skel-line w60" />
              <div className="skel-line w80" />
            </div>
            <div className="skel-content-block">
              <div className="skel-line lg w25" />
              <div className="skel-line w70" />
              <div className="skel-line w50" />
            </div>
          </div>
        </div>
      );
  }
}
