export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-md space-y-6 p-8">
      <h1 className="text-3xl font-bold">Créer un compte</h1>
      <p className="text-slate-300">Ouvre ton compte OmniPay en quelques secondes.</p>
      <form className="space-y-4" method="post" action="/api/auth/register">
        <label className="block space-y-2">
          <span className="text-sm text-slate-300">Nom</span>
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
            type="text"
            name="name"
            required
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm text-slate-300">Email</span>
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
            type="email"
            name="email"
            required
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm text-slate-300">Téléphone</span>
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
            type="tel"
            name="phone"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm text-slate-300">Mot de passe</span>
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
            type="password"
            name="password"
            minLength={8}
            required
          />
        </label>
        <button className="w-full rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-900 hover:bg-emerald-400">
          Créer mon compte
        </button>
      </form>
    </main>
  );
}
