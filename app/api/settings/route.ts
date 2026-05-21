import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

async function ensureTable() {
  const sql = getDb()
  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `
  await sql`
    INSERT INTO settings (key, value) VALUES ('registrations_open', 'true')
    ON CONFLICT (key) DO NOTHING
  `
}

export async function GET() {
  try {
    await ensureTable()
    const sql = getDb()
    const rows = await sql`SELECT value FROM settings WHERE key = 'registrations_open'`
    const registrationsOpen = rows[0]?.value !== 'false'
    return NextResponse.json({ registrations_open: registrationsOpen })
  } catch {
    return NextResponse.json({ error: 'Serverfel' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const pin = req.headers.get('x-admin-pin')
  if (pin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ error: 'Obehörig' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const { registrations_open } = body
    if (typeof registrations_open !== 'boolean') {
      return NextResponse.json({ error: 'Ogiltigt värde' }, { status: 400 })
    }
    await ensureTable()
    const sql = getDb()
    await sql`
      INSERT INTO settings (key, value)
      VALUES ('registrations_open', ${registrations_open ? 'true' : 'false'})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Serverfel' }, { status: 500 })
  }
}
