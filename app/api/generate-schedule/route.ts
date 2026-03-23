import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { createServerClient } from '@/lib/supabase'
import { generateSchedule, autoAssignHosting } from '@/lib/schedule'
import type { Registration } from '@/lib/types'

export async function POST(request: NextRequest) {
  const pin = request.headers.get('x-admin-pin')
  if (!pin || pin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ error: 'Obehörig' }, { status: 401 })
  }

  const body = await request.json()
  const { action } = body // 'generate' | 'auto-hosting'

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .order('created_at', { ascending: true })

  if (error || !data) {
    return NextResponse.json({ error: 'Kunde inte hämta anmälningar' }, { status: 500 })
  }

  const registrations = data as Registration[]

  if (action === 'auto-hosting') {
    const assignments = autoAssignHosting(registrations)
    const updates = Array.from(assignments.entries()).map(([id, course]) => ({ id, course }))
    for (const { id, course } of updates) {
      await supabase.from('registrations').update({ course }).eq('id', id)
    }
    return NextResponse.json({ success: true, updated: updates.length })
  }

  if (action === 'generate') {
    let schedule: ReturnType<typeof generateSchedule>
    try {
      schedule = generateSchedule(registrations)
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Kunde inte generera schema' },
        { status: 400 }
      )
    }

    for (const [id, tables] of schedule.entries()) {
      const { error: updateError } = await supabase
        .from('registrations')
        .update(tables)
        .eq('id', id)
      if (updateError) {
        console.error('Update error for', id, updateError)
      }
    }

    return NextResponse.json({ success: true, generated: schedule.size })
  }

  return NextResponse.json({ error: 'Okänd action' }, { status: 400 })
}
