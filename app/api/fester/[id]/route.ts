import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ensureSchema, getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  event_time: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  contact_email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/).optional(),
  status: z.enum(['aktiv', 'arkiverad']).optional(),
  registrations_open: z.boolean().optional(),
  is_current: z.boolean().optional(),
})

function parseId(raw: string): number | null {
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const pin = request.headers.get('x-admin-pin')
  if (!pin || pin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ error: 'Obehörig' }, { status: 401 })
  }
  const { id: raw } = await params
  const id = parseId(raw)
  if (id === null) return NextResponse.json({ error: 'Ogiltigt id' }, { status: 400 })

  try {
    await ensureSchema()
    const sql = getDb()
    const rows = await sql`
      SELECT id, name, event_date::text AS event_date, event_time, location, contact_email, status, registrations_open, is_current, created_at
      FROM fester WHERE id = ${id}
    `
    if (rows.length === 0) return NextResponse.json({ error: 'Fest hittades inte' }, { status: 404 })
    return NextResponse.json({ fest: rows[0] })
  } catch (err) {
    console.error('Fest fetch error:', err)
    return NextResponse.json({ error: 'Kunde inte hämta fest' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const pin = request.headers.get('x-admin-pin')
  if (!pin || pin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ error: 'Obehörig' }, { status: 401 })
  }
  const { id: raw } = await params
  const id = parseId(raw)
  if (id === null) return NextResponse.json({ error: 'Ogiltigt id' }, { status: 400 })

  try {
    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ogiltiga uppgifter', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const updates = parsed.data
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Inga fält att uppdatera' }, { status: 400 })
    }
    await ensureSchema()
    const sql = getDb()

    // Validera: registrations_open=true kräver att festen är (eller blir) is_current.
    if (updates.registrations_open === true) {
      const existing = await sql`SELECT is_current FROM fester WHERE id = ${id}`
      if (existing.length === 0) {
        return NextResponse.json({ error: 'Fest hittades inte' }, { status: 404 })
      }
      const finalIsCurrent = 'is_current' in updates ? updates.is_current : existing[0].is_current
      if (!finalIsCurrent) {
        return NextResponse.json(
          { error: 'Anmälan kan bara öppnas på festen som syns på sidan. Markera festen som synlig först.' },
          { status: 409 }
        )
      }
    }

    if ('name' in updates) await sql`UPDATE fester SET name = ${updates.name!} WHERE id = ${id}`
    if ('event_date' in updates) await sql`UPDATE fester SET event_date = ${updates.event_date!} WHERE id = ${id}`
    if ('event_time' in updates) await sql`UPDATE fester SET event_time = ${updates.event_time!} WHERE id = ${id}`
    if ('location' in updates) await sql`UPDATE fester SET location = ${updates.location!} WHERE id = ${id}`
    if ('contact_email' in updates) await sql`UPDATE fester SET contact_email = ${updates.contact_email!} WHERE id = ${id}`
    if ('status' in updates) await sql`UPDATE fester SET status = ${updates.status!} WHERE id = ${id}`

    // is_current ändras före registrations_open så att registrations_open-uppdateringen sker mot rätt visibility-state.
    if ('is_current' in updates) {
      if (updates.is_current === true) {
        // Den här festen blir synlig — alla andra tappar både visibility och anmälan
        await sql`UPDATE fester SET is_current = false, registrations_open = false WHERE id != ${id}`
        await sql`UPDATE fester SET is_current = true WHERE id = ${id}`
      } else {
        // Den här festen döljs — anmälan stängs samtidigt eftersom den nu vore meningslös
        await sql`UPDATE fester SET is_current = false, registrations_open = false WHERE id = ${id}`
      }
    }

    if ('registrations_open' in updates) {
      await sql`UPDATE fester SET registrations_open = ${updates.registrations_open!} WHERE id = ${id}`
    }
    const rows = await sql`
      SELECT id, name, event_date::text AS event_date, event_time, location, contact_email, status, registrations_open, is_current, created_at
      FROM fester WHERE id = ${id}
    `
    return NextResponse.json({ fest: rows[0] })
  } catch (err) {
    console.error('Fest update error:', err)
    return NextResponse.json({ error: 'Kunde inte uppdatera fest' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const pin = request.headers.get('x-admin-pin')
  if (!pin || pin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ error: 'Obehörig' }, { status: 401 })
  }
  const { id: raw } = await params
  const id = parseId(raw)
  if (id === null) return NextResponse.json({ error: 'Ogiltigt id' }, { status: 400 })

  try {
    await ensureSchema()
    const sql = getDb()
    const used = await sql`SELECT COUNT(*)::int AS count FROM registrations WHERE fest_id = ${id}`
    if (used[0].count > 0) {
      return NextResponse.json(
        { error: 'Festen har anmälningar och kan inte tas bort. Arkivera den istället.' },
        { status: 409 }
      )
    }
    await sql`DELETE FROM fester WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Fest delete error:', err)
    return NextResponse.json({ error: 'Kunde inte ta bort fest' }, { status: 500 })
  }
}
