interface Props {
  name: string
  isPair: boolean
}

export default function SuccessState({ name, isPair }: Props) {
  const firstName = name.split(' ')[0]
  return (
    <div className="animate-scale-in" style={{ textAlign: 'center', padding: '16px 0' }}>
      <div style={{
        width: 80, height: 80, margin: '0 auto 24px',
        background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 32px rgba(124,58,237,0.4)',
        fontSize: 36
      }}>✓</div>

      <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f0ebff', marginBottom: 12 }}>
        Tack, {firstName}!
      </h2>
      <p style={{ color: 'rgba(240,235,255,0.6)', fontSize: '1.05rem', marginBottom: 32, lineHeight: 1.6 }}>
        {isPair ? 'Er' : 'Din'} anmälan är mottagen. Vi återkommer med mer<br />information om tider och adresser.
      </p>

      <div style={{
        background: 'rgba(124,58,237,0.12)',
        borderRadius: 16, padding: 28, textAlign: 'left',
        border: '1px solid rgba(124,58,237,0.25)'
      }}>
        <p style={{ fontWeight: 700, color: '#7C3AED', marginBottom: 16, fontSize: 15 }}>
          Vad händer nu?
        </p>
        {[
          'Arrangörerna sammanställer grupperna',
          'Du får veta vilken rätt ditt sällskap ansvarar för',
          'Exakta tider och adresser skickas ut i förväg',
          'Kvällen avslutas gemensamt i parken',
        ].map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, marginBottom: i < 3 ? 14 : 0 }}>
            <span style={{
              width: 28, height: 28, flexShrink: 0,
              background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
              borderRadius: '50%', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700
            }}>{i + 1}</span>
            <p style={{ margin: 0, paddingTop: 4, color: 'rgba(240,235,255,0.7)', lineHeight: 1.5 }}>{step}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
