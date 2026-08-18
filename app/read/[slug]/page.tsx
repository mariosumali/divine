import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ReadingExperience } from '@/components/divine/reading-experience';
import { isSystemSlug, SYSTEMS, SYSTEM_MAP } from '@/lib/divine/systems';

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
  return {
    title,
    description,
    openGraph: {
      title,
      description,
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
      title,
      description,
      images: [
        {
          url: '/og.jpg',
          alt: 'DIVINE — eight instruments for the unknown',
        },
      ],
    },
  };
}

export default async function ReadingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ opening?: string | string[] }>;
}) {
  const { slug } = await params;
  const { opening } = await searchParams;
  if (!isSystemSlug(slug)) notFound();
  return (
    <ReadingExperience
      system={SYSTEM_MAP[slug]}
      startWithOpening={opening === '1'}
    />
  );
}
