import Image from 'next/image'
import Link from 'next/link'

export default function HeroSection() {
  return (
    <section className="relative min-h-[80vh] flex items-end overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/olovslund.png"
          alt="Olovslunds trädgårdsförening – ett grönt och trivsamt bostadsområde"
          fill
          className="object-cover"
          priority
          quality={85}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />
      </div>

      <div className="relative z-10 w-full px-6 pb-16 pt-8 text-white max-w-4xl mx-auto">
        <div className="animate-fade-in-up">
          <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-5 border border-white/30">
            Olovslunds Trädgårdsförening
          </span>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-4 leading-tight">
            Cykelfest<br />
            <span className="text-fest-purple-light">i Olovslund</span>
          </h1>
          <p className="text-xl sm:text-2xl opacity-90 mb-8 max-w-xl">
            En kväll för grannar – middag, cykel och nya bekantskaper.
          </p>
          <Link
            href="#anmalan"
            className="inline-flex items-center gap-2 bg-fest-purple hover:bg-fest-purple-dark text-white font-bold px-8 py-4 rounded-2xl text-lg transition-all hover:scale-105 shadow-lg shadow-fest-purple/40"
          >
            Anmäl dig nu
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
