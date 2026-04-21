'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Registration, Course } from '@/lib/types'
import { detectCollisions, type Collision } from '@/lib/schedule'
import { formatDate, exportToExcel } from '@/lib/utils'

interface Props {
  pin: string
  onLogout: () => void
}

type Tab = 'registrations' | 'planning' | 'schedule'

const COURSES: { value: Course; label: string; color: string; bg: string; border: string }[] = [
  { value: 'forratt',  label: 'Förrätt',  color: '#92400E', bg: '#FEF3C7', border: '#FCD34D' },
  { value: 'varmratt', label: 'Varmrätt', color: '#9A3412', bg: '#FFF7ED', border: '#FDBA74' },
  { value: 'dessert',  label: 'Dessert',  color: '#9D174D', bg: '#FCE7F3', border: '#F9A8D4' },
]

const TABLE_COLORS = [
  { bg: '#EDE9FE', text: '#5B21B6', border: '#C4B5FD' },
  { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
  { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
  { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  { bg: '#FCE7F3', text: '#9D174D', border: '#F9A8D4' },
  { bg: '#FFF7ED', text: '#9A3412', border: '#FDBA74' },
  { bg: '#F0F9FF', text: '#0C4A6E', border: '#7DD3FC' },
  { bg: '#FDF4FF', text: '#701A75', border: '#E879F9' },
]

function tableColor(n: number) {
  return TABLE_COLORS[(n - 1) % TABLE_COLORS.length]
}

function parsePartnerPhone(r: Registration) {
  return r.notes?.startsWith('Partner telefon:') ? r.notes.split('\n')[0].replace('Partner telefon: ', '') : null
}
function parseNotes(r: Registration) {
  return r.notes?.startsWith('Partner telefon:') ? r.notes.split('\n').slice(1).join('\n') : r.notes
}
function displayName(r: Registration) {
  return r.partner_name ? `${r.name} & ${r.partner_name}` : r.name
}

export default function AdminDashboard({ pin, onLogout }: Props) {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<Tab>('registrations')
  const [collisions, setCollisions] = useState<Collision[]>([])
  const [generating, setGenerating] = useState(false)

  const fetchRegistrations = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/registrations', { headers: { 'x-admin-pin': pin } })
      if (!res.ok) throw new Error('Kunde inte hämta anmälningar')
      const data = await res.json()
      const regs: Registration[] = data.registrations
      setRegistrations(regs)
      setCollisions(detectCollisions(regs))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Något gick fel')
    } finally {
      setIsLoading(false)
    }
  }, [pin])

  useEffect(() => { fetchRegistrations() }, [fetchRegistrations])

  const handleUpdate = useCallback(async (id: string, update: Partial<Pick<Registration, 'course' | 'table_forratt' | 'table_varmratt' | 'table_dessert'>>) => {
    try {
      const res = await fetch(`/api/registrations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
        body: JSON.stringify(update),
      })
      if (!res.ok) throw new Error()
      const updated = registrations.map(r => r.id === id ? { ...r, ...update } : r)
      setRegistrations(updated)
      setCollisions(detectCollisions(updated))
    } catch {
      alert('Kunde inte uppdatera. Försök igen.')
    }
  }, [pin, registrations])

  const handleDelete = useCallback(async (id: string, name: string) => {
    if (!confirm(`Ta bort ${name}? Detta går inte att ångra.`)) return
    try {
      const res = await fetch(`/api/registrations/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': pin },
      })
      if (!res.ok) throw new Error()
      const updated = registrations.filter(r => r.id !== id)
      setRegistrations(updated)
      setCollisions(detectCollisions(updated))
    } catch {
      alert('Kunde inte ta bort. Försök igen.')
    }
  }, [pin, registrations])

  const handleGenerateAction = async (action: 'auto-hosting' | 'generate' | 'reset' | 'reset-all') => {
    if (action === 'generate') {
      const allowedFloating = registrations.length % 3 === 1 ? 1 : 0
      const unassigned = registrations.filter(r => !r.course).length
      if (unassigned > allowedFloating) {
        alert(`${unassigned - allowedFloating} hushåll saknar värdskapsrätt. Tilldela alla först.`)
        return
      }
    }
    if (action === 'reset') {
      if (!confirm('Återställ alla bordstilldelningar? Värdskapen behålls.')) return
    }
    if (action === 'reset-all') {
      if (!confirm('Återställ hela planeringen? Både värdskap och bordsnummer tas bort.')) return
    }
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
        body: JSON.stringify({ action }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Fel')
      await fetchRegistrations()
      if (action === 'generate') setTab('schedule')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Något gick fel')
    } finally {
      setGenerating(false)
    }
  }

  const stats = {
    total: registrations.length,
    pairs: registrations.filter(r => r.is_pair).length,
    singles: registrations.filter(r => !r.is_pair).length,
    withHost: registrations.filter(r => r.course).length,
    scheduled: registrations.filter(r => r.table_forratt != null).length,
  }

  const allowedFloating = stats.total % 3 === 1 ? 1 : 0
  const allHosted = stats.withHost >= stats.total - allowedFloating && stats.total > 0
  const hasSchedule = stats.scheduled > 0
  const anyPlanning = stats.withHost > 0

  const s: Record<string, React.CSSProperties> = {
    page:   { minHeight: '100vh', background: '#F8F7FF', fontFamily: 'system-ui, sans-serif', color: '#1A1A1A' },
    header: { background: 'white', borderBottom: '1px solid #E5E7EB', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    body:   { maxWidth: 1400, margin: '0 auto', padding: '24px' },
    card:   { background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
    th:     { padding: '10px 16px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: '#6B7280', background: '#F9FAFB', textAlign: 'left' as const, borderBottom: '1px solid #E5E7EB' },
    td:     { padding: '14px 16px', borderBottom: '1px solid #F3F4F6', verticalAlign: 'top' as const },
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Admin</p>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1A1A1A' }}>Cykelfest – Olovslund</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchRegistrations} style={{ background: '#F3F4F6', border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#374151' }}>↻ Uppdatera</button>
          <button onClick={() => exportToExcel(registrations)} style={{ background: '#D1FAE5', border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#065F46' }}>↓ Excel</button>
          <button onClick={onLogout} style={{ background: 'none', border: 'none', fontSize: 14, color: '#9CA3AF', cursor: 'pointer' }}>Logga ut</button>
        </div>
      </header>

      <div style={s.body}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Totalt',          value: stats.total,     bg: '#7C3AED', text: 'white' },
            { label: 'Par',             value: stats.pairs,     bg: '#FCE7F3', text: '#9D174D' },
            { label: 'Ensamma',         value: stats.singles,   bg: '#DBEAFE', text: '#1E40AF' },
            { label: 'Värd tilldelad',  value: stats.withHost,  bg: '#D1FAE5', text: '#065F46' },
            { label: 'Schemalagda',     value: stats.scheduled, bg: '#FEF3C7', text: '#92400E' },
          ].map(stat => (
            <div key={stat.label} style={{ background: stat.bg, borderRadius: 14, padding: '16px 20px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: stat.text }}>{stat.value}</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 500, color: stat.text, opacity: 0.8 }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Flikar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {([
            { key: 'registrations', label: 'Anmälningar' },
            { key: 'planning',      label: 'Planering' },
            { key: 'schedule',      label: hasSchedule ? 'Schema ✓' : 'Schema' },
          ] as { key: Tab; label: string }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ padding: '8px 20px', borderRadius: 10, border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                background: tab === t.key ? '#1A1A1A' : '#F3F4F6',
                color: tab === t.key ? 'white' : '#6B7280',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#9CA3AF' }}>Laddar…</div>
        ) : error ? (
          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 14, padding: 24, color: '#991B1B', textAlign: 'center' }}>{error}</div>
        ) : tab === 'registrations' ? (
          <RegistrationsTab registrations={registrations} handleDelete={handleDelete} s={s} />
        ) : tab === 'planning' ? (
          <PlanningTab
            registrations={registrations}
            allHosted={allHosted}
            hasSchedule={hasSchedule}
            anyPlanning={anyPlanning}
            generating={generating}
            handleUpdate={handleUpdate}
            handleGenerateAction={handleGenerateAction}
            s={s}
          />
        ) : (
          <ScheduleTab registrations={registrations} collisions={collisions} hasSchedule={hasSchedule} />
        )}
      </div>
    </div>
  )
}

// ─── Anmälningar ─────────────────────────────────────────────────────────────

function RegistrationsTab({ registrations, handleDelete, s }: {
  registrations: Registration[]
  handleDelete: (id: string, name: string) => Promise<void>
  s: Record<string, React.CSSProperties>
}) {
  if (registrations.length === 0) {
    return <div style={{ textAlign: 'center', padding: 80, color: '#9CA3AF' }}>Inga anmälningar än</div>
  }

  return (
    <div style={s.card}>
      <div style={{ overflowX: 'auto' as const }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 14 }}>
          <thead>
            <tr>
              <th style={s.th}>Namn</th>
              <th style={s.th}>Kontakt</th>
              <th style={s.th}>Adress</th>
              <th style={s.th}>Anmälningsdatum</th>
              <th style={s.th}></th>
            </tr>
          </thead>
          <tbody>
            {registrations.map(r => {
              const partnerPhone = parsePartnerPhone(r)
              const notes = parseNotes(r)
              return (
                <tr key={r.id}>
                  <td style={s.td}>
                    {r.is_pair ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 22, height: 22, background: '#EDE9FE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#7C3AED', flexShrink: 0 }}>1</span>
                          <span style={{ fontWeight: 700, color: '#1A1A1A' }}>{r.name}</span>
                        </div>
                        {r.partner_name && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 22, height: 22, background: '#FCE7F3', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#EC4899', flexShrink: 0 }}>2</span>
                            <span style={{ fontWeight: 700, color: '#1A1A1A' }}>{r.partner_name}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontWeight: 700, color: '#1A1A1A' }}>{r.name}</span>
                    )}
                    {notes && <p style={{ margin: '5px 0 0', fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>{notes}</p>}
                  </td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ color: '#374151' }}>{r.email}</span>
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>{r.phone}</span>
                      {r.is_pair && r.partner_email && (
                        <>
                          <span style={{ fontSize: 12, color: '#EC4899', marginTop: 3 }}>{r.partner_email}</span>
                          {partnerPhone && <span style={{ fontSize: 12, color: '#9CA3AF' }}>{partnerPhone}</span>}
                        </>
                      )}
                    </div>
                  </td>
                  <td style={{ ...s.td, color: '#374151' }}>{r.address}</td>
                  <td style={{ ...s.td, whiteSpace: 'nowrap' as const }}>
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>{formatDate(r.created_at)}</span>
                  </td>
                  <td style={{ ...s.td, textAlign: 'right' as const }}>
                    <button
                      onClick={() => handleDelete(r.id, displayName(r))}
                      title="Ta bort"
                      style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 600, color: '#DC2626', cursor: 'pointer' }}
                    >
                      Ta bort
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Planering ────────────────────────────────────────────────────────────────

function PlanningTab({ registrations, allHosted, hasSchedule, anyPlanning, generating, handleUpdate, handleGenerateAction, s }: {
  registrations: Registration[]
  allHosted: boolean
  hasSchedule: boolean
  anyPlanning: boolean
  generating: boolean
  handleUpdate: (id: string, update: Partial<Pick<Registration, 'course' | 'table_forratt' | 'table_varmratt' | 'table_dessert'>>) => Promise<void>
  handleGenerateAction: (action: 'auto-hosting' | 'generate' | 'reset' | 'reset-all') => Promise<void>
  s: Record<string, React.CSSProperties>
}) {
  const unassigned = registrations.filter(r => !r.course).length

  return (
    <>
      {/* Knappar */}
      <div style={{ ...s.card, padding: '16px 20px', marginBottom: 16, display: 'flex', flexWrap: 'wrap' as const, gap: 10, alignItems: 'center' }}>
        <button
          onClick={() => handleGenerateAction('auto-hosting')}
          disabled={generating}
          style={{ background: '#EDE9FE', border: '1.5px solid #C4B5FD', borderRadius: 10, padding: '8px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#5B21B6', opacity: generating ? 0.6 : 1 }}
        >
          🎲 Auto-fördela värdskap
        </button>

        <button
          onClick={() => handleGenerateAction('generate')}
          disabled={generating || !allHosted}
          title={!allHosted ? `${unassigned} hushåll saknar värdskapsrätt` : ''}
          style={{ background: allHosted ? '#7C3AED' : '#E5E7EB', border: 'none', borderRadius: 10, padding: '8px 18px', fontWeight: 600, fontSize: 14, cursor: allHosted ? 'pointer' : 'not-allowed', color: allHosted ? 'white' : '#9CA3AF', opacity: generating ? 0.6 : 1 }}
        >
          {generating ? 'Genererar…' : '✨ Generera schema'}
        </button>

        {hasSchedule && (
          <button
            onClick={() => handleGenerateAction('reset')}
            disabled={generating}
            style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 10, padding: '8px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#DC2626', opacity: generating ? 0.6 : 1 }}
          >
            ↺ Återställ schema
          </button>
        )}

        {anyPlanning && (
          <button
            onClick={() => handleGenerateAction('reset-all')}
            disabled={generating}
            style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 10, padding: '8px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#DC2626', opacity: generating ? 0.6 : 1 }}
          >
            ↺ Återställ allt
          </button>
        )}

        {(() => {
          const allowedF = registrations.length % 3 === 1 ? 1 : 0
          const unassignedCount = registrations.filter(r => !r.course).length
          const missing = unassignedCount - allowedF
          return (
            <>
              {missing > 0 && <span style={{ fontSize: 13, color: '#EF4444' }}>{missing} hushåll saknar värdskap</span>}
              {allowedF === 1 && unassignedCount >= 1 && <span style={{ fontSize: 13, color: '#9CA3AF' }}>1 hushåll är flytande gäst</span>}
            </>
          )
        })()}
      </div>

      {/* Tabell */}
      {registrations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#9CA3AF' }}>Inga anmälningar än</div>
      ) : (
        <div style={s.card}>
          <div style={{ overflowX: 'auto' as const }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 14 }}>
              <thead>
                <tr>
                  <th style={s.th}>Sällskap</th>
                  <th style={s.th}>Adress</th>
                  <th style={s.th}>Ansvarar för</th>
                  {hasSchedule && <th style={s.th}>Bord (F / V / D)</th>}
                </tr>
              </thead>
              <tbody>
                {registrations.map(r => (
                  <PlanningRow key={r.id} r={r} hasSchedule={hasSchedule} handleUpdate={handleUpdate} s={s} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

function PlanningRow({ r, hasSchedule, handleUpdate, s }: {
  r: Registration
  hasSchedule: boolean
  handleUpdate: (id: string, update: Partial<Pick<Registration, 'course' | 'table_forratt' | 'table_varmratt' | 'table_dessert'>>) => Promise<void>
  s: Record<string, React.CSSProperties>
}) {
  const [busy, setBusy] = useState(false)

  const update = async (patch: Partial<Pick<Registration, 'course' | 'table_forratt' | 'table_varmratt' | 'table_dessert'>>) => {
    setBusy(true)
    await handleUpdate(r.id, patch)
    setBusy(false)
  }

  const tableFields: { key: 'table_forratt' | 'table_varmratt' | 'table_dessert'; label: string }[] = [
    { key: 'table_forratt',  label: 'F' },
    { key: 'table_varmratt', label: 'V' },
    { key: 'table_dessert',  label: 'D' },
  ]

  return (
    <tr style={{ background: 'white' }}>
      {/* Namn */}
      <td style={s.td}>
        {r.is_pair ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 20, height: 20, background: '#EDE9FE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#7C3AED', flexShrink: 0 }}>1</span>
              <span style={{ fontWeight: 700, color: '#1A1A1A', fontSize: 13 }}>{r.name}</span>
            </div>
            {r.partner_name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 20, height: 20, background: '#FCE7F3', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#EC4899', flexShrink: 0 }}>2</span>
                <span style={{ fontWeight: 700, color: '#1A1A1A', fontSize: 13 }}>{r.partner_name}</span>
              </div>
            )}
          </div>
        ) : (
          <span style={{ fontWeight: 700, color: '#1A1A1A', fontSize: 13 }}>{r.name}</span>
        )}
      </td>

      {/* Adress */}
      <td style={{ ...s.td, fontSize: 13, color: '#374151', maxWidth: 160 }}>{r.address}</td>

      {/* Värdskap */}
      <td style={s.td}>
        <div style={{ display: 'flex', gap: 5 }}>
          {COURSES.map(c => {
            const active = r.course === c.value
            return (
              <button key={c.value}
                onClick={() => update({ course: active ? null : c.value })}
                disabled={busy}
                style={{ padding: '5px 11px', borderRadius: 20, border: `1.5px solid ${active ? c.border : '#E5E7EB'}`, background: active ? c.bg : 'white', color: active ? c.color : '#9CA3AF', fontWeight: active ? 700 : 500, fontSize: 12, cursor: 'pointer', opacity: busy ? 0.5 : 1, whiteSpace: 'nowrap' as const }}>
                {c.label}
              </button>
            )
          })}
        </div>
      </td>

      {/* Bordsnummer */}
      {hasSchedule && (
        <td style={s.td}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {tableFields.map(({ key, label }) => {
              const current = r[key]
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', width: 14 }}>{label}</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(n => {
                      const active = current === n
                      const c = tableColor(n)
                      return (
                        <button key={n}
                          onClick={() => update({ [key]: active ? null : n })}
                          disabled={busy}
                          style={{ width: 24, height: 24, borderRadius: 6, border: `1.5px solid ${active ? c.border : '#E5E7EB'}`, background: active ? c.bg : 'white', color: active ? c.text : '#9CA3AF', fontWeight: 700, fontSize: 11, cursor: 'pointer', opacity: busy ? 0.5 : 1 }}>
                          {n}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </td>
      )}
    </tr>
  )
}

// ─── Schema ───────────────────────────────────────────────────────────────────

function ScheduleTab({ registrations, collisions, hasSchedule }: {
  registrations: Registration[]
  collisions: Collision[]
  hasSchedule: boolean
}) {
  if (!hasSchedule) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px', color: '#9CA3AF' }}>
        <p style={{ fontSize: 32, margin: '0 0 12px' }}>📋</p>
        <p style={{ fontWeight: 600, fontSize: 16, color: '#374151', margin: '0 0 8px' }}>Inget schema genererat än</p>
        <p style={{ fontSize: 14 }}>Gå till Planering, tilldela värdskap och klicka Generera schema.</p>
      </div>
    )
  }

  return (
    <>
      {/* Kollisionsvarningar */}
      {collisions.length > 0 && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
          <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: 14, color: '#92400E' }}>
            ⚠️ {collisions.length} kollision{collisions.length > 1 ? 'er' : ''} – samma sällskap träffas mer än en gång
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {collisions.map((c, i) => (
              <span key={i} style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 20, padding: '4px 12px', fontSize: 13, color: '#92400E' }}>
                {c.nameA} & {c.nameB} ({c.courses.join(', ')})
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        {(['forratt', 'varmratt', 'dessert'] as Course[]).map(course => (
          <CourseBlock key={course} course={course} registrations={registrations} />
        ))}
      </div>
    </>
  )
}

function CourseBlock({ course, registrations }: { course: Course; registrations: Registration[] }) {
  const tableField = `table_${course}` as 'table_forratt' | 'table_varmratt' | 'table_dessert'
  const tableNumbers = [...new Set(registrations.map(r => r[tableField]).filter(n => n != null))].sort((a, b) => a! - b!) as number[]
  const courseInfo = COURSES.find(c => c.value === course)!

  return (
    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ background: courseInfo.bg, borderBottom: `2px solid ${courseInfo.border}`, padding: '16px 20px' }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: courseInfo.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Kurs</p>
        <h2 style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 800, color: courseInfo.color }}>{courseInfo.label}</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: courseInfo.color, opacity: 0.7 }}>{tableNumbers.length} bord · {registrations.length} sällskap</p>
      </div>
      <div style={{ padding: '16px' }}>
        {tableNumbers.map(tableNum => {
          const group = registrations.filter(r => r[tableField] === tableNum)
          const host = group.find(r => r.course === course)
          const c = tableColor(tableNum)
          return (
            <div key={tableNum} style={{ marginBottom: 14, borderRadius: 12, border: `1.5px solid ${c.border}`, overflow: 'hidden' }}>
              <div style={{ background: c.bg, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 26, height: 26, background: c.text, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'white', flexShrink: 0 }}>{tableNum}</span>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: c.text }}>
                    {host ? `Hemma hos ${displayName(host)}` : `Bord ${tableNum}`}
                  </p>
                  {host?.address && <p style={{ margin: 0, fontSize: 12, color: c.text, opacity: 0.75 }}>{host.address}</p>}
                </div>
              </div>
              <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {group.map(r => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, background: r.course === course ? c.bg : '#F3F4F6', border: `1px solid ${r.course === course ? c.border : '#E5E7EB'}`, color: r.course === course ? c.text : '#6B7280', borderRadius: 10, padding: '1px 7px', fontWeight: 700, flexShrink: 0 }}>
                      {r.course === course ? 'värd' : 'gäst'}
                    </span>
                    <span style={{ fontSize: 14, color: '#1A1A1A', fontWeight: 500 }}>{displayName(r)}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
