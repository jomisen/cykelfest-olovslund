'use client'

import { useState } from 'react'

interface Props {
  onLogin: (pin: string) => Promise<boolean>
}

export default function AdminLogin({ onLogin }: Props) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pin.length < 4) { setError('PIN-koden måste vara minst 4 siffror'); return }
    setIsLoading(true)
    setError('')
    const ok = await onLogin(pin)
    if (!ok) { setError('Fel PIN-kod. Försök igen.'); setPin('') }
    setIsLoading(false)
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #f5f3ff 0%, #fdf2f8 50%, #ede9fe 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
    }}>
      <div className="card animate-scale-in" style={{ padding: '48px 40px', maxWidth: 380, width: '100%', textAlign: 'center' }}>
        <div style={{
          width: 60, height: 60, margin: '0 auto 20px',
          background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
          borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(124,58,237,0.35)', fontSize: 26
        }}>🔐</div>

        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1A1A1A', margin: '0 0 6px' }}>Admin</h1>
        <p style={{ color: '#9CA3AF', marginBottom: 32, fontSize: 14 }}>
          Cykelfest – Olovslunds Trädgårdsförening
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="pin" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8, textAlign: 'left' }}>
            PIN-kod
          </label>
          <input
            type="password" id="pin" inputMode="numeric" maxLength={6}
            value={pin} onChange={e => { setPin(e.target.value); setError('') }}
            placeholder="••••••"
            autoFocus aria-label="PIN-kod"
            style={{
              width: '100%', textAlign: 'center', fontSize: 28, letterSpacing: '0.4em',
              padding: '16px 16px', border: `2px solid ${error ? '#ef4444' : 'rgba(124,58,237,0.4)'}`,
              borderRadius: 12, outline: 'none', marginBottom: 12,
              background: 'rgba(255,255,255,0.92)', color: '#1A1A1A',
              fontFamily: 'inherit', boxSizing: 'border-box',
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            }}
          />
          {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }} role="alert">{error}</p>}
          <button
            type="submit" disabled={isLoading}
            className="purple-gradient-btn"
            style={{ width: '100%', padding: '14px', borderRadius: 12, fontSize: 16 }}
          >
            {isLoading ? 'Loggar in…' : 'Logga in'}
          </button>
        </form>
      </div>
    </main>
  )
}
