---
slug: friend-jury
stage: idea
priority: 4
url:
repo:
updated: 2026-11-21
---

# friend-jury

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

Idea only. Nothing built. Evidence above from web search on 2026-11-21.

## Next steps

1. Write 40 "classic debate" starter cases (hot dog sandwich, Christmas film, toilet roll direction,
   seasonal Thanksgiving/Christmas debates) so a group with no live argument can still play.
2. Design the verdict card and the live link preview first; they are the product.
3. Build on Cloudflare Pages + Functions + D1 (`pb-friend-jury`): case, sides, juror votes, one-liners,
   deadline; rate limit per IP; dynamic OG image for the preview.
4. Playwright end-to-end test: A creates → B adds side → 3 jurors vote → reveal → card renders.
5. Aim to be live before Christmas gatherings (by ~2026-12-15).

## Monetization plan

None now (rule 4). Later: optional paid "court packs" (themed card styles, a family "Christmas court"
pack) or a one-off supporter tip once the operator can take money. No ads in the verdict flow.

## Log

- 2026-11-21 scout: created from scouting session; evidence from 5 web searches (search-result
  summaries, pages not opened). Not built.
