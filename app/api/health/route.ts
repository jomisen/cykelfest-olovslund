import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createServerClient()
  const { error } = await supabase
    .from('registrations')
    .select('id')
    .limit(1)

  if (error) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
