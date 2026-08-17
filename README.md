# DIVINE

DIVINE is a private, account-free divination application with sixteen complete reading flows: Tarot, Oracle, Lenormand, Ritual, Temple, Zodiac, Kipper, Belline, Playing Card Cartomancy, Sibilla Italiana, Runic Cards, I Ching Cards, Fal-e Hafez Cards, Hanafuda, Magic 8 Ball, and Fortune Cookie.

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

Tarot uses locally hosted, individually verified public-domain Rider–Waite–Smith imagery, and Lenormand uses public-domain Game of Hope imagery. The other historical systems preserve their traditional card names and structures while using original DIVINE interpretations and procedural card treatments. Runic Cards, I Ching Cards, Fal-e Hafez Cards, and Hanafuda explicitly distinguish their historical source traditions from their contemporary card-reading adaptations.

DIVINE is for entertainment and personal reflection, not professional advice. The “Magic 8 Ball” label requires trademark review before a public commercial release.
