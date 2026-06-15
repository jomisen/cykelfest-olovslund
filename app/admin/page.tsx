'use client'

import AdminLogin from '@/components/AdminLogin'
import FesterListView from '@/components/FesterListView'
import { useAdminAuth } from '@/components/useAdminAuth'

export default function AdminPage() {
  const { pin, login, logout, checking } = useAdminAuth()

  if (checking) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>Laddar…</div>
  }

  if (!pin) {
    return <AdminLogin onLogin={login} />
  }

  return <FesterListView pin={pin} onLogout={logout} />
}
