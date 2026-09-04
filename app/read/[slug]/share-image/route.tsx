/* eslint-disable next/no-img-element -- ImageResponse requires plain image elements. */
import { ImageResponse } from 'next/og';
import { composeShare, decodeReadingShareToken } from '@/lib/divine/share';
import { isSystemSlug, SYSTEM_MAP } from '@/lib/divine/systems';

export const dynamic = 'force-dynamic';

const size = { width: 1200, height: 630 };

function absoluteAsset(request: Request, path: string): string {
  return new URL(path, request.url).href;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const token = new URL(request.url).searchParams.get('reading');
  if (!isSystemSlug(slug) || !token) {
    return new Response('Reading not found', { status: 404 });
  }

  const decoded = decodeReadingShareToken(token, SYSTEM_MAP[slug]);
  if (!decoded) return new Response('Reading not found', { status: 404 });

  const reading = decoded.record;
  const composition = composeShare(reading);
  const cards = composition.cards.slice(0, 8);
  const hasCards = cards.length > 0;

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        color: '#090909',
        background: '#efede5',
        padding: '54px 62px',
        fontFamily: 'Georgia, serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          inset: 0,
          opacity: 0.055,
        }}
      >
        <img
          src={absoluteAsset(request, '/share/divine-og.jpg')}
          width={1200}
          height={630}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      <div
        style={{
          width: hasCards ? '51%' : '72%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 28, letterSpacing: '0.22em' }}>DIVINE</div>
          <div
            style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: 14,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              opacity: 0.56,
              marginTop: 13,
            }}
          >
            {composition.subtitle}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: hasCards ? 52 : 64,
            lineHeight: 1.04,
            letterSpacing: '-0.035em',
          }}
        >
          {composition.displayHeadline}
        </div>

        <div
          style={{
            display: 'flex',
            fontFamily: 'Arial, sans-serif',
            fontSize: 13,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            opacity: 0.55,
          }}
        >
          {composition.focus} focus ·{' '}
          {new Date(composition.date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'UTC',
          })}
        </div>
      </div>

      {hasCards ? (
        <div
          style={{
            width: '46%',
            marginLeft: '3%',
            display: 'flex',
            flexWrap: 'wrap',
            alignContent: 'center',
            justifyContent: 'center',
            gap: 13,
          }}
        >
          {cards.map((card, index) => (
            <div
              key={`${card.name}-${index}`}
              style={{
                width: cards.length <= 3 ? 145 : 108,
                height: cards.length <= 3 ? 236 : 176,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '1px solid rgba(9,9,9,.32)',
                background: '#e3dfd3',
                flexDirection: 'column',
                padding: 9,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flex: 1,
                  alignItems: 'center',
                  fontSize: cards.length <= 3 ? 58 : 42,
                }}
              >
                {String(index + 1).padStart(2, '0')}
              </div>
              <div
                style={{
                  display: 'flex',
                  fontFamily: 'Arial, sans-serif',
                  fontSize: cards.length <= 3 ? 12 : 9,
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  opacity: 0.62,
                }}
              >
                {card.name}
                {card.reversed ? ' · R' : ''}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            width: '28%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 250,
              height: 250,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(9,9,9,.26)',
              borderRadius: '50%',
              fontSize: 108,
            }}
          >
            {SYSTEM_MAP[slug].kind === 'ball' ? '8' : 'C'}
          </div>
        </div>
      )}
    </div>,
    {
      ...size,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    },
  );
}
