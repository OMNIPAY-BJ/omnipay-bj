import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Link - OmniPay',
  description: 'Espace client mobile OmniPay pour suivre le solde, les activités et les portefeuilles.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
