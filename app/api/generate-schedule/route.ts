import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { generateSchedule, autoAssignHosting } from '@/lib/schedule'
import type { Registration } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const pin = request.headers.get('x-admin-pin')
  if (!pin || pin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ error: 'Obehörig' }, { status: 401 })
  }

  const body = await request.json()
  const { action } = body // 'generate' | 'auto-hosting' | 'reset'

  try {
    const sql = getDb()
    const data = await sql`SELECT * FROM registrations ORDER BY created_at ASC`
    const registrations = data as Registration[]

    if (action === 'auto-hosting') {
      const assignments = autoAssignHosting(registrations)
      const updates = Array.from(assignments.entries()).map(([id, course]) => ({ id, course }))
      for (const { id, course } of updates) {
        await sql`UPDATE registrations SET course = ${course} WHERE id = ${id}`
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
        await sql`
          UPDATE registrations
          SET table_forratt = ${tables.table_forratt ?? null},
              table_varmratt = ${tables.table_varmratt ?? null},
              table_dessert = ${tables.table_dessert ?? null}
          WHERE id = ${id}
        `
      }

      return NextResponse.json({ success: true, generated: schedule.size })
    }

    if (action === 'reset') {
      await sql`UPDATE registrations SET table_forratt = NULL, table_varmratt = NULL, table_dessert = NULL`
      return NextResponse.json({ success: true })
    }

    if (action === 'reset-all') {
      await sql`UPDATE registrations SET course = NULL, table_forratt = NULL, table_varmratt = NULL, table_dessert = NULL`
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Okänd action' }, { status: 400 })
  } catch (err) {
    console.error('Generate schedule error:', err)
    return NextResponse.json({ error: 'Kunde inte hämta anmälningar' }, { status: 500 })
  }
}
