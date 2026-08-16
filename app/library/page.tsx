import type { Metadata } from 'next';
import { LibraryBrowser } from '@/components/divine/library-browser';

export const metadata: Metadata = {
  title: 'Library — DIVINE',
  description: 'The histories, cards, and symbols behind DIVINE.',
};

export default function LibraryPage() {
  return <LibraryBrowser />;
}
