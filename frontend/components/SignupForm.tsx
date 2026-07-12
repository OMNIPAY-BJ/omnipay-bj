'use client';

import { FormEvent, useEffect, useState } from 'react';

type Status =
  | { type: 'idle'; message: string }
  | { type: 'loading'; message: string }
  | { type: 'success'; message: string }
  | { type: 'error'; message: string };

type AuthMode = 'register' | 'login';

type AccountUser = {
  id?: number;
  email?: string;
  name?: string;
  phone?: string;
  role?: string;
  balance?: string | number;
};

type AuthPayload = {
  success?: boolean;
  token?: string;
  user?: AccountUser;
  error?: string;
  details?: string;
};

async function parsePayload(response: Response): Promise<AuthPayload> {
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

async function submitAuth(mode: AuthMode, body: Record<string, FormDataEntryValue | null>) {
  const endpoints = mode === 'register' ? ['/api/auth/register', '/api/auth/register.js'] : ['/api/auth/login', '/api/auth/login.js'];
  let lastResponse: { response: Response; payload: AuthPayload } | null = null;

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

function saveSession(payload: AuthPayload) {
  if (payload.token) {
    window.localStorage.setItem('omnipay_token', payload.token);
  }

  if (payload.user) {
    window.localStorage.setItem('omnipay_user', JSON.stringify(payload.user));
  }
}

function loadSession(): AccountUser | null {
  try {
    const token = window.localStorage.getItem('omnipay_token');
    const rawUser = window.localStorage.getItem('omnipay_user');
    return token && rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
}

export default function SignupForm() {
  const [mode, setMode] = useState<AuthMode>('register');
  const [user, setUser] = useState<AccountUser | null>(null);
  const [status, setStatus] = useState<Status>({ type: 'idle', message: '' });

  useEffect(() => {
    setUser(loadSession());
  }, []);

  function logout() {
    window.localStorage.removeItem('omnipay_token');
    window.localStorage.removeItem('omnipay_user');
    setUser(null);
    setStatus({ type: 'idle', message: '' });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setStatus({
      type: 'loading',
      message: mode === 'register' ? 'Création du compte en cours...' : 'Connexion en cours...'
    });

    try {
      const result = await submitAuth(mode, {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        password: formData.get('password')
      });

      if (!result) {
        setStatus({ type: 'error', message: 'Service compte indisponible.' });
        return;
      }

      const { response, payload } = result;

      if (!response.ok) {
        const fallback = mode === 'register' && response.status === 409
          ? 'Un compte existe déjà avec cet email. Utilisez Connexion ci-dessous.'
          : `Opération impossible (${response.status}).`;
        setStatus({ type: 'error', message: payload.error || fallback });
        return;
      }

      saveSession(payload);
      setUser(payload.user || loadSession());
      form.reset();

      const roleLabel = payload.user?.role === 'pdg' ? ' Compte PDG activé.' : '';
      setStatus({
        type: 'success',
        message: mode === 'register' ? `Compte créé et connecté avec succès.${roleLabel}` : 'Connexion réussie.'
      });
    } catch {
      setStatus({ type: 'error', message: 'Connexion impossible. Vérifiez votre réseau puis réessayez.' });
    }
  }

  const statusClass =
    status.type === 'success'
      ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-200'
      : status.type === 'error'
        ? 'border-red-400/50 bg-red-500/10 text-red-200'
        : 'border-slate-600 bg-slate-800/70 text-slate-300';

  if (user) {
    return (
      <section className="rounded-3xl border border-emerald-300/40 bg-slate-900/85 p-6 shadow-2xl shadow-black/25">
        <p className="text-sm font-black uppercase tracking-[0.35em] text-emerald-300">Espace compte</p>
        <h3 className="mt-3 text-2xl font-black text-white">Bienvenue {user.name || user.email}</h3>
        <div className="mt-5 grid gap-3 text-sm font-bold text-slate-200">
          <p className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3">Email : {user.email}</p>
          <p className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3">Rôle : {user.role || 'client'}</p>
          <p className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3">Solde : {user.balance ?? 0} FCFA</p>
        </div>
        {status.message ? <p className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-bold ${statusClass}`}>{status.message}</p> : null}
        <button
          type="button"
          onClick={logout}
          className="mt-6 w-full rounded-2xl border border-slate-500 bg-slate-800 px-6 py-4 text-lg font-black text-white"
        >
          Se déconnecter
        </button>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-amber-300/30 bg-slate-900/85 p-6 shadow-2xl shadow-black/25">
      <div className="flex rounded-2xl border border-slate-700 bg-slate-950 p-1">
        <button
          type="button"
          onClick={() => {
            setMode('register');
            setStatus({ type: 'idle', message: '' });
          }}
          className={`flex-1 rounded-xl px-4 py-3 text-sm font-black ${mode === 'register' ? 'bg-amber-400 text-slate-950' : 'text-slate-300'}`}
        >
          Créer un compte
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setStatus({ type: 'idle', message: '' });
          }}
          className={`flex-1 rounded-xl px-4 py-3 text-sm font-black ${mode === 'login' ? 'bg-emerald-400 text-white' : 'text-slate-300'}`}
        >
          Connexion
        </button>
      </div>

      <h3 className="mt-6 text-2xl font-black text-white">{mode === 'register' ? 'Créer votre compte OmniPay' : 'Connexion à votre compte'}</h3>
      <p className="mt-2 text-sm font-semibold text-slate-300">
        {mode === 'register' ? 'Le premier compte créé devient le compte PDG propriétaire.' : 'Connectez-vous avec l’email et le mot de passe utilisés à l’inscription.'}
      </p>

      <div className="mt-6 grid gap-4">
        {mode === 'register' ? (
          <>
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
              Téléphone
              <input
                name="phone"
                autoComplete="tel"
                className="rounded-2xl border border-slate-600 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-300"
                placeholder="+229..."
              />
            </label>
          </>
        ) : null}

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
          Mot de passe
          <input
            required
            minLength={mode === 'register' ? 8 : undefined}
            type="password"
            name="password"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            className="rounded-2xl border border-slate-600 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-300"
            placeholder={mode === 'register' ? '8 caractères minimum' : 'Votre mot de passe'}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={status.type === 'loading'}
        className="mt-6 w-full rounded-2xl bg-amber-400 px-6 py-4 text-lg font-black text-slate-950 shadow-xl shadow-amber-500/25 disabled:cursor-wait disabled:opacity-70"
      >
        {status.type === 'loading' ? 'Veuillez patienter...' : mode === 'register' ? 'Créer mon compte' : 'Me connecter'}
      </button>

      {status.message ? <p className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-bold ${statusClass}`}>{status.message}</p> : null}
    </form>
  );
}
