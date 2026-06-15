import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

let initialized = false
let initPromise: Promise<void> | null = null

async function runSchema(sql: NeonQueryFunction<false, false>) {
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

  await sql`
    CREATE TABLE IF NOT EXISTS fester (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      event_date DATE NOT NULL,
      event_time TEXT NOT NULL DEFAULT '18.00',
      location TEXT NOT NULL DEFAULT 'Olovslund',
      contact_email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'aktiv',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    ALTER TABLE registrations
      ADD COLUMN IF NOT EXISTS fest_id INTEGER REFERENCES fester(id)
  `

  const festCount = await sql`SELECT COUNT(*)::int AS count FROM fester`
  if (festCount[0].count === 0) {
    const regCount = await sql`SELECT COUNT(*)::int AS count FROM registrations`
    if (regCount[0].count > 0) {
      const inserted = await sql`
        INSERT INTO fester (name, event_date, event_time, location, contact_email, status)
        VALUES ('Cykelfest i Olovslund juni 2026', '2026-06-12', '18.00', 'Olovslund', 'cykelfestolovslund@gmail.com', 'aktiv')
        RETURNING id
      `
      const festId = inserted[0].id
      await sql`UPDATE registrations SET fest_id = ${festId} WHERE fest_id IS NULL`
    }
  }
}

export function getDb() {
  return neon(process.env.DATABASE_URL!)
}

export async function ensureSchema() {
  if (initialized) return
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await runSchema(getDb())
        initialized = true
      } catch (err) {
        initPromise = null
        throw err
      }
    })()
  }
  return initPromise
}
