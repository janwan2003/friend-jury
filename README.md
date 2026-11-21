# Jurybox

Let your friends settle the argument. One person opens a case, the other side adds theirs from a link,
the group chat votes in secret, and the jury rules at the deadline with a shareable verdict card.

Live: https://pb-friend-jury.jan-bef.workers.dev · Product page: https://janwan2003.github.io/friend-jury/

## Stack
Cloudflare Worker (`pb-friend-jury`) serving `public/` as static assets. Each case is its own SQLite-backed
Durable Object (`Case`); per-IP hourly write limits live in a `Limiter` Durable Object. Rules are in `src/logic.js`.

## Develop
```
corepack pnpm@9.15.0 install
corepack pnpm@9.15.0 dev                      # http://127.0.0.1:8953
node --test tests/unit/*.test.js              # rules
node tests/e2e/run.mjs                        # Playwright, real Chromium, against the dev server
BASE=https://pb-friend-jury.jan-bef.workers.dev node tests/e2e/run.mjs   # against production (cleans up its cases)
node tools/render-images.mjs                  # og.png and icons
```
Deploy: `wrangler deploy` with `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` from the studio `.env`.
