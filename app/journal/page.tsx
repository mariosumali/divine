import type { Metadata } from 'next';
import { JournalClient } from '@/components/divine/journal-client';

export const metadata: Metadata = {
  title: 'Private journal — DIVINE',
  description:
    'Your device-local collection of saved DIVINE readings and reflections.',
  robots: { index: false, follow: false },
};

export default function JournalPage() {
  return <JournalClient />;
}
