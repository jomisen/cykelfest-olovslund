import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const pin = request.headers.get('x-admin-pin')
  if (!pin || pin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ error: 'Obehörig' }, { status: 401 })
  }

  try {
    const sql = getDb()
    const data = await sql`SELECT * FROM registrations ORDER BY created_at DESC`
    return NextResponse.json({ registrations: data })
  } catch (err) {
    console.error('Fetch error:', err)
    return NextResponse.json({ error: 'Kunde inte hämta anmälningar' }, { status: 500 })
  }
}
