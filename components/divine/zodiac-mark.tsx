import type { ReactNode } from 'react';

interface ZodiacMarkProps {
  sign: string;
  className?: string;
  label?: string;
}

function markFor(sign: string): ReactNode {
  switch (sign) {
    case 'Aries':
      return (
        <>
          <path d="M12 20v-8.5C12 7.9 10.2 5 7.8 5 5.7 5 4 7.2 4 10" />
          <path d="M12 11.5C12 7.9 13.8 5 16.2 5c2.1 0 3.8 2.2 3.8 5" />
        </>
      );
    case 'Taurus':
      return (
        <>
          <path d="M4 5c1.7 3.1 4.4 4.6 8 4.6S18.3 8.1 20 5" />
          <circle cx="12" cy="14.2" r="5.8" />
        </>
      );
    case 'Gemini':
      return (
        <>
          <path d="M7 5c3.3 1.2 6.7 1.2 10 0M7 19c3.3-1.2 6.7-1.2 10 0" />
          <path d="M9 5.7v12.6M15 5.7v12.6" />
        </>
      );
    case 'Cancer':
      return (
        <>
          <path d="M4.5 10c2.2-4.1 7.4-5.6 11.5-3.2 1.5.9 2.7 2 3.5 3.2" />
          <circle cx="8" cy="9.2" r="2.2" />
          <path d="M19.5 14c-2.2 4.1-7.4 5.6-11.5 3.2-1.5-.9-2.7-2-3.5-3.2" />
          <circle cx="16" cy="14.8" r="2.2" />
        </>
      );
    case 'Leo':
      return (
        <>
          <circle cx="7.5" cy="10.5" r="3.3" />
          <path d="M10.8 10.5c1.1-3.7 2.4-6.3 4.8-6.3 2.2 0 3.1 1.9 2.2 4.2-.8 2.1-3.2 3.5-3.2 6.4 0 2.4 1.6 4 3.9 4" />
        </>
      );
    case 'Virgo':
      return (
        <>
          <path d="M4.5 6v12M4.5 8.5c0-2.2 4-2.2 4 0V18M8.5 8.5c0-2.2 4-2.2 4 0V18M12.5 8.5c0-2.2 4-2.2 4 0v6.3" />
          <path d="M16.5 10.5c3 0 3.7 2.2 2.4 4.7-1.1 2-3.4 3.3-5.8 3.5M16.2 14.3l3.6 4.5" />
        </>
      );
    case 'Libra':
      return (
        <>
          <path d="M4 18h16M5.5 14h13" />
          <path d="M8 14c0-3.7 1.6-5.8 4-5.8s4 2.1 4 5.8" />
        </>
      );
    case 'Scorpio':
      return (
        <>
          <path d="M4 6v12M4 8.5c0-2.2 4-2.2 4 0V18M8 8.5c0-2.2 4-2.2 4 0V18M12 8.5c0-2.2 4-2.2 4 0v7.5c0 1.6 1.1 2.3 3.5 2.3" />
          <path d="m17.6 15.8 2 2.5-2.8 1.7" />
        </>
      );
    case 'Sagittarius':
      return <path d="M5 19 19 5M12.5 5H19v6.5M7.5 10.5l6 6" />;
    case 'Capricorn':
      return (
        <path d="M4 5v13M4 8c1.7-2.4 4.2-2.4 5.7.2L13.8 17c1.1 2.4 4.8 1.9 5.6-.5.7-2.1-.5-4.1-2.6-4.1-2.3 0-3.5 2.2-3 4.6" />
      );
    case 'Aquarius':
      return (
        <>
          <path d="m4 9 3-2.5 3 2.5 3-2.5L16 9l4-3" />
          <path d="m4 15 3-2.5 3 2.5 3-2.5 3 2.5 4-3" />
        </>
      );
    case 'Pisces':
      return <path d="M8 5c-3 3-3 11 0 14M16 5c3 3 3 11 0 14M5.2 12h13.6" />;
    default:
      return <circle cx="12" cy="12" r="7" />;
  }
}

export function ZodiacMark({ sign, className, label }: ZodiacMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {markFor(sign)}
    </svg>
  );
}
