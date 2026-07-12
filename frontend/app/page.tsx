'use client';

import { useState, type ReactNode } from 'react';

const notices = {
  aide: 'Support OmniPay : écrivez à regisagnikpe2002@gmail.com pour toute assistance.',
  conditions: 'Conditions : utilisez OmniPay uniquement pour des opérations autorisées et vérifiées.',
  confidentialite: 'Confidentialité : vos informations de profil restent protégées dans votre espace sécurisé.',
  cookies: 'Cookies : seuls les cookies nécessaires au fonctionnement de l’application sont prévus.'
} as const;

const menuItems = [
  {
    key: 'accueil',
    label: 'Accueil',
    icon: 'home',
    title: 'Solde disponible',
    value: '125 000 XOF',
    detail: 'Envoyez, recevez et suivez vos paiements depuis un seul espace.'
  },
  {
    key: 'activite',
    label: 'Activité',
    icon: 'activity',
    title: 'Dernières opérations',
    value: '3 mouvements',
    detail: 'Paiement marchand, transfert mobile money et dépôt portefeuille.'
  },
  {
    key: 'recurrent',
    label: 'Récurrent',
    icon: 'calendar',
    title: 'Paiements programmés',
    value: '2 actifs',
    detail: 'Abonnements et envois automatiques prêts à être exécutés.'
  },
  {
    key: 'portefeuille',
    label: 'Portefeuille',
    icon: 'wallet',
    title: 'Portefeuilles connectés',
    value: 'XOF · EUR · USD',
    detail: 'Cartes, mobile money et crypto regroupés dans OmniPay.'
  },
  {
    key: 'parametres',
    label: 'Paramètres',
    icon: 'settings',
    title: 'Sécurité du compte',
    value: 'Profil vérifié',
    detail: 'Gérez votre profil, vos moyens de paiement et vos préférences.'
  }
] as const;

type IconName = (typeof menuItems)[number]['icon'] | 'edit' | 'chevron';

function Icon({ name }: { name: IconName }) {
  const common = {
    width: 28,
    height: 28,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true
  };

  const paths: Record<IconName, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></>,
    activity: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    calendar: <><path d="M7 3v4M17 3v4" /><rect x="4" y="5" width="16" height="16" rx="3" /><path d="M4 10h16M8 14h5M8 18h3" /></>,
    wallet: <><rect x="3" y="6" width="18" height="14" rx="3" /><path d="M16 13h3M6 6l11-3 1 3" /></>,
    settings: <><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /><path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.05.05a2.1 2.1 0 0 1-2.97 2.97l-.05-.05A1.8 1.8 0 0 0 14.8 19.6a1.8 1.8 0 0 0-1.08 1.65V21a2.1 2.1 0 0 1-4.2 0v-.08A1.8 1.8 0 0 0 8.4 19.3a1.8 1.8 0 0 0-1.98.36l-.05.05A2.1 2.1 0 0 1 3.4 16.74l.05-.05A1.8 1.8 0 0 0 3.8 14.7a1.8 1.8 0 0 0-1.65-1.08H2a2.1 2.1 0 0 1 0-4.2h.08A1.8 1.8 0 0 0 3.7 8.32a1.8 1.8 0 0 0-.36-1.98l-.05-.05A2.1 2.1 0 0 1 6.26 3.3l.05.05A1.8 1.8 0 0 0 8.3 3.7a1.8 1.8 0 0 0 1.08-1.65V2a2.1 2.1 0 0 1 4.2 0v.08A1.8 1.8 0 0 0 14.7 3.7a1.8 1.8 0 0 0 1.98-.36l.05-.05a2.1 2.1 0 0 1 2.97 2.97l-.05.05A1.8 1.8 0 0 0 19.3 8.3a1.8 1.8 0 0 0 1.65 1.08H21a2.1 2.1 0 0 1 0 4.2h-.08A1.8 1.8 0 0 0 19.4 15Z" /></>,
    edit: <><path d="m4 20 4.2-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" /><path d="m13.5 6.5 4 4" /></>,
    chevron: <path d="m9 6 6 6-6 6" />
  };

  return <svg {...common}>{paths[name]}</svg>;
}

export default function HomePage() {
  const [active, setActive] = useState<(typeof menuItems)[number]['key']>('accueil');
  const [notice, setNotice] = useState<string | null>(null);
  const selected = menuItems.find((item) => item.key === active) ?? menuItems[0];

  return (
    <main className="min-h-screen bg-[#f7f7f7] text-zinc-950">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-8 pb-8 pt-12">
        <header className="flex items-center gap-2 text-3xl font-black tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500 text-white">›</span>
          <span>link</span>
        </header>

        <section className="mt-20 text-center">
          <div className="relative mx-auto h-28 w-28">
            <div className="grid h-28 w-28 place-items-center rounded-full bg-emerald-500 text-5xl font-black">A</div>
            <button
              type="button"
              onClick={() => setActive('parametres')}
              className="absolute bottom-1 right-0 grid h-14 w-14 place-items-center rounded-full bg-white text-zinc-800 shadow-lg ring-1 ring-zinc-100 transition hover:scale-105"
              aria-label="Modifier le profil"
            >
              <Icon name="edit" />
            </button>
          </div>
          <h1 className="mt-10 text-3xl font-black uppercase tracking-tight sm:text-4xl">Agnikpe Regis Olatounde</h1>
          <p className="mt-5 text-xl text-zinc-500">regisagnikpe2002@gmail.com</p>
        </section>

        <section className="mt-24 overflow-hidden rounded-[22px] bg-[#ededed] px-5 py-3">
          {menuItems.map((item, index) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setActive(item.key);
                setNotice(null);
              }}
              className={`flex w-full items-center gap-6 border-zinc-300 py-5 text-left text-2xl transition ${index === menuItems.length - 1 ? '' : 'border-b'} ${active === item.key ? 'text-emerald-600' : 'text-zinc-900 hover:text-emerald-600'}`}
            >
              <span className="text-zinc-900"><Icon name={item.icon} /></span>
              <span className="flex-1">{item.label}</span>
              <span className="text-zinc-400"><Icon name="chevron" /></span>
            </button>
          ))}
        </section>

        <section className="mt-6 rounded-[22px] bg-white p-5 shadow-sm ring-1 ring-zinc-100" aria-live="polite">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">{selected.label}</p>
          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">{selected.title}</h2>
              <p className="mt-2 text-zinc-500">{selected.detail}</p>
            </div>
            <strong className="shrink-0 rounded-full bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{selected.value}</strong>
          </div>
        </section>

        {notice ? (
          <aside className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800" aria-live="polite">
            {notice}
          </aside>
        ) : null}

        <div className="mt-auto pt-14 text-center">
          <button
            type="button"
            onClick={() => setNotice(notices.aide)}
            className="rounded-full bg-[#f0f0f0] px-14 py-5 text-2xl font-bold transition hover:bg-emerald-500 hover:text-white"
          >
            Aide
          </button>
          <nav className="mt-7 flex justify-center gap-7 text-lg text-zinc-500" aria-label="Liens légaux">
            <button type="button" className="hover:text-emerald-600" onClick={() => setNotice(notices.conditions)}>Conditions</button>
            <button type="button" className="hover:text-emerald-600" onClick={() => setNotice(notices.confidentialite)}>Confidentialité</button>
            <button type="button" className="hover:text-emerald-600" onClick={() => setNotice(notices.cookies)}>Cookies</button>
          </nav>
        </div>
      </div>
    </main>
  );
}
