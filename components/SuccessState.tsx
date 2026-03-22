interface Props {
  name: string
}

export default function SuccessState({ name }: Props) {
  const firstName = name.split(' ')[0]
  return (
    <div className="text-center animate-scale-in">
      <div className="mx-auto w-20 h-20 bg-gradient-to-br from-fest-purple to-fest-pink rounded-full flex items-center justify-center mb-6 shadow-lg shadow-fest-purple/30">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-3xl font-bold text-fest-dark mb-3">
        Tack, {firstName}!
      </h2>
      <p className="text-gray-600 text-lg mb-6">
        Din anmälan är mottagen. Vi återkommer med mer information om tider och adresser.
      </p>
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 text-left border border-purple-100">
        <h3 className="font-semibold text-fest-purple mb-3">Vad händer nu?</h3>
        <ul className="space-y-2 text-gray-700 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-fest-purple font-bold mt-0.5">1.</span>
            Arrangörerna sammanställer grupperna
          </li>
          <li className="flex items-start gap-2">
            <span className="text-fest-purple font-bold mt-0.5">2.</span>
            Du får veta vilken rätt ditt sällskap ansvarar för
          </li>
          <li className="flex items-start gap-2">
            <span className="text-fest-purple font-bold mt-0.5">3.</span>
            Exakta tider och adresser skickas ut i förväg
          </li>
          <li className="flex items-start gap-2">
            <span className="text-fest-purple font-bold mt-0.5">4.</span>
            Kvällen avslutas gemensamt i parken
          </li>
        </ul>
      </div>
    </div>
  )
}
