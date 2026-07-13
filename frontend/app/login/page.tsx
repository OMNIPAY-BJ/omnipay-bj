import { LoginForm } from '../../components/AuthForms';

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md space-y-6 p-8">
      <a className="text-sm text-emerald-300 hover:text-emerald-200" href="/">
        Retour à l’accueil
      </a>
      <h1 className="text-3xl font-bold">Connexion</h1>
      <p className="text-slate-300">Connecte-toi à ton compte OmniPay.</p>
      <LoginForm />
    </main>
  );
}
