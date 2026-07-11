import { modules } from '../lib/modules';
import { Button } from '../components/ui/button';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 p-8">
      <h1 className="text-4xl font-bold">OMNIPAY • Architecture Professionnelle</h1>
      <p className="text-slate-300">
        Plateforme fintech sécurisée: paiements, e-commerce, investissement et gestion des ressources.
      </p>
      <section className="rounded-xl border border-slate-800 p-6">
        <h2 className="mb-3 text-2xl font-semibold">Modules implémentés</h2>
        <ul className="list-disc space-y-2 pl-6 text-slate-300">
          {modules.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <div className="flex gap-3">
        <Button>Créer un compte</Button>
        <Button className="bg-slate-700 text-slate-100 hover:bg-slate-600">Connexion sécurisée</Button>
      </div>
    </main>
  );
}
