import { notFound } from 'next/navigation';
import { ReadingExperience } from '@/components/divine/reading-experience';
import { isSystemSlug, SYSTEMS, SYSTEM_MAP } from '@/lib/divine/systems';

export function generateStaticParams() {
  return SYSTEMS.map((system) => ({ slug: system.slug }));
}

export default async function ReadingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSystemSlug(slug)) notFound();
  return <ReadingExperience system={SYSTEM_MAP[slug]} />;
}
