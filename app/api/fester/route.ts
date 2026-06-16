import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ensureSchema, getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  name: z.string().min(2, 'Namn måste vara minst 2 tecken'),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum måste vara i formatet YYYY-MM-DD'),
  event_time: z.string().min(1, 'Tid är obligatorisk'),
  location: z.string().min(1, 'Plats är obligatorisk'),
  contact_email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Ange en giltig e-postadress'),
  status: z.enum(['aktiv', 'arkiverad']).optional(),
})

export async function GET(request: NextRequest) {
  const pin = request.headers.get('x-admin-pin')
  if (!pin || pin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ error: 'Obehörig' }, { status: 401 })
  }
  try {
    await ensureSchema()
    const sql = getDb()
    const rows = await sql`
      SELECT
        f.id, f.name, f.event_date::text AS event_date, f.event_time, f.location, f.contact_email, f.status, f.registrations_open, f.is_current, f.created_at,
        (SELECT COUNT(*)::int FROM registrations WHERE fest_id = f.id) AS registration_count
      FROM fester f
      ORDER BY f.event_date DESC, f.created_at DESC
    `
    return NextResponse.json({ fester: rows })
  } catch (err) {
    console.error('Fester fetch error:', err)
    return NextResponse.json({ error: 'Kunde inte hämta fester' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const pin = request.headers.get('x-admin-pin')
  if (!pin || pin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ error: 'Obehörig' }, { status: 401 })
  }
  try {
    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ogiltiga uppgifter', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { name, event_date, event_time, location, contact_email, status } = parsed.data
    await ensureSchema()
    const sql = getDb()
    const newStatus = status ?? 'aktiv'
    const existingCurrent = await sql`SELECT COUNT(*)::int AS count FROM fester WHERE is_current = true`
    const newIsCurrent = newStatus === 'aktiv' && existingCurrent[0].count === 0
    // Endast den synliga festen kan ha anmälan öppen
    const newRegistrationsOpen = newIsCurrent
    const inserted = await sql`
      INSERT INTO fester (name, event_date, event_time, location, contact_email, status, registrations_open, is_current)
      VALUES (${name}, ${event_date}, ${event_time}, ${location}, ${contact_email}, ${newStatus}, ${newRegistrationsOpen}, ${newIsCurrent})
      RETURNING id
    `
    const newId = inserted[0].id
    const rows = await sql`
      SELECT id, name, event_date::text AS event_date, event_time, location, contact_email, status, registrations_open, is_current, created_at
      FROM fester WHERE id = ${newId}
    `
    return NextResponse.json({ fest: rows[0] }, { status: 201 })
  } catch (err) {
    console.error('Fester create error:', err)
    return NextResponse.json({ error: 'Kunde inte skapa fest' }, { status: 500 })
  }
}
