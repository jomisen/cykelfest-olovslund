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
      const res = await fetch('/api/registrations', {
        headers: { 'x-admin-pin': pin },
      })
      if (!res.ok) throw new Error('Kunde inte hämta anmälningar')
      const data = await res.json()
      setRegistrations(data.registrations)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Något gick fel')
    } finally {
      setIsLoading(false)
    }
  }, [pin])

  useEffect(() => {
    fetchRegistrations()
  }, [fetchRegistrations])

  const handleUpdate = async (id: string, update: Partial<Pick<Registration, 'group_number' | 'course'>>) => {
    setUpdating(p => ({ ...p, [id]: true }))
    try {
      const res = await fetch(`/api/registrations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
        body: JSON.stringify(update),
      })
      if (!res.ok) throw new Error()
      setRegistrations(prev =>
        prev.map(r => (r.id === id ? { ...r, ...update } : r))
      )
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

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-fest-dark">Cykelfest – Admin</h1>
            <p className="text-sm text-gray-500">Olovslunds Trädgårdsförening</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => exportToCSV(registrations)}
              className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              Exportera CSV
            </button>
            <button
              onClick={fetchRegistrations}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Uppdatera
            </button>
            <button
              onClick={onLogout}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Logga ut
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Totalt', value: stats.total, color: 'bg-fest-purple text-white' },
            { label: 'Par', value: stats.pairs, color: 'bg-pink-100 text-pink-700' },
            { label: 'Ensamma', value: stats.singles, color: 'bg-blue-100 text-blue-700' },
            { label: 'Förrätt', value: stats.forratt, color: 'bg-amber-100 text-amber-700' },
            { label: 'Varmrätt', value: stats.varmratt, color: 'bg-orange-100 text-orange-700' },
            { label: 'Dessert', value: stats.dessert, color: 'bg-rose-100 text-rose-700' },
          ].map(stat => (
            <div key={stat.label} className={`${stat.color} rounded-2xl p-4 text-center`}>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-sm font-medium opacity-80 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 flex flex-wrap gap-3">
          <div>
            <label htmlFor="filter-type" className="text-xs font-semibold text-gray-500 block mb-1">Typ</label>
            <select
              id="filter-type"
              value={filterType}
              onChange={e => setFilterType(e.target.value as FilterType)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-fest-purple focus:border-transparent"
            >
              <option value="all">Alla ({registrations.length})</option>
              <option value="pair">Par ({stats.pairs})</option>
              <option value="single">Ensamma ({stats.singles})</option>
            </select>
          </div>
          <div>
            <label htmlFor="filter-course" className="text-xs font-semibold text-gray-500 block mb-1">Rätt</label>
            <select
              id="filter-course"
              value={filterCourse}
              onChange={e => setFilterCourse(e.target.value as FilterCourse)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-fest-purple focus:border-transparent"
            >
              <option value="all">Alla rätter</option>
              <option value="forratt">Förrätt ({stats.forratt})</option>
              <option value="varmratt">Varmrätt ({stats.varmratt})</option>
              <option value="dessert">Dessert ({stats.dessert})</option>
              <option value="unassigned">Ej tilldelade ({stats.unassigned})</option>
            </select>
          </div>
          <div className="ml-auto self-end text-sm text-gray-500">
            Visar {filtered.length} av {registrations.length}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-20 text-gray-500">Laddar anmälningar…</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-center">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">Inga anmälningar att visa</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Namn</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Kontakt</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Adress</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Typ</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Grupp</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Rätt</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Datum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-fest-dark">{r.name}</p>
                        {r.is_pair && r.partner_name && (
                          <p className="text-xs text-gray-500 mt-0.5">+ {r.partner_name}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <p>{r.email}</p>
                        <p className="text-xs text-gray-400">{r.phone}</p>
                        {r.is_pair && r.partner_email && (
                          <p className="text-xs text-gray-400 mt-0.5">{r.partner_email}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-32">
                        <p className="truncate">{r.address}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold ${r.is_pair ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                          {r.is_pair ? 'Par' : 'Ensam'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={r.group_number ?? ''}
                          onChange={e => handleUpdate(r.id, { group_number: e.target.value ? Number(e.target.value) : null })}
                          disabled={updating[r.id]}
                          aria-label={`Grupp för ${r.name}`}
                          className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-fest-purple focus:border-transparent disabled:opacity-50 w-full"
                        >
                          <option value="">–</option>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                            <option key={n} value={n}>Grupp {n}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={r.course ?? ''}
                          onChange={e => handleUpdate(r.id, { course: (e.target.value as Course) || null })}
                          disabled={updating[r.id]}
                          aria-label={`Rätt för ${r.name}`}
                          className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-fest-purple focus:border-transparent disabled:opacity-50 w-full"
                        >
                          <option value="">–</option>
                          <option value="forratt">Förrätt</option>
                          <option value="varmratt">Varmrätt</option>
                          <option value="dessert">Dessert</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {formatDate(r.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
