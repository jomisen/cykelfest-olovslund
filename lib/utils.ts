import type { Registration } from './types'

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function courseLabel(course: string | null): string {
  const labels: Record<string, string> = {
    forratt: 'Förrätt',
    varmratt: 'Varmrätt',
    dessert: 'Dessert',
  }
  return course ? (labels[course] ?? course) : 'Ej tilldelad'
}

export function exportToCSV(registrations: Registration[]): void {
  const headers = [
    'Namn', 'E-post', 'Telefon', 'Adress', 'Typ',
    'Partnerns namn', 'Partnerns e-post', 'Grupp', 'Rätt', 'Kommentarer', 'Anmälningsdatum',
  ]
  const rows = registrations.map(r => [
    r.name, r.email, r.phone, r.address,
    r.is_pair ? 'Par' : 'Ensam',
    r.partner_name ?? '', r.partner_email ?? '',
    r.group_number ? `Grupp ${r.group_number}` : '',
    courseLabel(r.course), r.notes ?? '',
    formatDate(r.created_at),
  ])
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cykelfest-anmalningar-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
