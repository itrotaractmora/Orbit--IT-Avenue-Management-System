export function AuditLogPanel({ auditLogs, isAdmin }: { auditLogs: any[], isAdmin: boolean }) {
  if (!isAdmin) return null

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
      <h2 className="title-md">System Log</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
        {auditLogs.map(l => (
          <div key={l.id} style={{ fontSize: '13px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{l.action}</span>
              <span style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>{new Date(l.timestamp).toLocaleTimeString()}</span>
            </div>
            <div style={{ color: 'var(--on-surface-variant)', marginTop: '2px', fontSize: '12px' }}>
              {l.entityType} ID: {l.entityId.substring(0, 8)}...
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
