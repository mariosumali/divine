# DIVINE

DIVINE is a private, account-free divination application with complete Tarot, Oracle, Lenormand, Ritual, Temple, Zodiac, Magic 8 Ball, and Fortune Cookie reading flows.

The interface uses an editorial black-and-white visual system, procedural Web Audio, tactile motion, browser-only randomness, and an IndexedDB journal. Questions, notes, and saved readings never leave the browser.

## Run locally

Requires Node.js 22.13 or newer and pnpm 10.

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Validate a release

```bash
pnpm lint
pnpm test
pnpm build
pnpm audit --audit-level high
```

## Architecture

- `app/` contains the route shell, metadata, themes, entry threshold, and responsive visual system.
- `components/divine/` contains the catalog, shared reading state machine, rituals, reveal surfaces, sharing, and journal UI.
- `lib/divine/systems.ts` defines the complete authored card and object libraries.
- `lib/divine/reading.ts` owns cryptographic draws and deterministic interpretation composition.
- `lib/divine/storage.ts` owns the versioned, device-local IndexedDB journal.
- `lib/divine/share.ts` creates privacy-safe share compositions; questions are opt-in and notes are never exported.

Tarot uses locally hosted, individually verified public-domain Rider–Waite–Smith imagery. All other card symbols, cover art, object art, interpretations, and fortunes are original DIVINE work.

DIVINE is for entertainment and personal reflection, not professional advice. The “Magic 8 Ball” label requires trademark review before a public commercial release.
