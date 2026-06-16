import { NextResponse } from 'next/server'
import { ensureSchema, getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await ensureSchema()
    const sql = getDb()
    const rows = await sql`
      SELECT id, name, event_date::text AS event_date, event_time, location, contact_email, status, registrations_open, created_at
      FROM fester
      WHERE status = 'aktiv' AND event_date >= CURRENT_DATE
      ORDER BY event_date ASC
      LIMIT 1
    `
    if (rows.length === 0) {
      return NextResponse.json({ fest: null })
    }
    return NextResponse.json({ fest: rows[0] })
  } catch (err) {
    console.error('Current fest fetch error:', err)
    return NextResponse.json({ error: 'Kunde inte hämta aktuell fest' }, { status: 500 })
  }
}
