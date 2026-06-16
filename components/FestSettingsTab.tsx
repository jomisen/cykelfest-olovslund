'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import type { Fest, FestStatus } from '@/lib/types'
import FestFormFields, { type FestFormState } from './FestFormFields'

interface Props {
  pin: string
  fest: Fest
  onChanged: (fest: Fest) => void
  s: Record<string, React.CSSProperties>
}

export default function FestSettingsTab({ pin, fest, onChanged, s }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<FestFormState>({
    name: fest.name,
    event_date: fest.event_date,
    event_time: fest.event_time,
    location: fest.location,
    contact_email: fest.contact_email,
  })
  const [busy, setBusy] = useState(false)

  const submitEdit = async () => {
    if (!form.name.trim() || !form.event_date || !form.event_time.trim() || !form.location.trim() || !form.contact_email.trim()) {
      toast.error('Fyll i alla fält')
      return
    }
    setBusy(true)
    try {
      const res = await fetch(`/api/fester/${fest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Kunde inte uppdatera fest')
      toast.success('Fest uppdaterad')
      onChanged(json.fest as Fest)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Något gick fel')
    } finally {
      setBusy(false)
    }
  }

  const setStatus = async (status: FestStatus) => {
    setBusy(true)
    try {
      const res = await fetch(`/api/fester/${fest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
        body: JSON.stringify({ status }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Kunde inte ändra status')
      toast.success(status === 'arkiverad' ? 'Fest arkiverad' : 'Fest återaktiverad')
      onChanged(json.fest as Fest)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Något gick fel')
    } finally {
      setBusy(false)
    }
  }

  const toggleRegistrationsOpen = async () => {
    const newValue = !fest.registrations_open
    setBusy(true)
    try {
      const res = await fetch(`/api/fester/${fest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
        body: JSON.stringify({ registrations_open: newValue }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Kunde inte ändra')
      toast.success(newValue ? 'Anmälan öppen' : 'Anmälan stängd')
      onChanged(json.fest as Fest)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Något gick fel')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Ta bort festen "${fest.name}"? Detta går inte att ångra.`)) return
    setBusy(true)
    try {
      const res = await fetch(`/api/fester/${fest.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': pin },
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Kunde inte ta bort fest')
      toast.success('Fest borttagen')
      router.push('/admin')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Något gick fel')
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ ...s.card, padding: '20px 24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>Redigera fest</h3>
        <FestFormFields form={form} setForm={setForm} />
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button
            onClick={submitEdit}
            disabled={busy}
            style={{ background: '#7C3AED', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 14, cursor: busy ? 'not-allowed' : 'pointer', color: 'white', opacity: busy ? 0.6 : 1 }}
          >
            {busy ? 'Sparar…' : 'Spara'}
          </button>
        </div>
      </div>

      <div style={{ ...s.card, padding: '20px 24px' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>Anmälan</h3>
        <p style={{ margin: '0 0 16px', fontSize: 14, color: '#6B7280' }}>
          {fest.registrations_open
            ? 'Anmälan är öppen. Formuläret visas på anmälningssidan när festen är aktuell.'
            : 'Anmälan är stängd. Formuläret döljs även om festen är aktiv och har ett kommande datum.'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            role="switch"
            aria-checked={fest.registrations_open}
            onClick={toggleRegistrationsOpen}
            disabled={busy}
            style={{
              position: 'relative', width: 44, height: 24, borderRadius: 12,
              background: fest.registrations_open ? '#10B981' : '#EF4444',
              border: 'none', padding: 0, flexShrink: 0,
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.6 : 1,
              transition: 'background 0.2s',
            }}
          >
            <span style={{
              position: 'absolute', top: 3,
              left: fest.registrations_open ? 23 : 3,
              width: 18, height: 18, borderRadius: '50%',
              background: 'white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
              transition: 'left 0.2s',
            }} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: fest.registrations_open ? '#065F46' : '#DC2626' }}>
            {fest.registrations_open ? 'Anmälan öppen' : 'Anmälan stängd'}
          </span>
        </div>
      </div>

      <div style={{ ...s.card, padding: '20px 24px' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>Status</h3>
        <p style={{ margin: '0 0 16px', fontSize: 14, color: '#6B7280' }}>
          {fest.status === 'aktiv'
            ? 'Festen är aktiv. Om den har ett kommande datum visas den på anmälningssidan.'
            : 'Festen är arkiverad. Den visas inte på anmälningssidan.'}
        </p>
        {fest.status === 'aktiv' ? (
          <button
            onClick={() => setStatus('arkiverad')}
            disabled={busy}
            style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#92400E' }}
          >
            Arkivera fest
          </button>
        ) : (
          <button
            onClick={() => setStatus('aktiv')}
            disabled={busy}
            style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 10, padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#065F46' }}
          >
            Återaktivera fest
          </button>
        )}
      </div>

      <div style={{ ...s.card, padding: '20px 24px', borderColor: '#FECACA' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#991B1B' }}>Farligt</h3>
        <p style={{ margin: '0 0 16px', fontSize: 14, color: '#6B7280' }}>
          Ta bort festen permanent. Endast möjligt om festen inte har några anmälningar — annars måste du arkivera istället.
        </p>
        <button
          onClick={handleDelete}
          disabled={busy}
          style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#DC2626' }}
        >
          Ta bort fest
        </button>
      </div>
    </div>
  )
}
