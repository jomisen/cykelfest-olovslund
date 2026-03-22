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
  notes: string | null
  group_number: number | null
  course: 'forratt' | 'varmratt' | 'dessert' | null
}

export type Course = 'forratt' | 'varmratt' | 'dessert'

export interface RegistrationFormData {
  name: string
  email: string
  phone: string
  address: string
  is_pair: boolean
  partner_name?: string
  partner_email?: string
  notes?: string
}
