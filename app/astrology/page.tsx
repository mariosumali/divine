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
        url: '/og.jpg',
        width: 1536,
        height: 1024,
        alt: 'DIVINE — eight instruments for the unknown',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Astrology — DIVINE',
    description: 'Explore signs, horoscopes, alignment, and celestial charts.',
    images: [
      {
        url: '/og.jpg',
        alt: 'DIVINE — eight instruments for the unknown',
      },
    ],
  },
};

export default function AstrologyPage() {
  return <AstrologyStudio />;
}
