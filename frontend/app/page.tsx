import SignupForm from '../components/SignupForm';

const exchangeRates = [
  '1 EUR = 655.96 FCFA',
  '1 USD = 601.45 FCFA',
  '1 GBP = 761.20 FCFA'
];

const languages = ['FR', 'EN', 'PT'];

const themes = [
  {
    name: 'Bénin Premium',
    accent: 'from-emerald-400 to-teal-500',
    description: 'Identité locale forte, couleurs fraîches et rassurantes pour inspirer confiance.'
  },
  {
    name: 'Diaspora Monde',
    accent: 'from-amber-300 to-orange-500',
    description: 'Mise en avant des transferts internationaux, paiements et conversions rapides.'
  },
  {
    name: 'Finance Sécurisée',
    accent: 'from-sky-400 to-indigo-500',
    description: 'Style bancaire sombre, lisible et professionnel pour garder les utilisateurs.'
  }
];

const services = [
  'Transferts & paiements MoMo, Flooz, Celtis',
  'Convertisseur FCFA, EUR, USD, GBP',
  'Cartes virtuelles, crypto et cartes cadeaux',
  'Interface multilingue FR, EN, PT'
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#06111f] text-white">
      <section className="relative border-b border-emerald-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.25),_transparent_34%),linear-gradient(135deg,#0b1729_0%,#07101d_52%,#0b221d_100%)] px-5 py-6 sm:px-8 lg:px-14">
        <div className="absolute inset-x-0 top-24 border-y border-emerald-300/10 bg-slate-900/55 py-2 text-sm font-bold text-amber-300">
          <div className="flex animate-pulse gap-8 whitespace-nowrap px-4">
            {exchangeRates.map((rate) => (
              <span key={rate}>📊 {rate}</span>
            ))}
          </div>
        </div>

        <nav className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="text-3xl font-black tracking-tight sm:text-4xl">
            Omni<span className="text-emerald-400">pay</span>{' '}
            <span className="text-sm font-extrabold uppercase text-amber-400">Bénin</span>
          </div>
          <div className="flex items-center gap-2">
            {languages.map((lang, index) => (
              <span
                key={lang}
                className={`rounded-xl px-3 py-2 text-sm font-black ${
                  index === 0 ? 'bg-emerald-400 text-white' : 'bg-slate-700/80 text-slate-300'
                }`}
              >
                {lang}
              </span>
            ))}
            <a className="rounded-2xl bg-emerald-400 px-4 py-3 font-black text-white shadow-lg shadow-emerald-500/25" href="#connexion">
              Connexion
            </a>
          </div>
        </nav>

        <div className="relative z-10 mx-auto mt-32 max-w-6xl text-center">
          <span className="inline-flex rounded-full border border-amber-400/40 bg-amber-400/10 px-5 py-2 text-sm font-black text-amber-300">
            🌍 Bénin · Afrique · Europe · Monde
          </span>
          <h1 className="mt-8 text-6xl font-black tracking-tight sm:text-7xl">
            Omni<span className="text-emerald-400">pay</span>
          </h1>
          <p className="mt-5 text-2xl font-bold text-slate-300">Une autre finance est possible.</p>
          <p className="mt-3 text-xl font-black text-emerald-400">Honnête. Africaine. Mondiale. 🇧🇯</p>

          <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
            <a className="rounded-2xl bg-amber-400 px-8 py-5 text-xl font-black text-slate-950 shadow-xl shadow-amber-500/25" href="#creer-compte">
              🚀 Créer mon compte
            </a>
            <a className="rounded-2xl border border-slate-500 bg-slate-800/80 px-8 py-5 text-xl font-black text-white" href="#connexion">
              Connexion
            </a>
          </div>

          <div className="mx-auto mt-12 max-w-3xl rounded-3xl border border-emerald-400/40 bg-emerald-950/25 p-6 shadow-2xl shadow-emerald-950/40">
            <h2 className="text-lg font-black uppercase tracking-widest text-amber-300">⚡ Convertisseur en direct</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_160px]">
              <div className="rounded-2xl border border-slate-500 bg-slate-700/60 px-5 py-4 text-left text-2xl font-black">100000</div>
              <div className="rounded-2xl border border-indigo-400/40 bg-indigo-950 px-5 py-4 text-left text-2xl font-bold">FCFA</div>
              <div className="rounded-2xl border border-indigo-400/40 bg-indigo-950 px-5 py-4 text-left text-2xl font-bold sm:col-span-2">EUR</div>
            </div>
            <div className="mt-5 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-6 py-5 text-4xl font-black text-emerald-400">
              152.45 EUR
            </div>
            <p className="mt-4 font-semibold text-slate-400">Commission Omnipay: 2.5% · Transparent & Honnête</p>
          </div>
        </div>
      </section>

      <section id="creer-compte" className="px-5 py-14 sm:px-8 lg:px-14">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.35em] text-amber-300">Ouverture de compte</p>
            <h2 className="mt-3 text-4xl font-black">Créez votre compte et gardez vos accès OmniPay.</h2>
            <p className="mt-4 max-w-2xl text-lg text-slate-300">
              Le bouton “Créer mon compte” ouvre maintenant ce formulaire et enregistre le compte via l’API OmniPay.
            </p>
            <div id="connexion" className="mt-6 grid gap-3">
              {services.map((service) => (
                <div key={service} className="rounded-2xl border border-slate-700 bg-slate-900/75 p-4 font-bold text-slate-200">
                  {service}
                </div>
              ))}
            </div>
          </div>
          <SignupForm />
        </div>

        <div className="mx-auto mt-10 grid max-w-6xl gap-5 md:grid-cols-3">
          {themes.map((theme) => (
            <article key={theme.name} className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6 shadow-xl shadow-black/20">
              <div className={`h-2 rounded-full bg-gradient-to-r ${theme.accent}`} />
              <h3 className="mt-5 text-2xl font-black">{theme.name}</h3>
              <p className="mt-3 text-slate-300">{theme.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
