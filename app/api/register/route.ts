import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase'

const schema = z
  .object({
    name: z.string().min(2, 'Namn måste vara minst 2 tecken'),
    email: z.string().email('Ange en giltig e-postadress'),
    phone: z.string().min(5, 'Ange ett giltigt telefonnummer'),
    address: z.string().min(3, 'Ange din adress'),
    is_pair: z.boolean(),
    partner_name: z.string().optional(),
    partner_email: z.string().email('Ange en giltig e-postadress för partner').optional().or(z.literal('')),
    partner_phone: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    data => {
      if (data.is_pair) {
        return !!data.partner_name?.trim() && !!data.partner_email?.trim() && !!data.partner_phone?.trim()
      }
      return true
    },
    { message: 'Partnerns namn, e-post och telefon krävs vid par-anmälan' }
  )

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ogiltiga uppgifter', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Bygg insert-objektet utan partner_phone (kolumnen kanske saknas)
    // Lägg istället till partner_phone i notes-fältet
    const { partner_phone, notes, ...rest } = parsed.data
    const combinedNotes = [
      partner_phone ? `Partner telefon: ${partner_phone}` : null,
      notes || null,
    ].filter(Boolean).join('\n') || undefined

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('registrations')
      .insert([{ ...rest, notes: combinedNotes }])
      .select('id')
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: 'Kunde inte spara anmälan' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data.id }, { status: 201 })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Något gick fel' }, { status: 500 })
  }
}
