'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Registration, Course } from '@/lib/types'
import { detectCollisions, type Collision } from '@/lib/schedule'
import { formatDate, exportToExcel } from '@/lib/utils'

interface Props {
  pin: string
  onLogout: () => void
}

type FilterCourse = 'all' | Course | 'unassigned'
type FilterType = 'all' | 'pair' | 'single'
type Tab = 'list' | 'schedule'

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

export default function AdminDashboard({ pin, onLogout }: Props) {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterCourse, setFilterCourse] = useState<FilterCourse>('all')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [updating, setUpdating] = useState<Record<string, boolean>>({})
  const [generating, setGenerating] = useState(false)
  const [tab, setTab] = useState<Tab>('list')
  const [collisions, setCollisions] = useState<Collision[]>([])

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

  const handleUpdate = async (id: string, update: Partial<Pick<Registration, 'course' | 'table_forratt' | 'table_varmratt' | 'table_dessert'>>) => {
    setUpdating(p => ({ ...p, [id]: true }))
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
    } finally {
      setUpdating(p => ({ ...p, [id]: false }))
    }
  }

  const handleGenerateAction = async (action: 'auto-hosting' | 'generate') => {
    if (action === 'generate') {
      const unassigned = registrations.filter(r => !r.course).length
      if (unassigned > 0) {
        alert(`${unassigned} hushåll saknar värdskapsrätt. Tilldela alla först.`)
        return
      }
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

  const filtered = registrations.filter(r => {
    if (filterType === 'pair' && !r.is_pair) return false
    if (filterType === 'single' && r.is_pair) return false
    if (filterCourse === 'unassigned' && r.course) return false
    if (filterCourse !== 'all' && filterCourse !== 'unassigned' && r.course !== filterCourse) return false
    return true
  })

  const stats = {
    total: registrations.length,
    pairs: registrations.filter(r => r.is_pair).length,
    singles: registrations.filter(r => !r.is_pair).length,
    withHost: registrations.filter(r => r.course).length,
    scheduled: registrations.filter(r => r.table_forratt).length,
  }

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
      {/* Header */}
      <header style={s.header}>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Admin</p>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1A1A1A' }}>Cykelfest – Olovslund</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchRegistrations} style={{ background: '#F3F4F6', border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#374151' }}>
            ↻ Uppdatera
          </button>
          <button onClick={() => exportToExcel(registrations)} style={{ background: '#D1FAE5', border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#065F46' }}>
            ↓ Excel
          </button>
          <button onClick={onLogout} style={{ background: 'none', border: 'none', fontSize: 14, color: '#9CA3AF', cursor: 'pointer' }}>
            Logga ut
          </button>
        </div>
      </header>

      <div style={s.body}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Totalt',       value: stats.total,     bg: '#7C3AED', text: 'white' },
            { label: 'Par',          value: stats.pairs,     bg: '#FCE7F3', text: '#9D174D' },
            { label: 'Ensamma',      value: stats.singles,   bg: '#DBEAFE', text: '#1E40AF' },
            { label: 'Värd tilldelad', value: stats.withHost, bg: '#D1FAE5', text: '#065F46' },
            { label: 'Schemalagda', value: stats.scheduled,  bg: '#FEF3C7', text: '#92400E' },
          ].map(stat => (
            <div key={stat.label} style={{ background: stat.bg, borderRadius: 14, padding: '16px 20px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: stat.text }}>{stat.value}</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 500, color: stat.text, opacity: 0.8 }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Kollisionsvarningar */}
        {collisions.length > 0 && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 14, padding: '16px 20px', marginBottom: 16 }}>
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

        {/* Schema-knappar */}
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
            disabled={generating || stats.withHost < registrations.length}
            title={stats.withHost < registrations.length ? 'Alla hushåll måste ha värdskap tilldelat först' : ''}
            style={{ background: stats.withHost === registrations.length && registrations.length > 0 ? '#7C3AED' : '#E5E7EB', border: 'none', borderRadius: 10, padding: '8px 18px', fontWeight: 600, fontSize: 14, cursor: stats.withHost === registrations.length && registrations.length > 0 ? 'pointer' : 'not-allowed', color: stats.withHost === registrations.length && registrations.length > 0 ? 'white' : '#9CA3AF', opacity: generating ? 0.6 : 1 }}
          >
            {generating ? 'Genererar…' : '✨ Generera schema'}
          </button>
          {stats.withHost < registrations.length && registrations.length > 0 && (
            <span style={{ fontSize: 13, color: '#EF4444' }}>
              {registrations.length - stats.withHost} hushåll saknar värdskap
            </span>
          )}
        </div>

        {/* Flikar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {(['list', 'schedule'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '8px 20px', borderRadius: 10, border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                background: tab === t ? '#1A1A1A' : '#F3F4F6',
                color: tab === t ? 'white' : '#6B7280',
              }}>
              {t === 'list' ? 'Anmälningar' : 'Schema'}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#9CA3AF' }}>Laddar…</div>
        ) : error ? (
          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 14, padding: 24, color: '#991B1B', textAlign: 'center' }}>{error}</div>
        ) : tab === 'list' ? (
          <ListTab
            filtered={filtered} registrations={registrations}
            filterType={filterType} setFilterType={setFilterType}
            filterCourse={filterCourse} setFilterCourse={setFilterCourse}
            updating={updating} handleUpdate={handleUpdate}
            s={s}
          />
        ) : (
          <ScheduleTab registrations={registrations} />
        )}
      </div>
    </div>
  )
}

// ─── List Tab ────────────────────────────────────────────────────────────────

function ListTab({ filtered, registrations, filterType, setFilterType, filterCourse, setFilterCourse, updating, handleUpdate, s }: {
  filtered: Registration[]
  registrations: Registration[]
  filterType: FilterType
  setFilterType: (v: FilterType) => void
  filterCourse: FilterCourse
  setFilterCourse: (v: FilterCourse) => void
  updating: Record<string, boolean>
  handleUpdate: (id: string, update: Partial<Pick<Registration, 'course' | 'table_forratt' | 'table_varmratt' | 'table_dessert'>>) => Promise<void>
  s: Record<string, React.CSSProperties>
}) {
  return (
    <>
      {/* Filter */}
      <div style={{ ...s.card, padding: '14px 20px', marginBottom: 16, display: 'flex', flexWrap: 'wrap' as const, gap: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {([['all','Alla'], ['pair','Par'], ['single','Ensamma']] as const).map(([val, label]) => (
            <button key={val} onClick={() => setFilterType(val)}
              style={{ padding: '6px 14px', borderRadius: 20, border: '1.5px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: filterType === val ? '#7C3AED' : 'white',
                color: filterType === val ? 'white' : '#6B7280',
                borderColor: filterType === val ? '#7C3AED' : '#E5E7EB',
              }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 24, background: '#E5E7EB' }} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
          {([['all','Alla rätter'], ['forratt','Förrätt'], ['varmratt','Varmrätt'], ['dessert','Dessert'], ['unassigned','Ej tilldelad']] as const).map(([val, label]) => (
            <button key={val} onClick={() => setFilterCourse(val)}
              style={{ padding: '6px 14px', borderRadius: 20, border: '1.5px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: filterCourse === val ? '#1A1A1A' : 'white',
                color: filterCourse === val ? 'white' : '#6B7280',
                borderColor: filterCourse === val ? '#1A1A1A' : '#E5E7EB',
              }}>
              {label}
            </button>
          ))}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#9CA3AF' }}>
          {filtered.length} av {registrations.length} visas
        </span>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#9CA3AF' }}>Inga anmälningar att visa</div>
      ) : (
        <div style={s.card}>
          <div style={{ overflowX: 'auto' as const }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 14 }}>
              <thead>
                <tr>
                  <th style={s.th}>Namn</th>
                  <th style={s.th}>Kontakt</th>
                  <th style={s.th}>Adress</th>
                  <th style={s.th}>Ansvarar för</th>
                  <th style={s.th}>Bord F / V / D</th>
                  <th style={s.th}>Datum</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const partnerPhone = r.notes?.startsWith('Partner telefon:') ? r.notes.split('\n')[0].replace('Partner telefon: ', '') : null
                  const userNotes = r.notes?.startsWith('Partner telefon:') ? r.notes.split('\n').slice(1).join('\n') : r.notes

                  return (
                    <tr key={r.id} style={{ background: 'white', transition: 'background 0.2s' }}>

                      {/* Namn */}
                      <td style={s.td}>
                        {r.is_pair ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                        {userNotes && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>{userNotes}</p>}
                      </td>

                      {/* Kontakt */}
                      <td style={s.td}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <span style={{ color: '#374151' }}>{r.email}</span>
                          <span style={{ fontSize: 12, color: '#9CA3AF' }}>{r.phone}</span>
                          {r.is_pair && r.partner_email && (
                            <>
                              <span style={{ fontSize: 12, color: '#EC4899', marginTop: 4 }}>{r.partner_email}</span>
                              {partnerPhone && <span style={{ fontSize: 12, color: '#9CA3AF' }}>{partnerPhone}</span>}
                            </>
                          )}
                        </div>
                      </td>

                      {/* Adress */}
                      <td style={{ ...s.td, maxWidth: 150 }}>
                        <span style={{ color: '#374151' }}>{r.address}</span>
                      </td>

                      {/* Ansvarar för (värdskap) */}
                      <td style={s.td}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {COURSES.map(c => {
                            const active = r.course === c.value
                            return (
                              <button key={c.value}
                                onClick={() => handleUpdate(r.id, { course: active ? null : c.value })}
                                disabled={updating[r.id]}
                                style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${active ? c.border : '#E5E7EB'}`, background: active ? c.bg : 'white', color: active ? c.color : '#9CA3AF', fontWeight: active ? 700 : 500, fontSize: 13, cursor: 'pointer', textAlign: 'left' as const, opacity: updating[r.id] ? 0.5 : 1 }}>
                                {c.label}
                              </button>
                            )
                          })}
                        </div>
                      </td>

                      {/* Bordsnummer per rätt */}
                      <td style={s.td}>
                        <TableNumberEditor r={r} updating={updating} handleUpdate={handleUpdate} />
                      </td>

                      {/* Datum */}
                      <td style={{ ...s.td, whiteSpace: 'nowrap' as const }}>
                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>{formatDate(r.created_at)}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Bordsnummer-editor ───────────────────────────────────────────────────────

function TableNumberEditor({ r, updating, handleUpdate }: {
  r: Registration
  updating: Record<string, boolean>
  handleUpdate: (id: string, update: Partial<Pick<Registration, 'table_forratt' | 'table_varmratt' | 'table_dessert'>>) => Promise<void>
}) {
  const maxTables = 12

  const fields: { key: 'table_forratt' | 'table_varmratt' | 'table_dessert'; label: string }[] = [
    { key: 'table_forratt',  label: 'F' },
    { key: 'table_varmratt', label: 'V' },
    { key: 'table_dessert',  label: 'D' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {fields.map(({ key, label }) => {
        const current = r[key]
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', width: 14 }}>{label}</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {Array.from({ length: maxTables }, (_, i) => i + 1).map(n => {
                const active = current === n
                const c = tableColor(n)
                return (
                  <button key={n}
                    onClick={() => handleUpdate(r.id, { [key]: active ? null : n })}
                    disabled={updating[r.id]}
                    title={`Bord ${n}`}
                    style={{ width: 24, height: 24, borderRadius: 6, border: `1.5px solid ${active ? c.border : '#E5E7EB'}`, background: active ? c.bg : 'white', color: active ? c.text : '#9CA3AF', fontWeight: 700, fontSize: 11, cursor: 'pointer', opacity: updating[r.id] ? 0.5 : 1 }}>
                    {n}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Schedule Tab ─────────────────────────────────────────────────────────────

function ScheduleTab({ registrations }: { registrations: Registration[] }) {
  const hasSchedule = registrations.some(r => r.table_forratt)

  if (!hasSchedule) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px', color: '#9CA3AF' }}>
        <p style={{ fontSize: 32, margin: '0 0 12px' }}>📋</p>
        <p style={{ fontWeight: 600, fontSize: 16, color: '#374151', margin: '0 0 8px' }}>Inget schema genererat än</p>
        <p style={{ fontSize: 14 }}>Tilldela värdskap till alla hushåll och klicka Generera schema.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
      {(['forratt', 'varmratt', 'dessert'] as Course[]).map(course => (
        <CourseBlock key={course} course={course} registrations={registrations} />
      ))}
    </div>
  )
}

function CourseBlock({ course, registrations }: { course: Course; registrations: Registration[] }) {
  const tableField = `table_${course}` as 'table_forratt' | 'table_varmratt' | 'table_dessert'
  const tableNumbers = [...new Set(registrations.map(r => r[tableField]).filter(Boolean))].sort((a, b) => a! - b!) as number[]

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
                    {host ? `Hemma hos ${host.name}${host.partner_name ? ' & ' + host.partner_name : ''}` : `Bord ${tableNum}`}
                  </p>
                  {host?.address && <p style={{ margin: 0, fontSize: 12, color: c.text, opacity: 0.75 }}>{host.address}</p>}
                </div>
              </div>
              <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {group.map(r => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {r.course === course ? (
                      <span style={{ fontSize: 11, background: c.bg, border: `1px solid ${c.border}`, color: c.text, borderRadius: 10, padding: '1px 7px', fontWeight: 700, flexShrink: 0 }}>värd</span>
                    ) : (
                      <span style={{ fontSize: 11, background: '#F3F4F6', color: '#6B7280', borderRadius: 10, padding: '1px 7px', flexShrink: 0 }}>gäst</span>
                    )}
                    <span style={{ fontSize: 14, color: '#1A1A1A', fontWeight: 500 }}>
                      {r.name}{r.partner_name ? ` & ${r.partner_name}` : ''}
                    </span>
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
