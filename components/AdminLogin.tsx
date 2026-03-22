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
    if (pin.length < 4) {
      setError('PIN-koden måste vara minst 4 siffror')
      return
    }
    setIsLoading(true)
    setError('')
    const ok = await onLogin(pin)
    if (!ok) {
      setError('Fel PIN-kod. Försök igen.')
      setPin('')
    }
    setIsLoading(false)
  }

  return (
    <main className="min-h-screen gradient-purple-pink-subtle flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-sm w-full animate-scale-in">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-fest-purple to-fest-pink rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-fest-purple/30">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-fest-dark">Admin</h1>
          <p className="text-gray-500 text-sm mt-1">Cykelfest – Olovslunds Trädgårdsförening</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="pin" className="block text-sm font-semibold text-gray-700 mb-2">
            PIN-kod
          </label>
          <input
            type="password"
            id="pin"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={e => { setPin(e.target.value); setError('') }}
            placeholder="••••"
            className="w-full text-center text-3xl tracking-widest px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-fest-purple focus:ring-2 focus:ring-fest-purple/20 mb-4 outline-none transition-colors"
            autoFocus
            aria-label="PIN-kod"
            aria-describedby={error ? 'pin-error' : undefined}
          />
          {error && (
            <p id="pin-error" className="text-red-600 text-sm text-center mb-4" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            aria-busy={isLoading}
            className="w-full bg-gradient-to-r from-fest-purple to-fest-pink text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {isLoading ? 'Loggar in…' : 'Logga in'}
          </button>
        </form>
      </div>
    </main>
  )
}
