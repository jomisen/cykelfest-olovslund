import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const pin = request.headers.get('x-admin-pin')
  if (!pin || pin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ error: 'Obehörig' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()

  const allowedFields = ['course', 'table_forratt', 'table_varmratt', 'table_dessert']
  const hasAny = allowedFields.some(f => f in body)
  if (!hasAny) {
    return NextResponse.json({ error: 'Inga giltiga fält att uppdatera' }, { status: 400 })
  }

  try {
    const sql = getDb()
    if ('course' in body && allowedFields.includes('course')) {
      await sql`UPDATE registrations SET course = ${body.course} WHERE id = ${id}`
    }
    if ('table_forratt' in body && allowedFields.includes('table_forratt')) {
      await sql`UPDATE registrations SET table_forratt = ${body.table_forratt} WHERE id = ${id}`
    }
    if ('table_varmratt' in body && allowedFields.includes('table_varmratt')) {
      await sql`UPDATE registrations SET table_varmratt = ${body.table_varmratt} WHERE id = ${id}`
    }
    if ('table_dessert' in body && allowedFields.includes('table_dessert')) {
      await sql`UPDATE registrations SET table_dessert = ${body.table_dessert} WHERE id = ${id}`
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Update error:', err)
    return NextResponse.json({ error: 'Kunde inte uppdatera' }, { status: 500 })
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

  const { id } = await params
  try {
    const sql = getDb()
    await sql`DELETE FROM registrations WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete error:', err)
    return NextResponse.json({ error: 'Kunde inte ta bort' }, { status: 500 })
  }
}
