import Image from 'next/image'
import Link from 'next/link'

export default function HeroSection() {
  return (
    <section style={{ position: 'relative', height: '90vh', minHeight: '600px', overflow: 'hidden' }}>
      {/* Hero-bild */}
      <Image
        src="/olovslund.png"
        alt="Olovslunds trädgårdsförening"
        fill
        style={{ objectFit: 'cover', objectPosition: 'center' }}
        priority
        sizes="100vw"
      />

      {/* Gradient-overlay */}
      <div className="hero-gradient" style={{ position: 'absolute', inset: 0 }} />

      {/* Dekorativa cirklar */}
      <div style={{
        position: 'absolute', top: '10%', right: '8%',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', left: '5%',
        width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(236,72,153,0.25) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Textinnehåll */}
      <div className="animate-fade-in-up" style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '0 24px 64px',
        maxWidth: 900,
        margin: '0 auto'
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: 100, padding: '6px 18px',
          marginBottom: 20
        }}>
          <span style={{ fontSize: 14, color: 'white', fontWeight: 600, letterSpacing: '0.05em' }}>
            🌿 Olovslunds Trädgårdsförening
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(3rem, 8vw, 6rem)',
          fontWeight: 900,
          color: 'white',
          lineHeight: 1.05,
          marginBottom: 16,
          textShadow: '0 2px 20px rgba(0,0,0,0.3)'
        }}>
          Cykelfest<br />
          <span style={{ color: '#C4B5FD' }}>i Olovslund</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
          color: 'rgba(255,255,255,0.88)',
          marginBottom: 36,
          maxWidth: 520,
          lineHeight: 1.5
        }}>
          En kväll för grannar – middag, cykel och nya bekantskaper.
        </p>

        <Link href="#anmalan" style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
          color: 'white', fontWeight: 700,
          padding: '16px 36px', borderRadius: 16,
          fontSize: 18, textDecoration: 'none',
          boxShadow: '0 8px 32px rgba(124,58,237,0.45)',
          transition: 'transform 0.2s, box-shadow 0.2s'
        }}>
          Anmäl dig nu
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </Link>
      </div>
    </section>
  )
}
