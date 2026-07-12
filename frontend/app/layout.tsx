import './globals.css';
import { ReactNode } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata = {
  title: 'OMNIPAY - Fintech Complète',
  description: 'Paiements, e-commerce, investissement et gestion financière.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
