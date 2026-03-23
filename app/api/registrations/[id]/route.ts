import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { createServerClient } from '@/lib/supabase'

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
  const update: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (field in body) update[field] = body[field]
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Inga giltiga fält att uppdatera' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { error } = await supabase.from('registrations').update(update).eq('id', id)

  if (error) {
    console.error('Supabase update error:', error)
    return NextResponse.json({ error: 'Kunde inte uppdatera' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
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
  const supabase = createServerClient()
  const { error } = await supabase.from('registrations').delete().eq('id', id)

  if (error) {
    console.error('Supabase delete error:', error)
    return NextResponse.json({ error: 'Kunde inte ta bort' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
