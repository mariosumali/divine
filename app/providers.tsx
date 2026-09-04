'use client';

import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import {
  Check,
  ChevronDown,
  Settings2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { Dialog } from '@base-ui/react/dialog';
import { Menu } from '@base-ui/react/menu';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { playSound, setSoundEnabled, suspendSound } from '@/lib/divine/audio';
import {
  CARD_SYSTEM_SLUGS,
  DECK_LABELS,
  DEFAULT_DECK_FINISHES,
  deckFinishesFor,
  type CardSystemSlug,
  type DeckFinish,
  type DeckFinishes,
} from '@/lib/divine/decks';
import { CATALOG_NAME_MAP } from '@/lib/divine/catalog';

type Theme = 'light' | 'dark';
type EntryPhase =
  | 'checking'
  | 'gate'
  | 'first-reveal'
  | 'reload-reveal'
  | 'ready';
export type LandingIntroPhase = 'hold' | 'first' | 'reload' | 'settled';

const NAV_ITEMS = [
  { href: '/today', label: 'Today', match: '/today' },
  { href: '/#readings', label: 'Readings', match: '/' },
  { href: '/astrology', label: 'Astrology', match: '/astrology' },
  { href: '/journal', label: 'Journal', match: '/journal' },
  { href: '/library', label: 'Library', match: '/library' },
  { href: '/gallery', label: 'Gallery', match: '/gallery' },
] as const;

function isActiveNavigationItem(pathname: string, match: string) {
  if (match === '/') return pathname === '/' || pathname.startsWith('/read/');
  return pathname === match || pathname.startsWith(`${match}/`);
}

interface ExperienceContextValue {
  theme: Theme;
  sound: boolean;
  deckFinishes: DeckFinishes;
  landingIntro: LandingIntroPhase;
  toggleTheme: () => void;
  toggleSound: () => void;
  setDeckFinish: (slug: CardSystemSlug, finish: DeckFinish) => void;
  setAllDeckFinishes: (finish: DeckFinish) => void;
  cue: typeof playSound;
}

const ExperienceContext = createContext<ExperienceContextValue | null>(null);

function readPreference(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writePreference(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Preferences remain available for this visit. */
  }
}

function resetScrollPosition() {
  const root = document.documentElement;
  const previousBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';
  window.scrollTo(0, 0);
  root.style.scrollBehavior = previousBehavior;
}

export function useExperience() {
  const value = useContext(ExperienceContext);
  if (!value) throw new Error('useExperience must be used within Providers');
  return value;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [initialPathname] = useState(pathname);
  const entryButtonRef = useRef<HTMLButtonElement>(null);
  const [theme, setTheme] = useState<Theme>('light');
  const [sound, setSound] = useState(false);
  const [deckFinishes, setDeckFinishes] = useState<DeckFinishes>(
    DEFAULT_DECK_FINISHES,
  );
  const [entryPhase, setEntryPhase] = useState<EntryPhase>('checking');
  // This experience intentionally keeps its cinematic motion enabled.
  const reduceMotion = false;

  useEffect(() => {
    // Dark mode is temporarily disabled.
    // const storedTheme = readPreference('divine-theme') as Theme | null;
    // const nextTheme =
    //   storedTheme ??
    //   (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const nextTheme: Theme = 'light';
    const storedSound = readPreference('divine-sound') === 'on';
    let storedDecks = DEFAULT_DECK_FINISHES;
    try {
      const parsed = JSON.parse(
        readPreference('divine-decks') ?? '{}',
      ) as Partial<DeckFinishes>;
      storedDecks = CARD_SYSTEM_SLUGS.reduce(
        (result, slug) => ({
          ...result,
          [slug]: parsed[slug] === 'ink' ? 'ink' : 'color',
        }),
        DEFAULT_DECK_FINISHES,
      );
    } catch {
      /* A malformed preference simply restores the color decks. */
    }
    document.documentElement.dataset.theme = nextTheme;
    if (storedSound) void setSoundEnabled(true);
    queueMicrotask(() => {
      setTheme(nextTheme);
      setSound(storedSound);
      setDeckFinishes(storedDecks);
      const shouldAnimateHomeArrival =
        initialPathname === '/' && window.location.hash === '';
      if (shouldAnimateHomeArrival) resetScrollPosition();
      setEntryPhase(
        readPreference('divine-entered') === 'yes'
          ? shouldAnimateHomeArrival
            ? 'reload-reveal'
            : 'ready'
          : 'gate',
      );
    });
    const onVisibility = () => {
      if (document.hidden) suspendSound();
      else if (readPreference('divine-sound') === 'on')
        void setSoundEnabled(true);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [initialPathname]);

  useEffect(() => {
    if (entryPhase === 'gate') entryButtonRef.current?.focus();
  }, [entryPhase]);

  const chooseEntry = () => {
    if (entryPhase !== 'gate') return;
    if (pathname === '/') resetScrollPosition();
    playSound('enter');
    setEntryPhase('first-reveal');
  };

  const landingIntro: LandingIntroPhase =
    entryPhase === 'checking' || entryPhase === 'gate'
      ? 'hold'
      : entryPhase === 'first-reveal'
        ? 'first'
        : entryPhase === 'reload-reveal'
          ? 'reload'
          : 'settled';
  const isEntryFramed = entryPhase !== 'ready';
  const isRevealing =
    entryPhase === 'first-reveal' || entryPhase === 'reload-reveal';
  // Motion cannot interpolate circle() and none reliably. Keep both animated
  // endpoints compatible, then remove the clip once the reveal is complete.
  const entryClipPath = isRevealing
    ? 'circle(150vmax at 50vw 50svh)'
    : 'circle(0vmax at 50vw 50svh)';
  const revealDuration = reduceMotion
    ? 0.01
    : entryPhase === 'first-reveal'
      ? 1.45
      : 0.92;
  const completeEntryReveal = useCallback(() => {
    if (!isRevealing) return;
    const shouldMoveFocus = entryPhase === 'first-reveal';
    if (shouldMoveFocus) writePreference('divine-entered', 'yes');
    setEntryPhase('ready');
    if (shouldMoveFocus) {
      requestAnimationFrame(() => {
        document
          .querySelector<HTMLAnchorElement>('.mini-wordmark')
          ?.focus({ preventScroll: true });
      });
    }
  }, [entryPhase, isRevealing]);

  useEffect(() => {
    if (!isRevealing) return;
    const fallbackTimer = window.setTimeout(
      completeEntryReveal,
      revealDuration * 1000 + 250,
    );
    return () => window.clearTimeout(fallbackTimer);
  }, [completeEntryReveal, isRevealing, revealDuration]);
  const activeNavItem =
    NAV_ITEMS.find((item) => isActiveNavigationItem(pathname, item.match)) ??
    NAV_ITEMS[1];

  const value = useMemo<ExperienceContextValue>(
    () => ({
      theme,
      sound,
      deckFinishes,
      landingIntro,
      // Dark mode is temporarily disabled.
      // toggleTheme: () =>
      //   setTheme((current) => {
      //     const next = current === 'light' ? 'dark' : 'light';
      //     document.documentElement.dataset.theme = next;
      //     writePreference('divine-theme', next);
      //     playSound('tick');
      //     return next;
      //   }),
      toggleTheme: () => {},
      toggleSound: () =>
        setSound((current) => {
          const next = !current;
          writePreference('divine-sound', next ? 'on' : 'off');
          void setSoundEnabled(next).then(() => {
            if (next) playSound('tick');
          });
          return next;
        }),
      setDeckFinish: (slug, finish) =>
        setDeckFinishes((current) => {
          const next = { ...current, [slug]: finish };
          writePreference('divine-decks', JSON.stringify(next));
          playSound('turn');
          return next;
        }),
      setAllDeckFinishes: (finish) => {
        const next = deckFinishesFor(finish);
        writePreference('divine-decks', JSON.stringify(next));
        playSound('turn');
        setDeckFinishes(next);
      },
      cue: playSound,
    }),
    [theme, sound, deckFinishes, landingIntro],
  );

  return (
    <MotionConfig reducedMotion="never">
      <ExperienceContext.Provider value={value}>
        {isEntryFramed && <div className="entry-backdrop" aria-hidden="true" />}

        <motion.div
          className={`app-frame${isEntryFramed ? ' entry-framed' : ''}`}
          inert={isEntryFramed ? true : undefined}
          aria-hidden={isEntryFramed ? true : undefined}
          initial={false}
          animate={
            entryPhase === 'ready'
              ? { opacity: 1 }
              : { clipPath: entryClipPath, opacity: 1 }
          }
          style={entryPhase === 'ready' ? { clipPath: 'none' } : undefined}
          transition={{
            duration: isRevealing ? revealDuration : 0,
            ease: reduceMotion ? 'linear' : [0.76, 0, 0.24, 1],
          }}
          onAnimationComplete={completeEntryReveal}
        >
          <header className="global-header">
            <Link className="mini-wordmark" href="/" aria-label="DIVINE home">
              DIVINE
            </Link>
            <nav className="desktop-navigation" aria-label="Primary navigation">
              {NAV_ITEMS.map((item) => {
                const isActive = isActiveNavigationItem(pathname, item.match);
                return (
                  <Link
                    href={item.href}
                    key={item.href}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <nav className="mobile-navigation" aria-label="Primary navigation">
              <Menu.Root>
                <Menu.Trigger
                  type="button"
                  className="mobile-nav-trigger"
                  aria-label={`Current page: ${activeNavItem.label}. Choose a page`}
                >
                  <span>{activeNavItem.label}</span>
                  <ChevronDown aria-hidden="true" />
                </Menu.Trigger>
                <Menu.Portal>
                  <Menu.Backdrop className="mobile-nav-backdrop" />
                  <Menu.Positioner
                    className="mobile-nav-positioner"
                    sideOffset={9}
                    align="center"
                  >
                    <Menu.Popup className="mobile-nav-menu">
                      {NAV_ITEMS.map((item) => {
                        const isActive = isActiveNavigationItem(
                          pathname,
                          item.match,
                        );
                        return (
                          <Menu.LinkItem
                            key={item.href}
                            className="mobile-nav-item"
                            render={<Link href={item.href} />}
                            closeOnClick
                            aria-current={isActive ? 'page' : undefined}
                          >
                            <span>{item.label}</span>
                            {isActive && <Check aria-hidden="true" />}
                          </Menu.LinkItem>
                        );
                      })}
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            </nav>
            <div className="header-controls">
              <Dialog.Root>
                <Dialog.Trigger
                  type="button"
                  className="settings-trigger"
                  aria-label="Open options"
                >
                  <Settings2 />
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Backdrop className="settings-backdrop" />
                  <Dialog.Popup className="settings-panel">
                    <header>
                      <Dialog.Title>Options</Dialog.Title>
                      <Dialog.Close type="button" aria-label="Close options">
                        <X />
                      </Dialog.Close>
                    </header>
                    <section
                      className="settings-group"
                      aria-labelledby="experience-options"
                    >
                      <h3 id="experience-options">Experience</h3>
                      <div className="preference-settings">
                        {/* Dark mode is temporarily disabled.
                      <section className="preference-setting">
                        <span>Theme</span>
                        <fieldset
                          className="segmented-options"
                          aria-label="Theme"
                        >
                          {(['light', 'dark'] as const).map((mode) => (
                            <button
                              type="button"
                              key={mode}
                              className={theme === mode ? 'active' : ''}
                              aria-pressed={theme === mode}
                              onClick={() => {
                                if (theme !== mode) value.toggleTheme();
                              }}
                            >
                              {mode === 'light' ? (
                                <Sun aria-hidden="true" />
                              ) : (
                                <Moon aria-hidden="true" />
                              )}
                              {mode}
                            </button>
                          ))}
                        </fieldset>
                      </section>
                      */}
                        <section className="preference-setting">
                          <span>Sound</span>
                          <fieldset
                            className="segmented-options"
                            aria-label="Sound effects"
                          >
                            {([true, false] as const).map((enabled) => (
                              <button
                                type="button"
                                key={enabled ? 'on' : 'muted'}
                                className={sound === enabled ? 'active' : ''}
                                aria-pressed={sound === enabled}
                                onClick={() => {
                                  if (sound !== enabled) value.toggleSound();
                                }}
                              >
                                {enabled ? (
                                  <Volume2 aria-hidden="true" />
                                ) : (
                                  <VolumeX aria-hidden="true" />
                                )}
                                {enabled ? 'On' : 'Muted'}
                              </button>
                            ))}
                          </fieldset>
                        </section>
                      </div>
                    </section>
                    <h3 className="deck-options-title">Decks</h3>
                    <div className="deck-settings">
                      <section className="deck-setting deck-setting-all">
                        <span>All decks</span>
                        <fieldset aria-label="Set finish for all decks">
                          {(['color', 'ink'] as const).map((finish) => {
                            const isActive = CARD_SYSTEM_SLUGS.every(
                              (slug) => deckFinishes[slug] === finish,
                            );
                            return (
                              <button
                                type="button"
                                key={finish}
                                className={isActive ? 'active' : ''}
                                aria-label={`Set all decks to ${finish}`}
                                aria-pressed={isActive}
                                onClick={() => value.setAllDeckFinishes(finish)}
                              >
                                {finish}
                              </button>
                            );
                          })}
                        </fieldset>
                      </section>
                      {CARD_SYSTEM_SLUGS.map((slug) => (
                        <section className="deck-setting" key={slug}>
                          <span>{CATALOG_NAME_MAP[slug]}</span>
                          <div>
                            {(['color', 'ink'] as const).map((finish) => (
                              <button
                                type="button"
                                key={finish}
                                className={
                                  deckFinishes[slug] === finish ? 'active' : ''
                                }
                                aria-pressed={deckFinishes[slug] === finish}
                                onClick={() =>
                                  value.setDeckFinish(slug, finish)
                                }
                              >
                                {DECK_LABELS[slug][finish]}
                              </button>
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  </Dialog.Popup>
                </Dialog.Portal>
              </Dialog.Root>
            </div>
          </header>
          {children}
          <footer className="site-footer">
            <a href="https://mariosumali.com">Created by Mario Sumali</a>
          </footer>
        </motion.div>

        <AnimatePresence>
          {isEntryFramed && (
            <motion.dialog
              open
              className="entry-gate"
              aria-modal={entryPhase === 'gate' ? 'true' : undefined}
              aria-labelledby={
                entryPhase === 'gate' ? 'entry-title' : undefined
              }
              aria-label={entryPhase === 'gate' ? undefined : 'Opening DIVINE'}
              initial={false}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0.01 : 0.15 }}
            >
              {isRevealing && !reduceMotion && (
                <motion.i
                  className="entry-eclipse-ring"
                  aria-hidden="true"
                  initial={{ scale: 0.001, opacity: 0.92 }}
                  animate={{
                    scale: 3,
                    opacity: [0.92, 0.54, 0],
                  }}
                  transition={{
                    duration: revealDuration,
                    ease: [0.76, 0, 0.24, 1],
                    opacity: {
                      duration: revealDuration,
                      times: [0, 0.58, 1],
                    },
                  }}
                />
              )}

              {(entryPhase === 'gate' || entryPhase === 'first-reveal') && (
                <div className="entry-gate-content">
                  <motion.h1
                    id="entry-title"
                    initial={{ clipPath: 'inset(100% 0 0)' }}
                    animate={
                      entryPhase === 'first-reveal'
                        ? {
                            clipPath: 'inset(0)',
                            opacity: 0,
                            scale: reduceMotion ? 1 : 1.14,
                            filter: reduceMotion ? 'blur(0px)' : 'blur(8px)',
                          }
                        : {
                            clipPath: 'inset(0)',
                            opacity: 1,
                            scale: 1,
                            filter: 'blur(0px)',
                          }
                    }
                    transition={
                      entryPhase === 'first-reveal'
                        ? {
                            duration: reduceMotion ? 0.12 : 0.48,
                            ease: 'easeOut',
                          }
                        : {
                            duration: reduceMotion ? 0.18 : 1.1,
                            ease: [0.22, 1, 0.36, 1],
                          }
                    }
                  >
                    DIVINE
                  </motion.h1>
                  <motion.div
                    className="entry-actions"
                    initial={{ opacity: 0, y: 14 }}
                    animate={
                      entryPhase === 'first-reveal'
                        ? {
                            opacity: 0,
                            y: reduceMotion ? 0 : -10,
                            scale: reduceMotion ? 1 : 0.94,
                          }
                        : { opacity: 1, y: 0, scale: 1 }
                    }
                    transition={
                      entryPhase === 'first-reveal'
                        ? { duration: reduceMotion ? 0.1 : 0.3 }
                        : { delay: reduceMotion ? 0 : 0.95 }
                    }
                  >
                    <button
                      ref={entryButtonRef}
                      type="button"
                      className="primary-action"
                      onClick={chooseEntry}
                      disabled={entryPhase !== 'gate'}
                    >
                      ENTER
                    </button>
                  </motion.div>
                  <motion.p
                    className="entry-disclaimer"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: entryPhase === 'first-reveal' ? 0 : 1,
                    }}
                    transition={
                      entryPhase === 'first-reveal'
                        ? { duration: reduceMotion ? 0.1 : 0.25 }
                        : { delay: reduceMotion ? 0 : 1.15 }
                    }
                  >
                    CREATED BY MARIO SUMALI
                  </motion.p>
                </div>
              )}
            </motion.dialog>
          )}
        </AnimatePresence>
      </ExperienceContext.Provider>
    </MotionConfig>
  );
}
