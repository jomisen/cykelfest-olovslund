import type { Registration, Course } from './types'

function mod(n: number, m: number): number {
  return ((n % m) + m) % m
}

/**
 * Tilldelar värdskap jämnt och slumpmässigt.
 * Returnerar en map: registrationId → course
 */
export function autoAssignHosting(registrations: Registration[]): Map<string, Course> {
  const shuffled = [...registrations].sort(() => Math.random() - 0.5)
  const n = shuffled.length
  const courses: Course[] = ['forratt', 'varmratt', 'dessert']
  const base = Math.floor(n / 3)
  const extra = n % 3
  const result = new Map<string, Course>()
  let idx = 0
  for (let c = 0; c < 3; c++) {
    const count = base + (c < extra ? 1 : 0)
    for (let i = 0; i < count; i++) {
      result.set(shuffled[idx++].id, courses[c])
    }
  }
  return result
}

/**
 * Rotationsalgoritm – garanterar inga upprepade möten när N är delbart med 3.
 * Vid N%3 != 0 blir ett par bord av storlek 4.
 *
 * Schema:
 *   Förrätt  bord j+1:  A[j], B[j], C[j]
 *   Varmrätt bord j+1:  B[j], A[(j+1) % kA], C[(j+1) % kC]   ← B är värd
 *   Dessert  bord j+1:  C[j], A[(j+1) % kA], B[(j-1) % kB]   ← C är värd
 *
 * Vilket innebär per hushåll:
 *   A[j]:  förrätt = j+1,  varmrätt = bord där B[(j-1)] är värd = (j-1)+1,  dessert = bord där C[(j-1)] är värd = (j-1)+1
 *   B[j]:  förrätt = j+1,  varmrätt = j+1 (värd),                            dessert = bord där C[(j+1)] är värd = (j+1)+1
 *   C[j]:  förrätt = j+1,  varmrätt = bord där B[(j-1)] är värd = (j-1)+1,  dessert = j+1 (värd)
 */
export function generateSchedule(
  registrations: Registration[]
): Map<string, { table_forratt: number; table_varmratt: number; table_dessert: number }> {
  const A = registrations.filter(r => r.course === 'forratt')
  const B = registrations.filter(r => r.course === 'varmratt')
  const C = registrations.filter(r => r.course === 'dessert')

  if (A.length === 0 || B.length === 0 || C.length === 0) {
    throw new Error('Alla tre rätter måste ha minst ett värd-hushåll')
  }

  const kA = A.length, kB = B.length, kC = C.length
  const result = new Map<string, { table_forratt: number; table_varmratt: number; table_dessert: number }>()

  // A[j]: värd vid förrätt bord j, gäst vid varmrätt hos B[j-1], gäst vid dessert hos C[j-1]
  for (let j = 0; j < kA; j++) {
    result.set(A[j].id, {
      table_forratt:  j + 1,
      table_varmratt: mod(j - 1, kB) + 1,
      table_dessert:  mod(j - 1, kC) + 1,
    })
  }

  // B[j]: gäst vid förrätt hos A[j], värd vid varmrätt bord j, gäst vid dessert hos C[j+1]
  for (let j = 0; j < kB; j++) {
    result.set(B[j].id, {
      table_forratt:  j + 1,
      table_varmratt: j + 1,
      table_dessert:  mod(j + 1, kC) + 1,
    })
  }

  // C[j]: gäst vid förrätt hos A[j], gäst vid varmrätt hos B[j-1], värd vid dessert bord j
  for (let j = 0; j < kC; j++) {
    result.set(C[j].id, {
      table_forratt:  j + 1,
      table_varmratt: mod(j - 1, kB) + 1,
      table_dessert:  j + 1,
    })
  }

  return result
}

export interface Collision {
  idA: string
  nameA: string
  idB: string
  nameB: string
  courses: string[]
}

/**
 * Hittar par av hushåll som träffas vid mer än en rätt.
 */
export function detectCollisions(registrations: Registration[]): Collision[] {
  const courseLabel: Record<string, string> = {
    forratt: 'Förrätt', varmratt: 'Varmrätt', dessert: 'Dessert',
  }
  const courseFields = [
    ['forratt',  'table_forratt']  as const,
    ['varmratt', 'table_varmratt'] as const,
    ['dessert',  'table_dessert']  as const,
  ]

  // Bygg map: "idA|idB" → kursnamn de träffats vid
  const meetings = new Map<string, string[]>()

  for (const [course, tableField] of courseFields) {
    const byTable = new Map<number, Registration[]>()
    for (const r of registrations) {
      const t = r[tableField]
      if (t == null) continue
      if (!byTable.has(t)) byTable.set(t, [])
      byTable.get(t)!.push(r)
    }
    for (const group of byTable.values()) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const key = [group[i].id, group[j].id].sort().join('|')
          if (!meetings.has(key)) meetings.set(key, [])
          meetings.get(key)!.push(courseLabel[course])
        }
      }
    }
  }

  const collisions: Collision[] = []
  for (const [key, courses] of meetings.entries()) {
    if (courses.length > 1) {
      const [idA, idB] = key.split('|')
      const rA = registrations.find(r => r.id === idA)!
      const rB = registrations.find(r => r.id === idB)!
      collisions.push({ idA, nameA: rA.name, idB, nameB: rB.name, courses })
    }
  }
  return collisions
}
