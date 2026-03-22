import HeroSection from '@/components/HeroSection'
import RegistrationForm from '@/components/RegistrationForm'

export default function Home() {
  return (
    <main id="main-content">
      <HeroSection />

      {/* Om cykelfesten */}
      <section className="max-w-3xl mx-auto px-4 py-14">
        <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-10 border border-purple-100 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl" aria-hidden="true">🚲</span>
            <h2 className="text-3xl font-bold text-fest-purple">Om Cykelfesten</h2>
          </div>

          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              Olovslunds Trädgårdsförening bjuder in till en cykelfest – en social och rörlig middag
              där vi tillsammans upptäcker varandra och området på ett nytt sätt.
            </p>
            <p>
              Under kvällen delas deltagarna in i mindre sällskap. Varje sällskap ansvarar för en rätt
              (förrätt, varmrätt eller dessert) som serveras hemma hos er. Samtidigt kommer ni själva
              att förflytta er mellan olika hem i Olovslund för att äta kvällens övriga rätter.
              Ni får i förväg veta var ni ska vara för varje stopp.
            </p>
            <p>
              Förflyttning sker till fots eller med cykel – välj det som passar er bäst.
            </p>
            <p>
              Kvällen avslutas gemensamt i parken där vi samlas för en drink och avrundar tillsammans.
            </p>
          </div>

          <div className="mt-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
            <h3 className="font-bold text-fest-dark mb-4 text-lg">Bra att veta</h3>
            <ul className="space-y-3">
              {[
                'Endast för vuxna',
                'Du kan anmäla dig som par eller ensam (vi sätter ihop grupper)',
                'Du ansvarar för en av kvällens rätter',
                'Exakta tider och adresser skickas ut i förväg',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-700">
                  <span className="w-6 h-6 bg-fest-purple text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-8 text-gray-600 italic border-l-4 border-fest-purple pl-4">
            Det här är ett enkelt sätt att träffa fler i området, dela en middag och få en rolig kväll tillsammans.
          </p>
        </div>
      </section>

      {/* Anmälningsformulär */}
      <section className="max-w-3xl mx-auto px-4 pb-20" id="anmalan">
        <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-10 border border-purple-100">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl" aria-hidden="true">✍️</span>
            <h2 className="text-3xl font-bold text-fest-purple">Anmäl dig</h2>
          </div>
          <p className="text-gray-500 mb-8">Välkommen att anmäla dig! Vi återkommer med mer detaljer.</p>
          <RegistrationForm />
        </div>
      </section>

      <footer className="text-center py-8 text-gray-400 text-sm border-t border-gray-100">
        © Olovslunds Trädgårdsförening
      </footer>
    </main>
  )
}
