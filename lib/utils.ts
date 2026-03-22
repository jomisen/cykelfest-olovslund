import * as XLSX from 'xlsx'
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

export function exportToExcel(registrations: Registration[]): void {
  const parsePartnerPhone = (r: Registration) =>
    r.notes?.startsWith('Partner telefon:') ? r.notes.split('\n')[0].replace('Partner telefon: ', '') : ''
  const parseNotes = (r: Registration) =>
    r.notes?.startsWith('Partner telefon:') ? r.notes.split('\n').slice(1).join('\n') : (r.notes ?? '')

  const rows = registrations.map(r => ({
    'Namn': r.name,
    'E-post': r.email,
    'Telefon': r.phone,
    'Adress': r.address,
    'Typ': r.is_pair ? 'Par' : 'Ensam',
    'Partnerns namn': r.partner_name ?? '',
    'Partnerns e-post': r.partner_email ?? '',
    'Partnerns telefon': parsePartnerPhone(r),
    'Grupp': r.group_number ? `Grupp ${r.group_number}` : '',
    'Rätt': courseLabel(r.course),
    'Kommentarer': parseNotes(r),
    'Anmälningsdatum': formatDate(r.created_at),
  }))

  const ws = XLSX.utils.json_to_sheet(rows)

  // Auto-width per kolumn
  const colWidths = Object.keys(rows[0] ?? {}).map(key => ({
    wch: Math.max(key.length, ...rows.map(r => String(r[key as keyof typeof r]).length)) + 2
  }))
  ws['!cols'] = colWidths

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Anmälningar')
  XLSX.writeFile(wb, `cykelfest-anmalningar-${new Date().toISOString().split('T')[0]}.xlsx`)
}
