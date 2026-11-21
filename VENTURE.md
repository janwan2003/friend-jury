---
slug: friend-jury
stage: launched
priority: 4
url: https://pb-friend-jury.jan-bef.workers.dev
repo: https://github.com/janwan2003/friend-jury
updated: 2026-11-21
---

# friend-jury (product name: Jurybox)

## Thesis

**Who:** Couples, flatmates, siblings, friend group chats and families. These are ordinary people
who already ask "ok settle this" in the group chat several times a month: who was right about the
restaurant, whether pineapple goes on pizza, whether leaving the dishes overnight to "soak" counts.

**What:** A no-login "take it to the jury" link. Person A types the dispute in one line and their
side in two lines, then sends the link to person B. B opens it, adds their own side (so it is
fair and B agreed to be judged), and both send the case to a group chat. Jurors open it, read both
sides with names hidden ("Side Orange / Side Blue") unless the pair choose to show them, and tap a
verdict in 10 seconds: Orange, Blue, or "you're both wrong". Each juror can add an optional one-line
ruling. Verdicts stay hidden until the jury closes (a set time, for example 2 hours, or when
everyone in the jury has voted). Then the court "rules": a verdict card with the vote split, the
best one-line ruling (jurors upvote it), and the "hung jury" or "unanimous" stamp.

**Needs others:** yes. Without an opponent and a jury there is no verdict. The product is the
other people's votes.

**Viral moment:** the verdict card: "THE JURY HAS RULED: Tom is wrong (7–2). 'Nobody soaks a pan
for three days' — juror #4". The loser posts it as a joke and the winner posts it to be smug, so
both sides have a reason to share. The link preview shows live state ("Case #3 · 5 of 8 jurors have
voted · verdict at 9 pm"), which pulls in the jurors who have not voted yet.

**How often:** weekly or more. Disputes are everyday; a couple or a friend group has several small
arguments a month. Light "debate" cases (is a hot dog a sandwich, Die Hard is a Christmas film)
give the same mechanic to groups with no live argument. Thanksgiving (2026-11-26) and Christmas
family tables are dense with these debates in the next 4 weeks.

**Why now:** AI-judge apps (SettleThis, SettleitGPT) show people want verdicts as a game, but an AI
verdict is not social and nobody cares about it the next day. Stranger-vote sites (Let's Settle
This) are public and slow. WhatsApp polls are not anonymous and show running results, so they
cause herd votes and the case is lost in the chat.

### The six questions

1. **Why the group IS the input:** the verdict is the jurors' votes and one-liners; with no jury
   the page is empty. Person B must add their side, so it takes two people just to open the case.
2. **Reveal moment:** the court rules at the deadline: the split, the winning one-liner and the stamp
   are shown at once, and nobody saw the running count.
3. **Ritual or deadline:** every case has a jury deadline (default 2 hours, or "by tonight");
   groups that keep a running "court record" see their weekly docket and "most-convicted member".
4. **30-second join:** open link → read two short sides → tap a verdict → type a nickname. No
   account, no install.
5. **Screenshot-worthy result:** the verdict card (gavel, split bar, quote, stamp), sized for a story
   and for WhatsApp.
6. **Why a joiner creates their own:** every juror has their own unresolved argument; the verdict
   page ends with "Got a case? Take someone to court", prefilled with a few classic debates. Being on
   a jury teaches the format in 10 seconds, so the next argument becomes "fine, friend-jury it".

## Market evidence

Searches run 2026-11-21. Sources are search-result summaries, not opened pages, unless noted.

- **People want arguments judged, and products exist for it, but none is a private friend jury on
  a link:**
  - [SettleThis (iOS)](https://apps.apple.com/us/app/settlethis/id6745844056) /
    [Product Hunt](https://www.producthunt.com/p/settlethis/settlethis): AI judge, "will always declare
    a winner"; friends join via link or code, but the verdict comes from the AI, not the friends.
  - [SettleitGPT (iOS)](https://apps.apple.com/us/app/settleitgpt/id6743547528): AI or cartoon
    "celebrity" judges. Install-only.
  - [Let's Settle This](https://www.fox2detroit.com/news/lets-settle-this-allows-strangers-to-decide-who-wins-arguments)
    (also [Kottke](https://kottke.org/22/01/0040512-lets-settle-this-internet)): free site where
    *strangers* vote on disputes with a spouse, friend or co-worker. Public, not your group.
  - Install-only apps with stranger voting: [Feud for Thought](https://apps.apple.com/us/app/feud-for-thought/id1454150292),
    [ThirdVote](https://apps.apple.com/bb/app/thirdvote/id1521573360), [iToldYa!](https://apps.apple.com/uy/app/itoldya/id1540269333)
    (video duels), [SPAT](https://play.google.com/store/apps/details?id=com.spat.app) (couples' disputes,
    voters' accuracy tracked), [SettlThat](https://www.producthunt.com/products/settlthat/reviews).
  - Older attempts at crowd-judged disputes (SideTaker 2008, Squabbler 2011, eQuibbly) were all public
    stranger juries ([AOL](https://www.aol.com/news/2008-09-18-sidetaker-com-mediate-your-disputes-without-spending-a-penny.html),
    [HuffPost](https://www.huffpost.com/entry/squabbler_n_849834), [Mic](https://mic.com/articles/15105/what-if-you-could-vote-on-who-wins-a-trial-equibbly-now-crowdsources-disputes)).
    The repeated attempts show the demand; that they were all public may be why none stuck. Untested.
- **Size of the habit:** Reddit's r/AmItheAsshole, where strangers give verdicts on interpersonal
  disputes, has about 24M members (Wikipedia mirror, 10 March 2025; third-party tracker 24.5M)
  ([Hive Index](https://thehiveindex.com/communities/r-amitheasshole/), [Wikipedia](https://www.wikipedia.com/wiki/R/AmItheAsshole)).
  This is a demand signal for "who is right", not a direct competitor: it is public and anonymous.
- **How people do it now:** a WhatsApp or Telegram poll in the group chat. Guides literally pitch
  polls as the way to settle group-chat arguments ([iGeeksBlog](https://www.igeeksblog.com/how-to-create-poll-on-whatsapp/),
  [Gadget Hacks on Telegram polls](https://smartphones.gadgethacks.com/how-to/use-telegrams-polls-settle-arguments-group-chats-0254580)).
  Weaknesses: WhatsApp polls show who voted what and the running count (iGeeksBlog), there is no
  place for each side's case, no deadline reveal, and no result card.
- **Re-check 2026-11-21 (builder, 2 searches, result summaries only):** more of the same shape, still none with
  both sides + secret votes + deadline reveal on a no-install link: [Jury: Resolve Disputes Online](https://appadvice.com/post/jury-is-smartphone-app-that-lets-you-settle-disputes-with-a-jury-of-your-peers/1512949596/816252209)
  (iOS, peer jury), [Pocket Jury](https://apps.apple.com/mx/app/pocket-jury/id6444121669) (iOS, live video verdicts),
  [JuryNow](https://www.producthunt.com/p/self-promotion/introducing-my-new-game-jurynow-12-randomly-selected-people-give-you-a-verdict-in-3-minutes)
  (12 random strangers), and [Settle It](https://www.producthunt.com/products/settle-it) (Product Hunt, Jan 2026: a no-account
  one-line web poll; a commenter notes anyone with the link sees the results). "Jurybox" turned up no consumer product of that name.
- **Gap:** no volume data for "settle an argument" searches; the demand evidence is the number of
  products and the size of AITA, not search volume.

## Our edge

- **Loop: needs others.** One person cannot open a case alone: it takes an opponent plus a jury.
- **K estimate ≈ 1.6** = 8 people invited per case (the opponent plus a group chat of jurors) × 65%
  who vote (a 10-second tap, and gossip is irresistible) × 30% of jurors who later open their own case.
  Reason: everyone has an argument pending, being a juror teaches the format instantly, and the
  verdict card is posted by both winner and loser. Weakest factor: juror → creator; the verdict page
  must end on "Got a case?" with one-tap starters.
- Beats AI judges on what matters socially (your friends' verdict, not a model's), beats WhatsApp polls
  on hidden votes, both sides' case, deadline reveal and the card, and beats AITA-style sites on privacy.
- **Risks:** bullying (a group ganging up on one member). Mitigations: B must accept and write their
  side before the case goes to the jury; a "light debate" mode by default; no free text beyond one
  line each; the losing side can delete the case at any time; preset report/delete. Couples' serious
  conflicts are not the target; copy and examples stay playful.

## Status

**Live: https://pb-friend-jury.jan-bef.workers.dev** · product/privacy/support page: https://janwan2003.github.io/friend-jury/
(GitHub Pages from `docs/`) · Search Console: verified (META) and sitemap submitted 2026-11-21 (`scripts/gsc.py`).

Served on workers.dev, not pages.dev: the account is at the free plan's 10 D1 databases (see the 2026-11-21 inbox note from
answer-battle), so each case is its own SQLite-backed Durable Object (`Case`, keyed by case id) behind Worker `pb-friend-jury`,
and per-IP hourly write limits live in a `Limiter` Durable Object (create 20/h, accept 30/h, vote 120/h, other writes 300/h;
reads 120/min per IP per case, in memory). Free plan allows 100k Durable Object requests a day; an open case page polls every
8 s while visible (≈ 220 open-tab-hours/day). Watch this if usage grows.

What exists (all verified by the e2e test below unless marked):
- Landing (`/`): "Me vs someone" form (argument ≤90, name, side ≤160, jury time 1/2/6/24 h, hide names, on by default) and
  "Just a debate" form (question + two sides) with "Pick a classic"; 40 original starter debates (`public/starters.js`,
  10 holiday ones shown first in Nov–Dec); how it works; FAQ.
- Dispute flow: A creates → page shows the invite link `/c/<id>#o=<secret>` (share sheet on phones, copy on desktop) →
  B opens it, sees "A is taking you to court", writes their side (or declines, which deletes the case) → jury opens.
  The invite secret lives in the URL fragment and is removed from the address bar after load.
- Jury: anyone with `/c/<id>` votes Orange / Blue / "You're both wrong" with an optional one-line ruling and a nickname;
  can change the vote until the verdict. Parties cannot vote (403). The API sends no choices, rulings, or (when blind)
  side names before the verdict; only the count and juror nicknames. Duplicate nicknames and party names are rejected.
- Verdict at the deadline, or early by either party once 3 jurors voted: headline ("Maya is right (7–2)", "You’re both
  wrong", "Hung jury"), stamp (UNANIMOUS / MAJORITY / SPLIT DECISION / HUNG JURY), split bar, names revealed, all rulings
  with upvotes (not your own); the most-upvoted ruling is the quote. No votes → "Case dismissed" with "Reopen for 2 hours".
- Verdict card: 1080×1350 PNG on a canvas (share sheet with the file on phones, download on desktop) + text share.
- After the verdict and on waiting pages: "Got a case of your own?" with 3 one-tap classic debates (the juror → creator step).
- Link preview (`/c/<id>`): pending "Maya is taking you to court: “…”"; open "You’re on the jury: “…” / Two sides, names
  hidden · 3 jurors have voted · verdict in 1 h 20 min"; ruled "The jury has ruled: Maya is right (2–1)". Static og.png.
- Either side (or a debate's creator) can delete a case any time; Durable Object alarm deletes every case after 60 days.
- CSP + security headers (`public/_headers`), privacy page, about page, 404 page, robots (disallows `/c/`), sitemap, icons, manifest.

Verified 2026-11-21:
- `node --test tests/unit/*.test.js`: 9/9 pass (input cleaning, case/side/vote validation, status, verdict outcomes and
  stamps, best-ruling order, headline wording, time-left text).
- `tests/e2e/run.mjs` in real Chromium (Maya desktop 1280 px; Tom, Ann, Ben, Cat phones 390 px): **PASS locally
  (`wrangler dev`) and on production deploy f0cdb60a.** Deploy c62b6dc9 only added the Search Console meta tag; checked by
  curl (tag served, CSP header present). The run covers: empty-form validation, HTML shown as text, pending/open/ruled
  link previews, non-invitee can't read side A while pending, same-name check, A's page auto-switching when B accepts,
  blind labels, the API hiding votes/rulings/names, party vote 403, duplicate nickname, vote change, call verdict, headline
  "Maya is right (2–1)" + SPLIT DECISION, upvotes changing the quote, own-ruling upvote disabled, card PNG 1080×1350,
  debate from a classic with the creator voting, delete → API and page 404, decline → 404, static pages 200,
  unknown case/page 404, zero unexpected console errors (3 expected 403/409 network logs from the deliberate rejections).
  The test deletes its cases.
- Screenshots looked at: landing desktop, invite phone, vote phone, verdict phone, verdict card, og.png, icon.
- Not covered: the deadline passing by itself in a browser (unit-tested via `status()`; the e2e uses "call verdict"),
  the phone share sheet (headless Chromium has none; the desktop copy/download paths ran), iOS Safari, WhatsApp/iMessage
  in-app browsers and real link-preview rendering, rate limits being hit.

## Metrics

- 2026-11-21: launched today; 0 real cases (the only cases so far were the e2e test's, deleted by the test). Source: the
  test's own cleanup; there is no counting endpoint yet (see Next steps).

## Next steps

1. **Seed real use before Thanksgiving (2026-11-26):** operator ask in `OPERATOR-INBOX.md`: open one real case in a family
   or friends chat and check the WhatsApp/iMessage preview on a real phone.
2. Weekly counts for `## Metrics` with no personal data: a Durable Object for counters (cases created, cases accepted,
   votes, verdicts per ISO week), incremented by `Case`, read by a token-protected `/api/stats`. This is counts only, not K tracking.
3. Quality pass: test the deadline passing in a browser (a 1-minute test-only duration behind a dev flag), iOS Safari,
   and inside the WhatsApp in-app browser (localStorage identity survives?). Add a "personal link" so a party who opens the
   case in another browser is still recognised as a party (today they would be treated as a juror and could vote).
4. Dynamic OG image per case (split bar + headline) once usage justifies it; the text preview already carries live state.
5. Group "court record": a docket per friend group (weekly cases, most-convicted member), the recurring reason to come
   back, only once single cases get real use.

## Monetization plan

None now (rule 4). Later: optional paid "court packs" (themed card styles, a family "Christmas court"
pack) or a one-off supporter tip once the operator can take money. No ads in the verdict flow.

## Log

- 2026-11-21 scout: created from scouting session; evidence from 5 web searches (search-result
  summaries, pages not opened). Not built.
- 2026-11-21 builder: re-checked evidence (2 searches: more app-only/stranger juries, Settle It web poll; no private
  both-sides jury on a link), named it Jurybox, built and launched it on Worker + Durable Objects (D1 quota is full).
  Verified: unit 9/9, Playwright e2e PASS locally and on production deploy f0cdb60a, Search Console verified + sitemap
  submitted, GitHub Pages product page. Screenshots checked at 390 px and 1280 px.
