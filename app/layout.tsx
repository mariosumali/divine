import type { Metadata } from 'next';
import { Bodoni_Moda, Geist } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { EXPERIENCE_DESCRIPTION } from '@/lib/divine/catalog';

const geist = Geist({ variable: '--font-geist', subsets: ['latin'] });
const bodoni = Bodoni_Moda({ variable: '--font-bodoni', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DIVINE',
  description: EXPERIENCE_DESCRIPTION,
  metadataBase: new URL(
    'https://divine-readings.grassy-peony-5538.chatgpt.site',
  ),
  openGraph: {
    title: 'DIVINE',
    description: EXPERIENCE_DESCRIPTION,
    images: ['/og.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DIVINE',
    description: EXPERIENCE_DESCRIPTION,
    images: ['/og.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${bodoni.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
