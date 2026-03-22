'use client'

import { useState } from 'react'
import AdminLogin from '@/components/AdminLogin'
import AdminDashboard from '@/components/AdminDashboard'

export default function AdminPage() {
  const [pin, setPin] = useState<string | null>(null)

  const handleLogin = async (enteredPin: string): Promise<boolean> => {
    const res = await fetch('/api/registrations', {
      headers: { 'x-admin-pin': enteredPin },
    })
    if (res.ok) {
      setPin(enteredPin)
      return true
    }
    return false
  }

  const handleLogout = () => setPin(null)

  if (!pin) {
    return <AdminLogin onLogin={handleLogin} />
  }

  return <AdminDashboard pin={pin} onLogout={handleLogout} />
}
