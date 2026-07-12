# Worn Well

A mobile-first personal styling agent that learns from what people actually wear. Users can photograph an outfit, save it immediately, add a few context taps, or talk through it in a guided voice interview. The stylist unlocks after three confirmed outfits and never recommends garments the user has not logged.

## Current build

- Mobile camera and photo-library capture
- Photo-only quick logging
- Optional occasion and feeling chips
- Structured voice interview with transcript and text fallback
- Convex image storage and persistent outfit history
- Evidence quality labels: `photo_only`, `quick_context`, `conversational`
- Three-outfit stylist activation
- Ten-outfit free wardrobe limit enforced in Convex

Image understanding, garment confirmation, recommendation orchestration, payments, and production deployment are planned in subsequent modules.

## Stack

- React 19, TypeScript, Vite
- Convex backend and file storage
- Zod
- Vitest and Testing Library
- Browser speech recognition/synthesis for the current local voice prototype

ElevenLabs ElevenAgents is the intended embedded production voice transport once an agent ID and credentials are configured.

## Local setup

Requirements: Node.js 22+, npm, and a Convex account.

```bash
git clone https://github.com/aaushik/worn-well.git
cd worn-well
npm install
npx convex dev --configure new --dev-deployment local
npm run dev -- --host 0.0.0.0
```

Convex writes the local deployment variables to `.env.local`. Do not commit that file.

If the default Vite port is occupied, use the URL Vite prints in the terminal.

## Commands

```bash
npm run test:run   # full test suite
npm run typecheck  # TypeScript project checks
npm run build      # production bundle
```

## Project structure

```text
convex/                   schema, storage, outfit and user functions
src/domain/               wardrobe rules and interview state machine
src/features/outfits/     mobile capture and outfit-history UI
src/ConnectedApp.tsx      Convex integration
src/App.tsx               application shell and readiness experience
```

## Collaboration

Create feature branches from `main` and open pull requests:

```bash
git switch -c feature/short-description
git push -u origin feature/short-description
```

Never commit `.env.local`, API keys, Convex credentials, generated backend files, or customer photos.
