export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md space-y-6 p-8">
      <h1 className="text-3xl font-bold">Connexion</h1>
      <p className="text-slate-300">Connecte-toi à ton compte OmniPay.</p>
      <form className="space-y-4" method="post" action="/api/auth/login">
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
          <span className="text-sm text-slate-300">Mot de passe</span>
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
            type="password"
            name="password"
            required
          />
        </label>
        <button className="w-full rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-900 hover:bg-emerald-400">
          Se connecter
        </button>
      </form>
    </main>
  );
}
