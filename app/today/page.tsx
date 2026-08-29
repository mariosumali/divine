import type { Metadata } from 'next';
import { TodayRitual } from '@/components/divine/today-ritual';

export const metadata: Metadata = {
  title: 'Today — DIVINE',
  description: 'A daily constellation shaped by one reflection.',
  robots: { index: false, follow: false },
};

export default function TodayPage() {
  return <TodayRitual />;
}
