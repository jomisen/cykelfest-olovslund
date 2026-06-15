import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ensureSchema, getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

const schema = z
  .object({
    name: z.string().min(2, 'Namn måste vara minst 2 tecken'),
    email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Ange en giltig e-postadress'),
    phone: z.string().min(5, 'Ange ett giltigt telefonnummer'),
    address: z.string().min(3, 'Ange din adress'),
    is_pair: z.boolean(),
    partner_name: z.string().optional(),
    partner_email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Ange en giltig e-postadress för partner').optional().or(z.literal('')),
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

    const { partner_phone, notes, ...rest } = parsed.data
    const combinedNotes = [
      partner_phone ? `Partner telefon: ${partner_phone}` : null,
      notes || null,
    ].filter(Boolean).join('\n') || null

    await ensureSchema()
    const sql = getDb()

    const currentFest = await sql`
      SELECT id FROM fester
      WHERE status = 'aktiv' AND event_date >= CURRENT_DATE
      ORDER BY event_date ASC
      LIMIT 1
    `
    if (currentFest.length === 0) {
      return NextResponse.json(
        { error: 'Anmälan är stängd just nu. Ingen aktuell cykelfest är planerad.' },
        { status: 400 }
      )
    }
    const festId = currentFest[0].id

    const result = await sql`
      INSERT INTO registrations (name, email, phone, address, is_pair, partner_name, partner_email, notes, fest_id)
      VALUES (${rest.name}, ${rest.email}, ${rest.phone}, ${rest.address}, ${rest.is_pair}, ${rest.partner_name ?? null}, ${rest.partner_email ?? null}, ${combinedNotes}, ${festId})
      RETURNING id
    `

    return NextResponse.json({ success: true, id: result[0].id }, { status: 201 })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Något gick fel' }, { status: 500 })
  }
}
