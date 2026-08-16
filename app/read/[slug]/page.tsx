import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ReadingExperience } from '@/components/divine/reading-experience';
import { isSystemSlug, SYSTEMS, SYSTEM_MAP } from '@/lib/divine/systems';

const PRODUCTION_ORIGIN =
  'https://divine-readings.grassy-peony-5538.chatgpt.site';

export function generateStaticParams() {
  return SYSTEMS.map((system) => ({ slug: system.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isSystemSlug(slug)) return {};
  const system = SYSTEM_MAP[slug];
  const title = `${system.name} reading — DIVINE`;
  const description = system.introduction;
  const image = new URL(system.cover, PRODUCTION_ORIGIN).toString();
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: image,
          width: 1122,
          height: 1402,
          alt: `${system.name} cover artwork`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function ReadingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isSystemSlug(slug)) notFound();
  return <ReadingExperience system={SYSTEM_MAP[slug]} />;
}
