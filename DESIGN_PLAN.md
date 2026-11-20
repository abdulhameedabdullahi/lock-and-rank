# Lock & Rank — Design Plan (Phase 1)

## Screen & component audit

| Screen | File | Key UI areas |
|---|---|---|
| Splash (feed/inline) | `splash.tsx` | Title, today's round info, single CTA button |
| Loading (inline) | `game.tsx` (inline states) | Centered loading text |
| Home | `HomeScreen.tsx` | Header with streak, scrollable topic cards |
| Prompt | `PromptScreen.tsx` | Round briefing, how-to block, start button |
| Play | `PlayScreen.tsx` | Category header, progress bar, 5 slot buttons, hint, item card, lock button |
| Reveal | `RevealScreen.tsx` | Ordered results with animation delay, progress bar, skip button |
| Result | `ResultCard.tsx` | Score + grade, marks list, crowd data, share sheet, leaderboard, navigation |
| Stats | `StatsScreen.tsx` | 2×2 stat grid, streak freeze block |
| Topic picker | `TopicPicker.tsx` | 2-column topic toggle grid, save/all buttons |
| Archive list | `ArchiveListScreen.tsx` | Scrollable past-round list |

---

## (a) Token system

### Colour

| Token | Hex | Role |
|---|---|---|
| `--color-bg` | `#151B45` | Deep indigo page background |
| `--color-board` | `#25306B` | Board surface, empty slot face, secondary surfaces |
| `--color-tile` | `#F2F4FA` | Locked tile face, primary text on dark bg |
| `--color-signal` | `#FFCB2E` | Signal yellow — selected slot, locked state, exact match, primary CTA |
| `--color-miss` | `#E23D7A` | Miss pink — 3+ off (symbols and large text only, not body copy) |
| `--color-soft` | `#8B9BC8` | Secondary text on dark surface (passes AA at 4.6:1) |
| `--color-groove` | `#1E2860` | Row divider, recessed slot, inset line |

**WCAG AA contrast (all on `--color-bg` #151B45):**
- `--color-tile` #F2F4FA → 15.1:1 ✓ AAA
- `--color-signal` #FFCB2E → 9.8:1 ✓ AAA
- `--color-soft` #8B9BC8 → 4.6:1 ✓ AA
- `--color-miss` #E23D7A → 4.2:1 — large text and symbols only (≥18pt bold)

**Result-mark state encoding (colour + symbol, never colour alone):**

| Mark | Colour | Symbol | Meaning |
|---|---|---|---|
| Exact | signal yellow | ✓ | Chosen rank = true rank |
| 1 off | tile white | ◆ | One rank away |
| 2 off | board indigo + soft border | ▲ | Two ranks away |
| 3+ off | miss pink | ✕ | Three or more away |

### Typography

| Token | Value | Used for |
|---|---|---|
| `--font-display` | `'Big Shoulders Display Variable', …, sans-serif` | Rank numerals in tiles, screen titles, score readout |
| `--font-sans` | `'Bricolage Grotesque Variable', …, ui-sans-serif, sans-serif` | All body text, labels, buttons |

Both are variable-axis (wght), OFL-licensed, Latin subset, `font-display: swap`.
Bundle: Big Shoulders Display Latin woff2 ~35 KB + Bricolage Grotesque Latin woff2 ~40 KB = **75 KB total**.

**Type scale:**

| Tailwind class | Size | Line-h | Font | Usage |
|---|---|---|---|---|
| `text-xs` | 11px | 1.4 | sans | Meta info, counters |
| `text-sm` | 13px | 1.4 | sans | Secondary labels, hint text |
| `text-base` | 15px | 1.5 | sans | Body, descriptions |
| `text-lg` | 18px | 1.3 | sans | UI labels, rule text |
| `text-xl` | 22px | 1.2 | sans | H2, round titles |
| `text-2xl` | 28px | 1.1 | display | H1 screen titles |
| `text-tile` | 20px | 1 | display | Rank numerals inside flap tiles |
| `text-score` | 56px | 1 | display | Score readout on result card |

All rank numbers and scores: `font-variant-numeric: tabular-nums`.
Max line length: 60ch play screen, 72ch result.

### Spacing

Standard 4px grid. Board internal row gap: 1px (groove line, not spacing).

### Radii

| Variable | Value | Assigned to |
|---|---|---|
| (none — 0px) | 0 | Flap tiles (mechanical, hard-edged) |
| `--radius-btn` | `2px` | Interactive buttons |
| `--radius-surface` | `4px` | Card and panel containers |

Radius is not decorative — it encodes hierarchy: tiles hardest (0), buttons slightly human (2px), surfaces most contained (4px). No `rounded-lg`, `rounded-xl`, or `rounded-full` anywhere in the board or game UI.

### Elevation (shadows)

| Token | Value | Used on |
|---|---|---|
| `--shadow-tile` | `0 2px 0 rgba(0,0,0,0.5)` | Flap tiles (physical weight downward) |
| `--shadow-btn` | `0 1px 0 rgba(0,0,0,0.4)` | Buttons (lighter, shallower) |
| `--shadow-board` | `inset 0 2px 8px rgba(0,0,0,0.5)` | Board container (depth recession) |

---

## (b) ASCII wireframes

### Splash (feed inline, ~180px viewport height)

```
┌──────────────────────────────────────┐
│                                      │
│  Lock & Rank                         │  ← text-2xl display, left-aligned
│  🔥 4 day streak                     │  ← signal yellow, sm; hidden if 0
│                                      │
│  "Five most-watched Netflix series   │  ← today's round title, text-lg
│   by episode count"                  │
│  3,241 players today                 │  ← text-sm, soft
│                                      │
│  ┌────────────────────────────────┐  │
│  │      Play today's round        │  │  ← primary btn, signal yellow bg
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

No eyebrow label above title. No "DAILY GAME" tracked label. No "→" on the button.

---

### Home screen

```
┌──────────────────────────────────────┐
│  Lock & Rank            [Topics]     │  ← Topics = secondary btn, top-right
│  Thursday, 20 Nov · 🔥 4 day streak  │  ← text-sm, soft; streak in signal
│  ──────────────────────────────────  │
│                                      │
│  ┌──────────────────────────────┐    │
│  │  🎲 Daily Mix                │    │  ← topic emoji + label, text-sm
│  │  Five most-watched series    │    │  ← title, text-xl
│  │  by episode count            │    │
│  │  ●●○  Medium      [Play]    │    │  ← difficulty dots + play badge
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │  🏅 Sports                   │    │
│  │  Grand Slam wins since 2000  │    │
│  │  Done  87/100  A             │    │  ← right-aligned on same row
│  └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

Cards use `--radius-surface` (4px), `--shadow-tile`. Play badge is an inline button, not a floating pill. No tracking-out TOPIC NAME labels; topic info is sentence-case.

---

### Topic picker

```
┌──────────────────────────────────────┐
│  ← Back                              │
│  Your topics                         │  ← text-2xl, sentence case
│  One extra round per topic daily     │  ← text-sm, soft
│                                      │
│  ┌─────────────┐  ┌─────────────┐   │
│  │ 🏅 Sports ✓ │  │ 🎬 Film      │  │  ← grid-cols-2, 44px min-height
│  └─────────────┘  └─────────────┘   │
│  ┌─────────────┐  ┌─────────────┐   │
│  │ 🌍 Geo       │  │ 🎵 Music  ✓ │  │
│  └─────────────┘  └─────────────┘   │
│                                      │
│  [     Pick all topics              ]│  ← secondary btn
│  [     Save 2 topics                ]│  ← primary btn, signal yellow
└──────────────────────────────────────┘
```

Selected = tile-white bg, bg-color text (inverted). Unselected = board-indigo bg. No `border-2 border-ink`; the palette handles contrast.

---

### Play screen (the board — primary gameplay view)

```
┌──────────────────────────────────────┐
│  Geography                           │  ← text-sm, sentence case
│  By elevation, highest first         │  ← text-lg rule (no eyebrow label above)
│  Item 2 of 5                         │  ← text-sm, soft
│  ▬ ▬ ░ ░ ░   (progress: 2 of 5)     │  ← 5 segments, signal yellow = done
│                                      │
│  ╔════════════════════════════════╗  │
│  ║  BOARD (--color-board bg)      ║  │  ← --shadow-board inset
│  ╠────────────────────────────────╣  │
│  ║  1  │ 🗻 Everest    locked     ║  │  ← locked row: tile-white bg, 0px radius
│  ╠────────────────────────────────╣  │
│  ║  2  │  [selected — yellow]     ║  │  ← selected: signal-yellow bg
│  ╠────────────────────────────────╣  │
│  ║  3  │                          ║  │  ← empty: board-indigo
│  ╠────────────────────────────────╣  │
│  ║  4  │                          ║  │
│  ╠────────────────────────────────╣  │
│  ║  5  │                          ║  │
│  ╚════════════════════════════════╝  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │       🏔   K2                  │  │  ← current item: large emoji + name
│  │   Lock this into a rank        │  │  ← text-sm, soft
│  └────────────────────────────────┘  │
│                                      │
│  [💡 Hint (−5 pts)]                  │  ← secondary, full-width
│  [        Lock into rank 2          ]│  ← primary CTA, signal yellow
└──────────────────────────────────────┘
```

Board layout: rank numeral in a fixed 32px display-font column on the left; item content fills the right. Each row is a `.flap` primitive (0px radius, hard edge, 2px bottom groove). The current item card is a `.surface` (4px radius) below the board.

---

### Reveal (the split-flap flip moment)

```
┌──────────────────────────────────────┐
│  True order                          │  ← text-lg, sentence case
│  By elevation, highest first         │  ← text-sm, soft
│                                      │
│  ╔════════════════════════════════╗  │
│  ║  1  │ 🗻 Everest  8849m   ✓   ║  │  ← flipped: signal-yellow, exact
│  ╠────────────────────────────────╣  │
│  ║  2  │ 🏔 K2       8611m   ◆   ║  │  ← flipped: tile-white, 1 off
│  ╠────────────────────────────────╣  │
│  ║  3  │  [spinning…]             ║  │  ← mid-flip (edge-on), board-indigo
│  ╠────────────────────────────────╣  │
│  ║  4  │  [not yet flipped]       ║  │
│  ╠────────────────────────────────╣  │
│  ║  5  │  [not yet flipped]       ║  │
│  ╚════════════════════════════════╝  │
│                                      │
│  ══════════════════░░░░░░  (timer)   │  ← 2px signal-yellow progress line
│                                      │
│  [           Tap to skip            ]│  ← NOT "Skip →"
└──────────────────────────────────────┘
```

Rows flip one at a time, top-to-bottom, staggered 400ms. Each flip: 180ms ease-in (hides front face) + 180ms ease-out (reveals back face) = 360ms per row. Total ~2.0s, timer fires at 2.3s.

---

### Result card

```
┌──────────────────────────────────────┐
│  ┌────────────────────────────────┐  │
│  │  🎲 Daily Mix                  │  │  ← text-sm topic label
│  │  Five most-watched series      │  │  ← category, text-xl
│  │                                │  │
│  │   87            A              │  │  ← text-score (56px display) + grade
│  │  ──────────────────────────    │  │
│  │  ✓  🗻 Everest    #1 → #1      │  │  ← mark tile (32×32) + item name
│  │     8849m · You: exact         │  │  ← text-sm, soft (two lines per row)
│  │  ◆  🏔 K2         #2 → #3      │  │
│  │     8611m · You: 1 off         │  │
│  │  [✓][◆][✕][▲][✓]  share grid  │  │  ← 5 share tiles, spoiler-free
│  │  ──────────────────────────    │  │
│  │  Top today  · Next in 4h 20m   │  │
│  └────────────────────────────────┘  │
│  [      Share to comments           ]│
│  [      Play Sports 🏅              ]│
│  [Home]    [My stats]  [Past rounds] │
└──────────────────────────────────────┘
```

Score uses `text-score` (56px) + `font-display`. No middle-dot meta chains — two lines per result row: item name on line 1 (bold), value + offset on line 2 (soft). Grade is next to score, not in an eyebrow label.

---

### Stats screen

```
┌──────────────────────────────────────┐
│  ← Back                              │
│  Your stats                          │  ← text-2xl, sentence case
│                                      │
│  ┌────────────────┐ ┌──────────────┐ │
│  │  Games played  │ │  Streak      │ │
│  │      42        │ │  🔥 6        │ │  ← text-2xl display for numbers
│  └────────────────┘ └──────────────┘ │
│  ┌────────────────┐ ┌──────────────┐ │
│  │  Best streak   │ │  Best score  │ │
│  │      14        │ │  91/100      │ │
│  └────────────────┘ └──────────────┘ │
│  ┌────────────────────────────────┐  │
│  │  Average score   73/100       │  │  ← wide cell
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │  🧊 Streak freeze              │  │
│  │  Used this week — resets Monday│  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

Cell labels are sentence-case (not `GAMES PLAYED` tracked). Numbers in display font.

---

## (c) Motion spec

### Reveal flip (the one memorable moment)

The board rows flip exactly like split-flap departure tiles. Each row has two faces rendered in a 3D perspective container:
- **Front face**: what the player placed (their chosen rank + item)
- **Back face**: the true rank + item + result mark (hidden until flip)

**Per-row animation sequence:**
1. Front hides: `rotateX(0deg → 90deg)`, 180ms, `ease-in` (tile leaves view edge-on)
2. At 90° the content swaps (front → back), background colour changes instantly
3. Back reveals: `rotateX(-90deg → 0deg)`, 180ms, `ease-out` (tile arrives from edge)

**Stagger:** row `n` starts at `(n − 1) × 400ms`.
**Total reveal:** 4 × 400ms + 360ms = 1,960ms (~2.0s).
**Auto-advance timer:** 2,300ms (300ms hold after last row lands).
**Perspective:** `600px` on the board container.

```
@keyframes flip-out {
  from { transform: perspective(600px) rotateX(0deg); }
  to   { transform: perspective(600px) rotateX(90deg); }
}
@keyframes flip-in {
  from { transform: perspective(600px) rotateX(-90deg); }
  to   { transform: perspective(600px) rotateX(0deg); }
}
```

Colour changes at the midpoint (90°): board-indigo → signal-yellow (exact), tile-white (1 off), board-indigo+border (2 off), miss-pink (3+). No cross-fade — instant swap while edge-on so the colour lands with the tile.

**Skip:** tapping "Tap to skip" clears all running animations and renders the final state immediately (all rows show true order + marks, no transition).

### Tap response (play screen lock)

When the player confirms "Lock into rank N":
- The locked board row does a quick snap: `scaleY(1 → 0.92 → 1)`, 120ms, `ease-in-out`
- Confirms the action before the next item appears

No hover transitions on other elements. No slide-up entrances. Only snap-on-tap.

### prefers-reduced-motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Reveal renders final state immediately (all rows at 0° showing true order). Lock snap is omitted. Auto-advance timer still fires (at 2,300ms) so reduced-motion users can still tap to skip or wait.

---

## (d) Copy — definitive button and message text

**Splash**
- Not played: "Play today's round"
- Already played: "See today's score"
- Streak: "{N} day streak" (no extra punctuation)
- Players: "{N,NNN} players today"

**Prompt**
- Back: "Home"
- Start: "Start ranking"
- Body: "Five items appear one at a time. Lock each into a rank from 1 to 5 — used slots stay locked. No undo. Use the hint on the first two items to rule out two wrong slots (costs 5 pts)."

**Play**
- Lock CTA (slot selected): "Lock into rank {N}"
- Lock CTA (no slot selected): "Pick a rank"
- Lock CTA (pending): "Locking…"
- Hint (available): "Hint (−5 pts)"
- Hint confirm: "Use hint"
- Hint cancel: "Cancel"
- Hint (used): "Hint used"
- Hint (item 3–5): "Hint: items 1–2 only"
- Item instruction: "Lock this into a rank" (not "Lock this", not "TAP A SLOT")

**Reveal**
- Skip button: "Tap to skip" (not "Skip →")
- Reduced-motion skip: "See your score"

**Result**
- Share: "Share to comments"
- Copy result: aria-label "Copy result" (icon button)
- Play next: "Play {topic label} {emoji}"
- Choose topics (new player): "Choose my topics" (no "→")
- Home: "Home"
- Stats: "My stats"
- Archive: "Past rounds"
- Post: "Post comment"
- Cancel: "Cancel"
- View shared: "Shared — view comment" (no "✓ —")
- Join: "Join r/{name}"
- Next round: "Next round in {Xh XXm}"

**Stats**
- Back: "Back"
- Freeze available: "Counts as one played day if you miss — resets Monday"
- Freeze used: "Used this week — resets Monday"

**Topic picker**
- Back: "Back"
- Save N topics: "Save {N} topics"
- Save 0 topics: "Save (Daily Mix only)"
- Pick all: "Pick all topics" (not "Surprise me (all topics)")
- Hint body: "Tap to toggle. Each topic adds one extra round per day."
- Dismiss: "Got it"

**Archive**
- Back: "Back"
- Subtitle: "Replay any past round — no score saved"

**Errors (say what went wrong and what to do)**
- Load fail: "Could not load today's round. Try again."
- Lock fail: "Could not lock that choice. Try again."
- Save fail: "Could not save topics. Try again."
- Archive fail: "Could not load this round."
- Stats fail: "Could not load stats."

---

## (e) Review — what I checked against the generated-design defaults

**ALL-CAPS tracked-out eyebrow labels.** Every existing screen has `tracking-[0.22em] uppercase` on category, topic, and section labels (`"DAILY GAME"`, `"LOCK THIS"`, `"TRUE ORDER"`, `"SHARE · ORDER YOU SAW THEM"`). This is the most visible template tell in the current codebase. In Phase 2 all of these become sentence-case in Bricolage Grotesque medium weight with no letter-spacing increase. Exception allowed: rank numerals 1–5 inside flap tiles are uppercase display figures — they are literal ranked content, not word labels.

**`rise` fade-and-slide-up on reveal rows.** The current reveal uses an `animationDelay` stagger with `opacity: 0 → 1` and `translateY: 8px → 0` on each result row — literally the most common generated-animation pattern. I replaced it with a physically motivated `rotateX` split-flap flip. The flip is unexpected, specific to the product metaphor (a physical departures board), and cannot be confused with a Tailwind animation template.

**Middle-dot meta strings.** `ResultCard.tsx` line 224 chains: `"8849m · true #1 · you #1 · 20 pts · crowd avg #1 · 65% right"` as one string. This is the information-architecture equivalent of "A · B · C" labels. In Phase 2 this becomes two lines per result row: item name in `font-black` on line 1; `{value} · You: {offset}` in `text-sm text-soft` on line 2.

**"→" on buttons.** Two current buttons: `"Choose my topics →"` (ResultCard) and `"Skip →"` (RevealScreen). Arrows imply spatial navigation that isn't happening. Removed.

**Identical `.chunk` cards with the same hard shadow everywhere.** `.chunk` = `border-2 border-ink bg-card box-shadow: 4px 4px 0 var(--color-ink)` is applied to slot tiles, item cards, hint blocks, stat cells, topic cards, and the archive list — every surface at the same visual weight. The new system deliberately differentiates: tiles = 0px radius + bottom-only shadow (physical weight), buttons = 2px radius + 1px shadow (lighter), surfaces = 4px radius (containers). Shape encodes role.

**Fade transition on all `button` elements.** The current `button` selector in `index.css` adds `transition: background-color 0.12s ease, color 0.12s ease, opacity 0.12s ease, box-shadow 0.12s ease`. This creates the smooth-hover effect that is pervasive in template UI. In Phase 2 only the `press:active` scale is kept on interactive elements; no hover-fade transitions.

**Font.** `ui-sans-serif, system-ui, Roboto` is the implicit no-decision font. Big Shoulders Display (condensed, high stroke contrast, signage heritage) + Bricolage Grotesque (variable grotesque with deliberately uneven optical rhythm) make a specific, non-generic pair. Bricolage's internal irregularity means body text at any size looks purposefully chosen rather than defaulted to.

**What I kept from the existing design:** the `press:active` translate (tap feedback is correct and distinctive); the minimum 44px tap targets; the `prefers-reduced-motion` guard; the `tabular-nums` on scores; the aria-labels; the 4px spacing grid.

**Palette decision.** The brief offered deep indigo + signal yellow + miss pink as a starting point and said to revise only if the review found something better. I kept it. The original cream-tangerine had warmth but was generic. Deep indigo + signal yellow is specific: it reads as a physical departure board, which is exactly the reveal metaphor. The cold blue-purple makes the yellow land with more force than any warm-tinted alternative would.

---

*Build status: type-check and build should pass after token changes. Font bundle: 75 KB (Latin subset woff2 via unicode-range download). Screens are unstyled relative to the new palette until Phase 2.*
