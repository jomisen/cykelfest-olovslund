import HeroSection from '@/components/HeroSection'
import RegistrationForm from '@/components/RegistrationForm'

const muted = 'rgba(240,235,255,0.6)'
const text = '#f0ebff'

export default function Home() {
  return (
    <main id="main-content" className="page-bg">
      <HeroSection />

      {/* Om cykelfesten */}
      <section style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px 0' }}>
        <div className="card animate-fade-in" style={{ padding: 'clamp(24px, 6vw, 48px)' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <div style={{
              width: 48, height: 48,
              background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
              borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0, boxShadow: '0 4px 16px rgba(124,58,237,0.5)'
            }}>🚲</div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                Om evenemanget
              </p>
              <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 800, margin: 0, color: text }}>
                Cykelfest i Olovslund
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 15, color: '#a78bfa', fontWeight: 600 }}>12 juni · kl 18.00</p>
            </div>
          </div>

          <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: muted, marginBottom: 20 }}>
            Olovslunds Trädgårdsförening bjuder in till en cykelfest – en social och rörlig middag
            där vi tillsammans lär känna varandra och området på ett nytt sätt.
          </p>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: muted, marginBottom: 20 }}>
            Varje anmält hushåll ansvarar för en rätt – förrätt, varmrätt eller dessert –
            som serveras hemma hos er. Under kvällen rör sig alla mellan varandras hem: ni äter
            förrätten hos ett hushåll, varmrätten hos ett annat och desserten hos ett tredje.
            Det innebär att ni träffar nya människor vid varje stopp. Ni får i förväg veta
            var ni ska vara och när.
          </p>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: muted, marginBottom: 32 }}>
            Förflyttning sker till fots eller med cykel – välj det som passar er bäst. Kvällen
            avslutas gemensamt i parken där vi samlas för en drink och avrundar tillsammans.
          </p>

          {/* Bra att veta */}
          <div style={{
            background: 'rgba(124,58,237,0.12)',
            borderRadius: 18, padding: 32,
            border: '1px solid rgba(124,58,237,0.25)'
          }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 20, color: text }}>
              Bra att veta
            </h3>
            <div style={{ display: 'grid', gap: 16 }}>
              {[
                { icon: '🏡', text: 'Endast för medlemmar i Olovslunds Trädgårdsförening' },
                { icon: '🔞', text: 'Endast för vuxna' },
                { icon: '👫', text: 'Du kan anmäla dig som par eller ensam – vi sätter ihop grupper' },
                { icon: '🍽️', text: 'Du ansvarar för en av kvällens rätter' },
                { icon: '📍', text: 'Exakta tider och adresser skickas ut i förväg' },
                { icon: '✉️', text: <>Frågor? Hör av dig till <a href="mailto:cykelfestolovslund@gmail.com" style={{ color: '#a78bfa' }}>cykelfestolovslund@gmail.com</a></> },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <span style={{
                    width: 38, height: 38,
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: 10, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 18, flexShrink: 0,
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>{item.icon}</span>
                  <p style={{ margin: 0, paddingTop: 8, color: muted, lineHeight: 1.5, wordBreak: 'break-word', minWidth: 0 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            marginTop: 32, borderLeft: '3px solid #7C3AED',
            paddingLeft: 20, color: muted, fontStyle: 'italic', lineHeight: 1.7
          }}>
            Det här är ett enkelt sätt att träffa fler i området, dela en middag och få en rolig kväll tillsammans.
          </div>
        </div>
      </section>

      {/* Anmälningssektion */}
      <section id="anmalan" style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 100px' }}>
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{
            background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
            padding: '36px 48px 32px'
          }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
              Anmälan
            </p>
            <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 800, color: 'white', margin: 0 }}>
              Välkommen att anmäla dig!
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: 8, marginBottom: 0 }}>
              Vi återkommer med mer detaljer om tider och platser.
            </p>
          </div>
          <div style={{ padding: '40px 48px' }}>
            <RegistrationForm />
          </div>
        </div>
      </section>

      <footer style={{
        textAlign: 'center', padding: '32px 24px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        color: 'rgba(240,235,255,0.3)', fontSize: 14
      }}>
        © Olovslunds Trädgårdsförening
      </footer>
    </main>
  )
}
