export interface Registration {
  id: string
  created_at: string
  name: string
  email: string
  phone: string
  address: string
  is_pair: boolean
  partner_name: string | null
  partner_email: string | null
  partner_phone: string | null
  notes: string | null
  course: 'forratt' | 'varmratt' | 'dessert' | null
  table_forratt: number | null
  table_varmratt: number | null
  table_dessert: number | null
  fest_id: number | null
}

export type Course = 'forratt' | 'varmratt' | 'dessert'

export type FestStatus = 'aktiv' | 'arkiverad'

export interface Fest {
  id: number
  name: string
  event_date: string
  event_time: string
  location: string
  contact_email: string
  status: FestStatus
  created_at: string
  registration_count?: number
}

export interface RegistrationFormData {
  name: string
  email: string
  phone: string
  address: string
  is_pair: boolean
  partner_name?: string
  partner_email?: string
  partner_phone?: string
  notes?: string
}
