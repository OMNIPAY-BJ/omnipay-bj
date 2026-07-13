'use client';

import { FormEvent, useState } from 'react';

type ApiState = {
  loading: boolean;
  message: string;
  error: string;
};

const initialState: ApiState = { loading: false, message: '', error: '' };

function getFormPayload(form: HTMLFormElement) {
  return Object.fromEntries(new FormData(form).entries());
}

export function LoginForm() {
  const [state, setState] = useState<ApiState>(initialState);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ loading: true, message: '', error: '' });

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(getFormPayload(event.currentTarget))
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setState({ loading: false, message: '', error: data.error || 'Connexion impossible.' });
      return;
    }

    if (data.token) {
      localStorage.setItem('omnipay_token', data.token);
      localStorage.setItem('omnipay_user', JSON.stringify(data.user));
    }
    setState({ loading: false, message: 'Connexion réussie.', error: '' });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block space-y-2">
        <span className="text-sm text-slate-300">Email</span>
        <input
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
          type="email"
          name="email"
          autoComplete="email"
          required
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm text-slate-300">Mot de passe</span>
        <input
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
          type="password"
          name="password"
          autoComplete="current-password"
          required
        />
      </label>
      <button
        className="w-full rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-900 hover:bg-emerald-400 disabled:opacity-60"
        disabled={state.loading}
      >
        {state.loading ? 'Connexion...' : 'Se connecter'}
      </button>
      {state.error ? <p className="rounded-lg bg-red-950 p-3 text-sm text-red-200">{state.error}</p> : null}
      {state.message ? <p className="rounded-lg bg-emerald-950 p-3 text-sm text-emerald-200">{state.message}</p> : null}
    </form>
  );
}

export function RegisterForm() {
  const [state, setState] = useState<ApiState>(initialState);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ loading: true, message: '', error: '' });

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(getFormPayload(event.currentTarget))
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setState({ loading: false, message: '', error: data.error || 'Création du compte impossible.' });
      return;
    }

    if (data.token) {
      localStorage.setItem('omnipay_token', data.token);
      localStorage.setItem('omnipay_user', JSON.stringify(data.user));
    }
    setState({ loading: false, message: 'Compte créé avec succès.', error: '' });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block space-y-2">
        <span className="text-sm text-slate-300">Nom</span>
        <input
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
          type="text"
          name="name"
          autoComplete="name"
          required
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm text-slate-300">Email</span>
        <input
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
          type="email"
          name="email"
          autoComplete="email"
          required
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm text-slate-300">Téléphone</span>
        <input
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
          type="tel"
          name="phone"
          autoComplete="tel"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm text-slate-300">Mot de passe</span>
        <input
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
          type="password"
          name="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>
      <button
        className="w-full rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-900 hover:bg-emerald-400 disabled:opacity-60"
        disabled={state.loading}
      >
        {state.loading ? 'Création...' : 'Créer mon compte'}
      </button>
      {state.error ? <p className="rounded-lg bg-red-950 p-3 text-sm text-red-200">{state.error}</p> : null}
      {state.message ? <p className="rounded-lg bg-emerald-950 p-3 text-sm text-emerald-200">{state.message}</p> : null}
    </form>
  );
}
