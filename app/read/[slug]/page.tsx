import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ReadingExperience } from '@/components/divine/reading-experience';
import { composeShare, decodeReadingShareToken } from '@/lib/divine/share';
import { isSystemSlug, SYSTEMS, SYSTEM_MAP } from '@/lib/divine/systems';

const HERO_IMAGE = {
  url: '/share/divine-og.jpg',
  width: 1200,
  height: 630,
  alt: 'DIVINE',
};

export function generateStaticParams() {
  return SYSTEMS.map((system) => ({ slug: system.slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ reading?: string | string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isSystemSlug(slug)) return {};
  const query = await searchParams;
  const system = SYSTEM_MAP[slug];
  const title = `${system.name} reading — DIVINE`;
  const token =
    typeof query.reading === 'string' ? query.reading : query.reading?.[0];
  const sharedReading = token
    ? decodeReadingShareToken(token, system)?.record
    : undefined;
  const composition = sharedReading ? composeShare(sharedReading) : undefined;
  const description = composition?.displayHeadline ?? system.introduction;
  const image = sharedReading
    ? {
        url: `/read/${slug}/share-image?reading=${encodeURIComponent(token!)}`,
        width: 1200,
        height: 630,
        alt: `${system.name} reading: ${composition!.displayHeadline}`,
      }
    : HERO_IMAGE;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [image],
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
