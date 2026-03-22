'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Registration, Course } from '@/lib/types'
import { formatDate, exportToCSV } from '@/lib/utils'

interface Props {
  pin: string
  onLogout: () => void
}

type FilterCourse = 'all' | Course | 'unassigned'
type FilterType = 'all' | 'pair' | 'single'

const GROUP_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  1:  { bg: '#EDE9FE', text: '#5B21B6', border: '#C4B5FD' },
  2:  { bg: '#FCE7F3', text: '#9D174D', border: '#F9A8D4' },
  3:  { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
  4:  { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  5:  { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
  6:  { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
  7:  { bg: '#F0FDF4', text: '#14532D', border: '#86EFAC' },
  8:  { bg: '#FFF7ED', text: '#9A3412', border: '#FDBA74' },
  9:  { bg: '#F0F9FF', text: '#0C4A6E', border: '#7DD3FC' },
  10: { bg: '#FDF4FF', text: '#701A75', border: '#E879F9' },
  11: { bg: '#F8FAFC', text: '#334155', border: '#94A3B8' },
  12: { bg: '#FFFBEB', text: '#78350F', border: '#FDE68A' },
}

const COURSES: { value: Course; label: string; color: string; bg: string }[] = [
  { value: 'forratt',  label: 'Förrätt',  color: '#92400E', bg: '#FEF3C7' },
  { value: 'varmratt', label: 'Varmrätt', color: '#9A3412', bg: '#FFF7ED' },
  { value: 'dessert',  label: 'Dessert',  color: '#9D174D', bg: '#FCE7F3' },
]

export default function AdminDashboard({ pin, onLogout }: Props) {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterCourse, setFilterCourse] = useState<FilterCourse>('all')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [updating, setUpdating] = useState<Record<string, boolean>>({})

  const fetchRegistrations = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/registrations', { headers: { 'x-admin-pin': pin } })
      if (!res.ok) throw new Error('Kunde inte hämta anmälningar')
      const data = await res.json()
      setRegistrations(data.registrations)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Något gick fel')
    } finally {
      setIsLoading(false)
    }
  }, [pin])

  useEffect(() => { fetchRegistrations() }, [fetchRegistrations])

  const handleUpdate = async (id: string, update: Partial<Pick<Registration, 'group_number' | 'course'>>) => {
    setUpdating(p => ({ ...p, [id]: true }))
    try {
      const res = await fetch(`/api/registrations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
        body: JSON.stringify(update),
      })
      if (!res.ok) throw new Error()
      setRegistrations(prev => prev.map(r => r.id === id ? { ...r, ...update } : r))
    } catch {
      alert('Kunde inte uppdatera. Försök igen.')
    } finally {
      setUpdating(p => ({ ...p, [id]: false }))
    }
  }

  const filtered = registrations.filter(r => {
    if (filterType === 'pair' && !r.is_pair) return false
    if (filterType === 'single' && r.is_pair) return false
    if (filterCourse === 'unassigned' && (r.group_number || r.course)) return false
    if (filterCourse !== 'all' && filterCourse !== 'unassigned' && r.course !== filterCourse) return false
    return true
  })

  const stats = {
    total: registrations.length,
    pairs: registrations.filter(r => r.is_pair).length,
    singles: registrations.filter(r => !r.is_pair).length,
    forratt: registrations.filter(r => r.course === 'forratt').length,
    varmratt: registrations.filter(r => r.course === 'varmratt').length,
    dessert: registrations.filter(r => r.course === 'dessert').length,
    unassigned: registrations.filter(r => !r.course).length,
  }

  const s: Record<string, React.CSSProperties> = {
    page:    { minHeight: '100vh', background: '#F8F7FF', fontFamily: 'system-ui, sans-serif', color: '#1A1A1A' },
    header:  { background: 'white', borderBottom: '1px solid #E5E7EB', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    body:    { maxWidth: 1300, margin: '0 auto', padding: '24px 24px' },
    card:    { background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
    th:      { padding: '10px 16px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: '#6B7280', background: '#F9FAFB', textAlign: 'left' as const, borderBottom: '1px solid #E5E7EB' },
    td:      { padding: '14px 16px', borderBottom: '1px solid #F3F4F6', verticalAlign: 'top' as const },
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
          <button onClick={fetchRegistrations} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F3F4F6', border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#374151' }}>
            ↻ Uppdatera
          </button>
          <button onClick={() => exportToCSV(registrations)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#D1FAE5', border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#065F46' }}>
            ↓ Exportera CSV
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
            { label: 'Totalt', value: stats.total,     bg: '#7C3AED', text: 'white' },
            { label: 'Par',    value: stats.pairs,     bg: '#FCE7F3', text: '#9D174D' },
            { label: 'Ensamma',value: stats.singles,   bg: '#DBEAFE', text: '#1E40AF' },
            { label: 'Förrätt',value: stats.forratt,   bg: '#FEF3C7', text: '#92400E' },
            { label: 'Varmrätt',value: stats.varmratt, bg: '#FFF7ED', text: '#9A3412' },
            { label: 'Dessert',value: stats.dessert,   bg: '#FCE7F3', text: '#9D174D' },
          ].map(stat => (
            <div key={stat.label} style={{ background: stat.bg, borderRadius: 14, padding: '16px 20px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: stat.text }}>{stat.value}</p>
              <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 500, color: stat.text, opacity: 0.7 }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{ ...s.card, padding: '14px 20px', marginBottom: 16, display: 'flex', flexWrap: 'wrap' as const, gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {([['all','Alla'], ['pair','Par'], ['single','Ensamma']] as const).map(([val, label]) => (
              <button key={val} onClick={() => setFilterType(val)}
                style={{ padding: '6px 14px', borderRadius: 20, border: '1.5px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                  background: filterType === val ? '#7C3AED' : 'white',
                  color: filterType === val ? 'white' : '#6B7280',
                  borderColor: filterType === val ? '#7C3AED' : '#E5E7EB',
                }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ width: 1, height: 24, background: '#E5E7EB' }} />
          <div style={{ display: 'flex', gap: 6 }}>
            {([['all','Alla rätter'], ['forratt','Förrätt'], ['varmratt','Varmrätt'], ['dessert','Dessert'], ['unassigned','Ej tilldelade']] as const).map(([val, label]) => (
              <button key={val} onClick={() => setFilterCourse(val)}
                style={{ padding: '6px 14px', borderRadius: 20, border: '1.5px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
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

        {/* Tabell */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#9CA3AF' }}>Laddar…</div>
        ) : error ? (
          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 14, padding: 24, color: '#991B1B', textAlign: 'center' }}>{error}</div>
        ) : filtered.length === 0 ? (
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
                    <th style={s.th}>Grupp</th>
                    <th style={s.th}>Rätt</th>
                    <th style={s.th}>Datum</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => {
                    const grpColor = r.group_number ? GROUP_COLORS[r.group_number] : null
                    const partnerPhone = r.notes?.startsWith('Partner telefon:') ? r.notes.split('\n')[0].replace('Partner telefon: ', '') : null
                    const userNotes = r.notes?.startsWith('Partner telefon:') ? r.notes.split('\n').slice(1).join('\n') : r.notes

                    return (
                      <tr key={r.id} style={{ background: grpColor ? grpColor.bg + '55' : 'white', transition: 'background 0.2s' }}>

                        {/* Navn */}
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
                          {userNotes && (
                            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>{userNotes}</p>
                          )}
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
                        <td style={{ ...s.td, maxWidth: 140 }}>
                          <span style={{ color: '#374151' }}>{r.address}</span>
                        </td>

                        {/* Grupp – klickbara siffror */}
                        <td style={s.td}>
                          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5 }}>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(n => {
                              const c = GROUP_COLORS[n]
                              const active = r.group_number === n
                              return (
                                <button
                                  key={n}
                                  onClick={() => handleUpdate(r.id, { group_number: active ? null : n })}
                                  disabled={updating[r.id]}
                                  title={`Grupp ${n}`}
                                  style={{
                                    width: 30, height: 30, borderRadius: 8,
                                    border: `2px solid ${active ? c.border : '#E5E7EB'}`,
                                    background: active ? c.bg : 'white',
                                    color: active ? c.text : '#9CA3AF',
                                    fontWeight: 700, fontSize: 13,
                                    cursor: 'pointer', transition: 'all 0.15s',
                                    opacity: updating[r.id] ? 0.5 : 1,
                                  }}
                                >
                                  {n}
                                </button>
                              )
                            })}
                          </div>
                        </td>

                        {/* Rätt – klickbara pills */}
                        <td style={s.td}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {COURSES.map(c => {
                              const active = r.course === c.value
                              return (
                                <button
                                  key={c.value}
                                  onClick={() => handleUpdate(r.id, { course: active ? null : c.value })}
                                  disabled={updating[r.id]}
                                  style={{
                                    padding: '5px 12px', borderRadius: 20,
                                    border: `1.5px solid ${active ? c.color : '#E5E7EB'}`,
                                    background: active ? c.bg : 'white',
                                    color: active ? c.color : '#9CA3AF',
                                    fontWeight: active ? 700 : 500, fontSize: 13,
                                    cursor: 'pointer', transition: 'all 0.15s',
                                    opacity: updating[r.id] ? 0.5 : 1,
                                    textAlign: 'left' as const,
                                  }}
                                >
                                  {c.label}
                                </button>
                              )
                            })}
                          </div>
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
      </div>
    </div>
  )
}
