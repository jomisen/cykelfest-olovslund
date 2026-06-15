'use client'

import { useEffect, useState, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AdminLogin from '@/components/AdminLogin'
import AdminDashboard from '@/components/AdminDashboard'
import { useAdminAuth } from '@/components/useAdminAuth'
import type { Fest } from '@/lib/types'

export default function FestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { pin, login, logout, checking } = useAdminAuth()
  const [fest, setFest] = useState<Fest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!pin) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError('')
    fetch(`/api/fester/${id}`, { headers: { 'x-admin-pin': pin } })
      .then(async r => {
        if (r.status === 404) throw new Error('Festen hittades inte')
        if (!r.ok) throw new Error('Kunde inte hämta fest')
        return r.json()
      })
      .then(data => {
        if (cancelled) return
        setFest(data.fest as Fest)
      })
      .catch(err => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Något gick fel')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [pin, id])

  const handleFestChanged = useCallback((updated: Fest) => {
    setFest(updated)
  }, [])

  if (checking) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>Laddar…</div>
  }

  if (!pin) {
    return <AdminLogin onLogin={login} />
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>Laddar fest…</div>
  }

  if (error || !fest) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: 'system-ui, sans-serif' }}>
        <p style={{ color: '#991B1B', fontSize: 16 }}>{error || 'Festen hittades inte'}</p>
        <button
          onClick={() => router.push('/admin')}
          style={{ background: '#7C3AED', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: 'white' }}
        >
          Tillbaka till fester
        </button>
      </div>
    )
  }

  return (
    <AdminDashboard
      pin={pin}
      fest={fest}
      onLogout={logout}
      onFestChanged={handleFestChanged}
    />
  )
}
