'use client';

import React, { useState, useEffect } from 'react';

interface AnalyticsFeed {
  id: string;
  fullName: string;
  department: string;
  currentTier: string;
  rollingMaeScore: number;
  defenseScore: number;
  isCertified: boolean;
  stationNumber: number;
  rowLocation: string;
}

export default function SupervisorAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<AnalyticsFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);

  const feedUrl =
    process.env.NEXT_PUBLIC_RLHF_LIVE_FEED_URL ||
    'http://localhost:8080/api/rlhf/analytics/live-feed';

  // Poll the backend master feed over the Cloudflare development plumbing
  const fetchLiveMetrics = async () => {
    try {
      const response = await fetch(feedUrl);
      const payload = await response.json();
      if (payload.status === 'success' && Array.isArray(payload.data)) {
        setMetrics(payload.data);
        setLastError(null);
      } else {
        setLastError(payload.message || 'Unexpected live-feed payload shape');
      }
    } catch (err) {
      console.error('Failed to stream analytics endpoint data matrix:', err);
      setLastError('Failed to reach live-feed endpoint (is backend on :8080?)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveMetrics();
    // Continuous baseline polling every 5000ms to monitor active terminal changes
    const interval = setInterval(fetchLiveMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        padding: '2rem',
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        backgroundColor: '#020617',
        color: '#f8fafc',
        minHeight: '100vh',
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #1e293b',
          paddingBottom: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1 style={{ color: '#38bdf8', fontSize: '1.75rem' }}>
            🌅 Uromi Command Center
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Ugboha Road Facility // Active Session Telemetry Matrix
          </p>
        </div>
        <button
          onClick={fetchLiveMetrics}
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            color: '#38bdf8',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.8rem',
          }}
        >
          ⟳ REFRESH FEED
        </button>
      </header>

      {lastError ? (
        <p style={{ color: '#f87171', marginBottom: '1rem', fontSize: '0.85rem' }}>
          {lastError}
        </p>
      ) : null}

      {loading ? (
        <p style={{ color: '#64748b' }}>Ingesting database pipeline records...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '0.85rem',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '2px solid #334155', color: '#94a3b8' }}>
                <th style={{ padding: '0.75rem' }}>STATION</th>
                <th style={{ padding: '0.75rem' }}>CANDIDATE</th>
                <th style={{ padding: '0.75rem' }}>NICTM DEPARTMENT</th>
                <th style={{ padding: '0.75rem' }}>TIER STATUS</th>
                <th style={{ padding: '0.75rem' }}>MAE ACCURACY</th>
                <th style={{ padding: '0.75rem' }}>DEFENSE SCORE</th>
                <th style={{ padding: '0.75rem' }}>CERTIFICATION STATUS</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((row) => (
                <tr
                  key={row.id}
                  style={{
                    borderBottom: '1px solid #1e293b',
                    backgroundColor: row.isCertified ? '#042f1a' : 'transparent',
                  }}
                >
                  <td
                    style={{
                      padding: '1rem',
                      fontWeight: 'bold',
                      color: '#38bdf8',
                    }}
                  >
                    {row.rowLocation}-{row.stationNumber}
                  </td>
                  <td style={{ padding: '1rem', color: '#fff' }}>
                    {row.fullName}
                  </td>
                  <td style={{ padding: '1rem', color: '#94a3b8' }}>
                    {row.department.replace(/_/g, ' ')}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span
                      style={{
                        backgroundColor: '#1e293b',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                      }}
                    >
                      {row.currentTier}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '1rem',
                      color:
                        row.rollingMaeScore <= 0.05 ? '#34d399' : '#f87171',
                    }}
                  >
                    {Number(row.rollingMaeScore).toFixed(3)}
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                    {Number(row.defenseScore).toFixed(1)}%
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {row.isCertified ? (
                      <span style={{ color: '#34d399', fontWeight: 'bold' }}>
                        ✅ CERTIFIED
                      </span>
                    ) : (
                      <span style={{ color: '#64748b' }}>PENDING VIVA</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {metrics.length === 0 ? (
            <p style={{ color: '#64748b', marginTop: '1rem' }}>
              No evaluation rows yet. Run: npx prisma db seed
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
