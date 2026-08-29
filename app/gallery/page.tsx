import type { Metadata } from 'next';
import { GalleryCollection } from '@/components/divine/gallery-collection';
import { buildGalleryItems } from '@/lib/divine/gallery';

export const metadata: Metadata = {
  title: 'Gallery — DIVINE',
  description: 'The cards, objects, and archival images of DIVINE, together.',
};

export default function GalleryPage() {
  return <GalleryCollection items={buildGalleryItems()} />;
}
