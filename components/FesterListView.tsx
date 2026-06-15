'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import type { Fest } from '@/lib/types'
import { formatFestDateLong } from '@/lib/utils'
import FestFormFields, { emptyFestForm, type FestFormState } from './FestFormFields'

interface Props {
  pin: string
  onLogout: () => void
}

function StatusBadge({ status }: { status: 'aktiv' | 'arkiverad' }) {
  const isAktiv = status === 'aktiv'
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
      background: isAktiv ? '#D1FAE5' : '#F3F4F6',
      color: isAktiv ? '#065F46' : '#6B7280',
      textTransform: 'uppercase' as const, letterSpacing: '0.06em',
    }}>{isAktiv ? 'Aktiv' : 'Arkiverad'}</span>
  )
}

export default function FesterListView({ pin, onLogout }: Props) {
  const [fester, setFester] = useState<Fest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [registrationsOpen, setRegistrationsOpen] = useState(true)
  const [showToggleModal, setShowToggleModal] = useState(false)
  const [togglingRegistrations, setTogglingRegistrations] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<FestFormState>(emptyFestForm)
  const [busy, setBusy] = useState(false)

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const [festRes, settingsRes] = await Promise.all([
        fetch('/api/fester', { headers: { 'x-admin-pin': pin } }),
        fetch('/api/settings'),
      ])
      if (!festRes.ok) throw new Error('Kunde inte hämta fester')
      const fData = await festRes.json()
      setFester(fData.fester as Fest[])
      if (settingsRes.ok) {
        const settings = await settingsRes.json()
        setRegistrationsOpen(settings.registrations_open)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Något gick fel')
    } finally {
      setIsLoading(false)
    }
  }, [pin])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleConfirmToggle = async () => {
    const newValue = !registrationsOpen
    setShowToggleModal(false)
    setTogglingRegistrations(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
        body: JSON.stringify({ registrations_open: newValue }),
      })
      if (!res.ok) throw new Error()
      setRegistrationsOpen(newValue)
    } catch {
      toast.error('Kunde inte uppdatera inställningen')
    } finally {
      setTogglingRegistrations(false)
    }
  }

  const submitCreate = async () => {
    if (!createForm.name.trim() || !createForm.event_date || !createForm.event_time.trim() || !createForm.location.trim() || !createForm.contact_email.trim()) {
      toast.error('Fyll i alla fält')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/fester', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
        body: JSON.stringify(createForm),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Kunde inte skapa fest')
      toast.success('Fest skapad')
      setCreateForm(emptyFestForm)
      setShowCreate(false)
      await fetchAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Något gick fel')
    } finally {
      setBusy(false)
    }
  }

  const aktiva = fester.filter(f => f.status === 'aktiv')
  const arkiverade = fester.filter(f => f.status === 'arkiverad')

  const s: Record<string, React.CSSProperties> = {
    page:   { minHeight: '100vh', background: '#F8F7FF', fontFamily: 'system-ui, sans-serif', color: '#1A1A1A' },
    header: { background: 'white', borderBottom: '1px solid #E5E7EB', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 12 },
    body:   { maxWidth: 1100, margin: '0 auto', padding: '24px' },
    card:   { background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Admin</p>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1A1A1A' }}>Cykelfest</h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' as const }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px' }}>
            <button
              role="switch"
              aria-checked={registrationsOpen}
              onClick={() => setShowToggleModal(true)}
              disabled={togglingRegistrations}
              style={{
                position: 'relative', width: 44, height: 24, borderRadius: 12,
                background: registrationsOpen ? '#10B981' : '#EF4444',
                border: 'none', padding: 0, flexShrink: 0,
                cursor: togglingRegistrations ? 'not-allowed' : 'pointer',
                opacity: togglingRegistrations ? 0.6 : 1,
                transition: 'background 0.2s',
              }}
            >
              <span style={{
                position: 'absolute', top: 3,
                left: registrationsOpen ? 23 : 3,
                width: 18, height: 18, borderRadius: '50%',
                background: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                transition: 'left 0.2s',
              }} />
            </button>
            <span style={{ fontSize: 14, fontWeight: 600, color: registrationsOpen ? '#065F46' : '#DC2626', whiteSpace: 'nowrap' as const }}>
              {registrationsOpen ? 'Anmälan öppen' : 'Anmälan stängd'}
            </span>
          </div>
          <button onClick={fetchAll} style={{ background: '#F3F4F6', border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#374151' }}>↻ Uppdatera</button>
          <button onClick={onLogout} style={{ background: 'none', border: 'none', fontSize: 14, color: '#9CA3AF', cursor: 'pointer' }}>Logga ut</button>
        </div>
      </header>

      <div style={s.body}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 10, marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#1A1A1A' }}>Fester</h2>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6B7280' }}>
              Klicka in på en fest för att se anmälningar och planering.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(v => !v)}
            style={{ background: '#7C3AED', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', color: 'white' }}
          >
            {showCreate ? 'Avbryt' : '+ Ny fest'}
          </button>
        </div>

        {showCreate && (
          <div style={{ ...s.card, padding: '20px 24px', marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>Skapa ny fest</h3>
            <FestFormFields form={createForm} setForm={setCreateForm} />
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button
                onClick={submitCreate}
                disabled={busy}
                style={{ background: '#7C3AED', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 14, cursor: busy ? 'not-allowed' : 'pointer', color: 'white', opacity: busy ? 0.6 : 1 }}
              >
                {busy ? 'Sparar…' : 'Skapa'}
              </button>
              <button
                onClick={() => { setShowCreate(false); setCreateForm(emptyFestForm) }}
                disabled={busy}
                style={{ background: '#F3F4F6', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#374151' }}
              >
                Avbryt
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#9CA3AF' }}>Laddar…</div>
        ) : error ? (
          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 14, padding: 24, color: '#991B1B', textAlign: 'center' }}>{error}</div>
        ) : fester.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>
            Inga fester ännu. Klicka &quot;+ Ny fest&quot; för att skapa din första.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <FesterSection title="Aktiva" fester={aktiva} s={s} />
            <FesterSection title="Arkiverade" fester={arkiverade} s={s} />
          </div>
        )}
      </div>

      {/* Modal – bekräfta toggle */}
      {showToggleModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}>
          <div style={{
            background: 'white', borderRadius: 20, padding: '32px 28px',
            maxWidth: 420, width: '100%',
            boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, marginBottom: 20,
              background: registrationsOpen ? '#FEF2F2' : '#F0FDF4',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
            }}>
              {registrationsOpen ? '🔒' : '🔓'}
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: '#1A1A1A' }}>
              {registrationsOpen ? 'Stäng anmälan?' : 'Öppna anmälan?'}
            </h2>
            <p style={{ margin: '0 0 24px', fontSize: 15, color: '#6B7280', lineHeight: 1.6 }}>
              {registrationsOpen
                ? 'Formuläret döljs från startsidan. Befintliga anmälningar påverkas inte.'
                : 'Formuläret visas igen på startsidan och besökare kan anmäla sig.'}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowToggleModal(false)}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 12, border: '1.5px solid #E5E7EB',
                  background: 'white', fontWeight: 600, fontSize: 15, cursor: 'pointer', color: '#374151',
                }}
              >
                Avbryt
              </button>
              <button
                onClick={handleConfirmToggle}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 12, border: 'none',
                  background: registrationsOpen ? '#DC2626' : '#10B981',
                  fontWeight: 700, fontSize: 15, cursor: 'pointer', color: 'white',
                }}
              >
                {registrationsOpen ? 'Ja, stäng' : 'Ja, öppna'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FesterSection({ title, fester, s }: { title: string; fester: Fest[]; s: Record<string, React.CSSProperties> }) {
  if (fester.length === 0) return null
  return (
    <div>
      <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {fester.map(f => (
          <Link
            key={f.id}
            href={`/admin/fester/${f.id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div style={{
              ...s.card, padding: '16px 20px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
              cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)' }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const, marginBottom: 6 }}>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1A1A1A' }}>{f.name}</h3>
                  <StatusBadge status={f.status} />
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>
                  📅 {formatFestDateLong(f.event_date)} · kl {f.event_time} · 📍 {f.location}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#7C3AED', fontWeight: 600 }}>
                  {f.registration_count ?? 0} {(f.registration_count ?? 0) === 1 ? 'anmälan' : 'anmälningar'}
                </p>
              </div>
              <div style={{ color: '#7C3AED', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' as const }}>
                Öppna →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
