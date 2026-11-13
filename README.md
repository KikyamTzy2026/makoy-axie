# Axie Classic Arena
Original, Axie-Classic-V2-inspired 3v3 card battler. React + Vite + Firebase Realtime Database. All art is original SVG (no official assets).

## Run locally
1. `npm install`
2. Solo vs AI works immediately: `npm run dev`
3. For online rooms, create a Firebase project (below), copy `.env.example` to `.env`, fill it in, restart `npm run dev`.

## Firebase setup (2 min)
1. console.firebase.google.com → Add project → **Build → Realtime Database → Create database** (any region).
2. **Rules** tab → paste `database.rules.json` → Publish. (Open rules = guest mode, no login. Fine for friends/testing; tighten before a large public launch.)
3. **Project settings → Your apps → Web app** → copy the config values into `.env`. `VITE_FIREBASE_DATABASE_URL` is required.

## Deploy to Vercel
1. Push this folder to GitHub → vercel.com → Add New Project → import it (Vite is auto-detected).
2. Add the 5 `VITE_FIREBASE_*` variables under Settings → Environment Variables → Deploy.

## Rules
Start 3 energy, +2 each round (max 10). Draw 3 cards per round (hand max 6). Queue cards, End Turn. Cards resolve fastest Axie first; attacks hit the front living enemy; shields last one round; same-Axie combo +10% per extra card; class advantage ±20% (plant>aquatic>bird>plant, beast>bug>reptile>beast — an approximation of the original). Win by defeating all 3 enemy Axies.

## How multiplayer works
Room code = Firebase node `rooms/CODE`. The host browser is authoritative: it builds the battle, waits for both players' queued cards, resolves the round and writes the new state; guest and spectators subscribe live. Rematch restarts with the same teams once both players click it.

`npm test` runs engine tests (200 simulated AI-vs-AI games, energy/hand limits).
