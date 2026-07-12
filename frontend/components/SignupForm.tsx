'use client';

import { FormEvent, useState } from 'react';

type Status =
  | { type: 'idle'; message: string }
  | { type: 'loading'; message: string }
  | { type: 'success'; message: string }
  | { type: 'error'; message: string };

type RegisterPayload = {
  success?: boolean;
  token?: string;
  user?: { role?: string };
  error?: string;
  details?: string;
};

async function parsePayload(response: Response): Promise<RegisterPayload> {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text().catch(() => '');
  return {
    error: text ? `Réponse serveur inattendue (${response.status}).` : `Erreur serveur (${response.status}).`,
    details: text.slice(0, 160)
  };
}

async function registerAccount(body: Record<string, FormDataEntryValue | null>) {
  const endpoints = ['/api/auth/register', '/api/auth/register.js'];
  let lastResponse: { response: Response; payload: RegisterPayload } | null = null;

  for (const endpoint of endpoints) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const payload = await parsePayload(response);
    lastResponse = { response, payload };

    if (response.ok || response.status !== 404) {
      return lastResponse;
    }
  }

  return lastResponse;
}

export default function SignupForm() {
  const [status, setStatus] = useState<Status>({ type: 'idle', message: '' });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setStatus({ type: 'loading', message: 'Création du compte en cours...' });

    try {
      const result = await registerAccount({
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        password: formData.get('password')
      });

      if (!result) {
        setStatus({ type: 'error', message: 'Service inscription indisponible.' });
        return;
      }

      const { response, payload } = result;

      if (!response.ok) {
        const message = payload.error || `Impossible de créer le compte (${response.status}).`;
        setStatus({ type: 'error', message });
        return;
      }

      if (payload.token) {
        window.localStorage.setItem('omnipay_token', payload.token);
      }

      form.reset();
      const roleLabel = payload.user?.role === 'pdg' ? ' Compte PDG activé.' : '';
      setStatus({ type: 'success', message: `Compte créé avec succès.${roleLabel}` });
    } catch (error) {
      setStatus({ type: 'error', message: 'Connexion impossible. Vérifiez votre réseau puis réessayez.' });
    }
  }

  const statusClass =
    status.type === 'success'
      ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-200'
      : status.type === 'error'
        ? 'border-red-400/50 bg-red-500/10 text-red-200'
        : 'border-slate-600 bg-slate-800/70 text-slate-300';

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-amber-300/30 bg-slate-900/85 p-6 shadow-2xl shadow-black/25">
      <h3 className="text-2xl font-black text-white">Créer votre compte OmniPay</h3>
      <p className="mt-2 text-sm font-semibold text-slate-300">Le premier compte créé devient le compte PDG propriétaire.</p>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm font-bold text-slate-200">
          Nom complet
          <input
            required
            name="name"
            autoComplete="name"
            className="rounded-2xl border border-slate-600 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-300"
            placeholder="Votre nom"
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-slate-200">
          Email
          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            className="rounded-2xl border border-slate-600 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-300"
            placeholder="vous@email.com"
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-slate-200">
          Téléphone
          <input
            name="phone"
            autoComplete="tel"
            className="rounded-2xl border border-slate-600 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-300"
            placeholder="+229..."
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-slate-200">
          Mot de passe
          <input
            required
            minLength={8}
            type="password"
            name="password"
            autoComplete="new-password"
            className="rounded-2xl border border-slate-600 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-300"
            placeholder="8 caractères minimum"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={status.type === 'loading'}
        className="mt-6 w-full rounded-2xl bg-amber-400 px-6 py-4 text-lg font-black text-slate-950 shadow-xl shadow-amber-500/25 disabled:cursor-wait disabled:opacity-70"
      >
        {status.type === 'loading' ? 'Création...' : 'Créer mon compte'}
      </button>

      {status.message ? <p className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-bold ${statusClass}`}>{status.message}</p> : null}
    </form>
  );
}
