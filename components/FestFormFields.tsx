'use client'

export interface FestFormState {
  name: string
  event_date: string
  event_time: string
  location: string
  contact_email: string
}

export const emptyFestForm: FestFormState = {
  name: '',
  event_date: '',
  event_time: '18.00',
  location: 'Olovslund',
  contact_email: 'cykelfestolovslund@gmail.com',
}

export default function FestFormFields({ form, setForm }: { form: FestFormState; setForm: (f: FestFormState) => void }) {
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: '1.5px solid #E5E7EB',
    borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit', background: 'white', color: '#1A1A1A',
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
      <div>
        <label style={labelStyle}>Namn</label>
        <input
          type="text"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          placeholder="Cykelfest hösten 2026"
          style={inputStyle}
        />
      </div>
      <div>
        <label style={labelStyle}>Datum</label>
        <input
          type="date"
          value={form.event_date}
          onChange={e => setForm({ ...form, event_date: e.target.value })}
          style={inputStyle}
        />
      </div>
      <div>
        <label style={labelStyle}>Tid</label>
        <input
          type="text"
          value={form.event_time}
          onChange={e => setForm({ ...form, event_time: e.target.value })}
          placeholder="18.00"
          style={inputStyle}
        />
      </div>
      <div>
        <label style={labelStyle}>Plats</label>
        <input
          type="text"
          value={form.location}
          onChange={e => setForm({ ...form, location: e.target.value })}
          placeholder="Olovslund"
          style={inputStyle}
        />
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <label style={labelStyle}>Kontakt-mail</label>
        <input
          type="email"
          value={form.contact_email}
          onChange={e => setForm({ ...form, contact_email: e.target.value })}
          placeholder="cykelfestolovslund@gmail.com"
          style={inputStyle}
        />
      </div>
    </div>
  )
}
