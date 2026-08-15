import type { Metadata } from 'next';
import { LibraryBrowser } from '@/components/divine/library-browser';

export const metadata: Metadata = {
  title: 'Library — DIVINE',
  description: 'The histories and symbols behind every DIVINE reading system.',
};

export default function LibraryPage() {
  return <LibraryBrowser />;
}
