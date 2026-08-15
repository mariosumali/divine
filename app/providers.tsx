'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Moon, Sun, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';
import { playSound, setSoundEnabled, suspendSound } from '@/lib/divine/audio';

type Theme = 'light' | 'dark';
interface ExperienceContextValue {
  theme: Theme;
  sound: boolean;
  toggleTheme: () => void;
  toggleSound: () => void;
  cue: typeof playSound;
}

const ExperienceContext = createContext<ExperienceContextValue | null>(null);

function readPreference(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

function writePreference(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* Preferences remain available for this visit. */ }
}

export function useExperience() {
  const value = useContext(ExperienceContext);
  if (!value) throw new Error('useExperience must be used within Providers');
  return value;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [sound, setSound] = useState(false);
  const [entered, setEntered] = useState<boolean | null>(null);

  useEffect(() => {
    const storedTheme = readPreference('divine-theme') as Theme | null;
    const nextTheme = storedTheme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const storedSound = readPreference('divine-sound') === 'on';
    document.documentElement.dataset.theme = nextTheme;
    if (storedSound) void setSoundEnabled(true);
    queueMicrotask(() => {
      setTheme(nextTheme);
      setSound(storedSound);
      setEntered(readPreference('divine-entered') === 'yes');
    });
    const onVisibility = () => { if (document.hidden) suspendSound(); else if (readPreference('divine-sound') === 'on') void setSoundEnabled(true); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const chooseEntry = async (withSound: boolean) => {
    writePreference('divine-entered', 'yes');
    writePreference('divine-sound', withSound ? 'on' : 'off');
    setSound(withSound);
    await setSoundEnabled(withSound);
    if (withSound) playSound('enter');
    setEntered(true);
  };

  const value = useMemo<ExperienceContextValue>(() => ({
    theme,
    sound,
    toggleTheme: () => setTheme((current) => {
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.dataset.theme = next;
      writePreference('divine-theme', next);
      playSound('tick');
      return next;
    }),
    toggleSound: () => setSound((current) => {
      const next = !current;
      writePreference('divine-sound', next ? 'on' : 'off');
      void setSoundEnabled(next).then(() => { if (next) playSound('tick'); });
      return next;
    }),
    cue: playSound,
  }), [theme, sound]);

  return (
    <ExperienceContext.Provider value={value}>
      <div className="app-frame" inert={entered === false ? true : undefined} aria-hidden={entered === false ? true : undefined}>
        <header className="global-header">
          <Link className="mini-wordmark" href="/" aria-label="DIVINE home">DIVINE</Link>
          <nav aria-label="Primary navigation">
            <Link href="/#systems">Readings</Link>
            <Link href="/journal">Journal</Link>
            <Link href="/about">About</Link>
          </nav>
          <div className="header-controls">
            <button type="button" onClick={value.toggleTheme} aria-label={`Use ${theme === 'light' ? 'dark' : 'light'} theme`}>
              {theme === 'light' ? <Moon /> : <Sun />}
            </button>
            <button type="button" onClick={value.toggleSound} aria-label={sound ? 'Mute sound effects' : 'Enable sound effects'}>
              {sound ? <Volume2 /> : <VolumeX />}
            </button>
          </div>
        </header>
        {children}
      </div>

      <AnimatePresence>
        {entered === false && (
          <motion.dialog open className="entry-gate" aria-modal="true" aria-labelledby="entry-title" aria-describedby="entry-description" initial={{ opacity: 1 }} exit={{ opacity: 0, y: '-100%' }} transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}>
            <div className="entry-orbit" aria-hidden="true" />
            <motion.p className="entry-kicker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>A private instrument</motion.p>
            <motion.h1 id="entry-title" initial={{ clipPath: 'inset(100% 0 0)' }} animate={{ clipPath: 'inset(0)' }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}>DIVINE</motion.h1>
            <motion.p id="entry-description" className="entry-note" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}>Eight ways to ask what comes next.</motion.p>
            <motion.div className="entry-actions" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95 }}>
              <button type="button" className="primary-action" onClick={() => void chooseEntry(true)}>Enter with sound</button>
              <button type="button" className="quiet-action" onClick={() => void chooseEntry(false)}>Enter silently</button>
            </motion.div>
            <motion.p className="entry-disclaimer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.15 }}>For entertainment and personal reflection. Not professional advice.</motion.p>
          </motion.dialog>
        )}
      </AnimatePresence>
    </ExperienceContext.Provider>
  );
}
