import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AstrologyChartViewer } from '@/components/divine/astrology-chart-viewer';
import { ASTROLOGY_CHARTS, getAstrologyChart } from '@/lib/divine/astrology';

interface AstrologyChartPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return ASTROLOGY_CHARTS.map((chart) => ({ slug: chart.slug }));
}

export async function generateMetadata({
  params,
}: AstrologyChartPageProps): Promise<Metadata> {
  const { slug } = await params;
  const chart = getAstrologyChart(slug);

  if (!chart) return {};

  return {
    title: `${chart.title} — DIVINE Astrology`,
    description: chart.detail,
    openGraph: {
      title: `${chart.title} — DIVINE Astrology`,
      description: chart.detail,
      images: [chart.src],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${chart.title} — DIVINE Astrology`,
      description: chart.detail,
      images: [chart.src],
    },
  };
}

export default async function AstrologyChartPage({
  params,
}: AstrologyChartPageProps) {
  const { slug } = await params;
  const chart = getAstrologyChart(slug);

  if (!chart) notFound();

  const index = ASTROLOGY_CHARTS.findIndex((item) => item.slug === chart.slug);
  const previous =
    ASTROLOGY_CHARTS[
      (index - 1 + ASTROLOGY_CHARTS.length) % ASTROLOGY_CHARTS.length
    ];
  const next = ASTROLOGY_CHARTS[(index + 1) % ASTROLOGY_CHARTS.length];

  return <AstrologyChartViewer chart={chart} previous={previous} next={next} />;
}
