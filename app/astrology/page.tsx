import type { Metadata } from 'next';
import { AstrologyStudio } from '@/components/divine/astrology-studio';

export const metadata: Metadata = {
  title: 'Astrology — DIVINE',
  description:
    'Daily horoscopes, star-sign profiles, alignment readings, and an open atlas of historical celestial charts.',
  openGraph: {
    title: 'Astrology — DIVINE',
    description: 'Explore signs, horoscopes, alignment, and celestial charts.',
    images: [
      {
        url: '/share/divine-og.jpg',
        width: 1200,
        height: 630,
        alt: 'DIVINE',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Astrology — DIVINE',
    description: 'Explore signs, horoscopes, alignment, and celestial charts.',
    images: [
      {
        url: '/share/divine-og.jpg',
        width: 1200,
        height: 630,
        alt: 'DIVINE',
      },
    ],
  },
};

export default function AstrologyPage() {
  return <AstrologyStudio />;
}
