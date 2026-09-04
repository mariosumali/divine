'use client';

/* oxlint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex -- The chart surface has complete pointer and keyboard controls. */

import { useRef, useState } from 'react';
import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from 'react';
import { ArrowLeft, ArrowRight, Minus, Plus, RotateCcw } from 'lucide-react';
import Image from '@/components/divine/responsive-image';
import Link from 'next/link';
import type { AstrologyChart } from '@/lib/divine/astrology';

interface AstrologyChartViewerProps {
  chart: AstrologyChart;
  previous: AstrologyChart;
  next: AstrologyChart;
}

interface Position {
  x: number;
  y: number;
}

interface DragStart extends Position {
  pointerX: number;
  pointerY: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function AstrologyChartViewer({
  chart,
  previous,
  next,
}: AstrologyChartViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [activeFeature, setActiveFeature] = useState(0);
  const dragStart = useRef<DragStart | null>(null);

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const changeScale = (amount: number) => {
    setScale((current) => clamp(Number((current + amount).toFixed(2)), 1, 4));
  };

  const beginDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      ...position,
    };
  };

  const drag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    setPosition({
      x: dragStart.current.x + event.clientX - dragStart.current.pointerX,
      y: dragStart.current.y + event.clientY - dragStart.current.pointerY,
    });
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragStart.current = null;
  };

  const zoomWithWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    changeScale(event.deltaY > 0 ? -0.2 : 0.2);
  };

  const useKeyboard = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, Position> = {
      ArrowUp: { x: 0, y: 24 },
      ArrowDown: { x: 0, y: -24 },
      ArrowLeft: { x: 24, y: 0 },
      ArrowRight: { x: -24, y: 0 },
    };

    if (moves[event.key]) {
      event.preventDefault();
      setPosition((current) => ({
        x: current.x + moves[event.key].x,
        y: current.y + moves[event.key].y,
      }));
    } else if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      changeScale(0.5);
    } else if (event.key === '-') {
      event.preventDefault();
      changeScale(-0.5);
    } else if (event.key === '0' || event.key === 'Escape') {
      resetView();
    }
  };

  const stageStyle = {
    '--chart-desktop-width': `${70 * (chart.width / chart.height)}svh`,
    '--chart-mobile-width': `${56 * (chart.width / chart.height)}svh`,
    aspectRatio: `${chart.width} / ${chart.height}`,
    transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale})`,
  } as CSSProperties;

  return (
    <main className="astrology-chart-page">
      <header className="chart-viewer-header">
        <Link href="/astrology#atlas">
          <ArrowLeft aria-hidden="true" /> Back to atlas
        </Link>
        <div>
          <p>Celestial archive / {chart.date}</p>
          <h1>{chart.title}</h1>
        </div>
        <span>Interactive plate</span>
      </header>

      <div className="chart-viewer-layout">
        <section
          className="chart-canvas"
          role="application"
          tabIndex={0}
          aria-label={`Interactive view of ${chart.title}`}
          onPointerDown={beginDrag}
          onPointerMove={drag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onWheel={zoomWithWheel}
          onKeyDown={useKeyboard}
          onDoubleClick={() => (scale === 1 ? setScale(2) : resetView())}
        >
          <div className="chart-image-layer" style={stageStyle}>
            <Image
              src={chart.src}
              alt={chart.alt}
              fill
              sizes="(max-width: 760px) 150vw, 78vw"
              priority
              draggable={false}
            />
            {chart.features.map((feature, index) => (
              <button
                type="button"
                className={activeFeature === index ? 'active' : ''}
                style={{
                  left: `${feature.x}%`,
                  top: `${feature.y}%`,
                  transform: `translate(-50%, -50%) scale(${1 / scale})`,
                }}
                aria-label={`Inspect ${feature.label}`}
                aria-pressed={activeFeature === index}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => setActiveFeature(index)}
                key={feature.label}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <div className="chart-controls" aria-label="Chart view controls">
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => changeScale(-0.5)}
              disabled={scale === 1}
            >
              <Minus aria-hidden="true" />
            </button>
            <span>{Math.round(scale * 100)}%</span>
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => changeScale(0.5)}
              disabled={scale === 4}
            >
              <Plus aria-hidden="true" />
            </button>
            <button type="button" aria-label="Reset view" onClick={resetView}>
              <RotateCcw aria-hidden="true" />
            </button>
          </div>
        </section>

        <aside className="chart-detail-panel">
          <div>
            <p className="astro-kicker">Plate notes</p>
            <h2>{chart.features[activeFeature].label}</h2>
            <p aria-live="polite">{chart.features[activeFeature].note}</p>
          </div>

          <ol className="chart-feature-list">
            {chart.features.map((feature, index) => (
              <li key={feature.label}>
                <button
                  type="button"
                  className={activeFeature === index ? 'active' : ''}
                  aria-pressed={activeFeature === index}
                  onClick={() => setActiveFeature(index)}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {feature.label}
                </button>
              </li>
            ))}
          </ol>

          <p className="chart-gesture-note">
            Drag · Scroll to zoom · Select a point
          </p>
        </aside>
      </div>

      <nav className="chart-viewer-footer" aria-label="More astrology charts">
        <Link href={`/astrology/charts/${previous.slug}`}>
          <ArrowLeft aria-hidden="true" />
          <span>
            Previous
            <strong>{previous.title}</strong>
          </span>
        </Link>
        <Link href={`/astrology/charts/${next.slug}`}>
          <span>
            Next
            <strong>{next.title}</strong>
          </span>
          <ArrowRight aria-hidden="true" />
        </Link>
      </nav>
    </main>
  );
}
