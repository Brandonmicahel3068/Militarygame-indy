# OPERATION: TBD

A 3D military game, built in the browser by Indy.

## Current status

**Phase 0 — engine smoke test.** There's no game yet. Right now this repo proves
one thing: code pushed here builds and shows up on a real URL. That's on purpose.

> Deploy on day one, when there is nothing to break. Then you never have to debug
> "why won't it deploy" and "why won't it play" at the same time.

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
- [ ] Phase 1 — **Vertical slice**: move a soldier around, shoot one thing
- [ ] Phase 2 — Enemies that fight back
- [ ] Phase 3 — A real map with cover
- [ ] Phase 4 — Whatever Commander Indy says next

## Notes to self

- `node_modules/` and `dist/` are gitignored — they're generated, never commit them.
- All movement gets multiplied by `delta` (seconds since last frame) so the game
  runs at the same speed on a fast PC and a slow laptop.
