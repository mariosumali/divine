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
    type: 'website',
    siteName: 'DIVINE',
    images: [
      {
        url: '/share/divine-og.jpg',
        width: 1200,
        height: 630,
        alt: 'DIVINE',
      },
      {
        url: '/share/divine-mobile.jpg',
        width: 1080,
        height: 1350,
        alt: 'DIVINE',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DIVINE',
    description: EXPERIENCE_DESCRIPTION,
    images: [
      {
        url: '/share/divine-twitter.jpg',
        width: 1200,
        height: 675,
        alt: 'DIVINE',
      },
    ],
  },
  icons: {
    icon: [{ url: '/favicon.ico', sizes: 'any' }],
    shortcut: '/favicon.ico',
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
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
