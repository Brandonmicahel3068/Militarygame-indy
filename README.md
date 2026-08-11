# OPERATION: TBD

A 3D military game, built in the browser by Indy.

## Play it

**https://militarygame-indy.netlify.app**

## Current status

**Phase 0 — engine smoke test. ✅ Live.** There's no game yet. Right now this repo
proves one thing: code pushed here builds and shows up on a real URL. That's on purpose.

> Deploy on day one, when there is nothing to break. Then you never have to debug
> "why won't it deploy" and "why won't it play" at the same time.

Netlify watches the `claude/3d-military-game-h573q3` branch. Every push builds and
publishes automatically — nobody uploads anything by hand.

## Running it

```bash
npm install     # get the dependencies
npm run dev     # local dev server, hot-reloads as you edit
npm run build   # production build into dist/
```

## The stack (and why)

| Piece        | What it does                                    | Why this one |
|--------------|-------------------------------------------------|--------------|
| **Three.js** | Draws 3D graphics using the GPU                  | Runs in any browser, no install, no launcher. Share a link and people just *play*. |
| **Vite**     | Bundles the code and serves it while developing  | Instant reloads. Change a number, see it change. |
| **Vercel**   | Hosts the built game at a public URL             | Push to git → new version goes live automatically. |

## Roadmap

- [x] Phase 0 — Engine boots, ground exists, it deploys
- [x] Phase 0.5 — Live at a public URL, auto-deploying on every push
- [x] Phase 1a — A soldier: jointed body, camo, idle animation, orbit camera
- [ ] Phase 1b — Make him move: WASD + a walk cycle
- [ ] Phase 1 — **Vertical slice**: move a soldier around, shoot one thing
- [ ] Phase 2 — Enemies that fight back
- [ ] Phase 3 — A real map with cover
- [ ] Phase 4 — Whatever Commander Indy says next

## Notes to self

- `node_modules/` and `dist/` are gitignored — they're generated, never commit them.
- All movement gets multiplied by `delta` (seconds since last frame) so the game
  runs at the same speed on a fast PC and a slow laptop.
