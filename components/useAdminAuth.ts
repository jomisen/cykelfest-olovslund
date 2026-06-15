'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'cykelfest-admin-pin'

export function useAdminAuth() {
  const [pin, setPin] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (!stored) {
      setChecking(false)
      return
    }
    let cancelled = false
    fetch('/api/registrations', { headers: { 'x-admin-pin': stored } })
      .then(res => {
        if (cancelled) return
        if (res.ok) {
          setPin(stored)
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })
    return () => { cancelled = true }
  }, [])

  const login = useCallback(async (enteredPin: string): Promise<boolean> => {
    const res = await fetch('/api/registrations', {
      headers: { 'x-admin-pin': enteredPin },
    })
    if (res.ok) {
      localStorage.setItem(STORAGE_KEY, enteredPin)
      setPin(enteredPin)
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setPin(null)
  }, [])

  return { pin, login, logout, checking }
}
