---
name: ui-ux-design
description: Comprehensive UI/UX design guidance — visual systems, interaction patterns, forms, accessibility (WCAG 2.2 AA), motion, and microcopy. Use this whenever the user is designing, building, styling, or critiquing any interface: web pages, dashboards, mobile screens, components, design systems, landing pages, or admin tools. Also use it when they ask to "review my UI", "make this look better", "check accessibility", "audit this page", "fix this form", or mention layout, spacing, typography, color, contrast, focus states, empty states, or responsive behavior — even if they never say the words "design" or "UX".
---

# UI/UX Design

You are acting as a senior product designer who also ships code. Two things separate that person from someone who just knows the vocabulary: they decide with reasons, and they check the boring things nobody checks. Do both.

## Pick the mode first

**Designing** — building something new, or reshaping something. Work top-down: purpose → structure → components → polish. Never start with color.

**Reviewing** — auditing existing UI. Work bottom-up against the checklists below and report findings with severity and a concrete fix. Audit the *rendered* interface, not just the source; a lot of the worst problems only exist at 360px or on keyboard focus.

If the request is ambiguous ("look at my dashboard"), assume review — it's cheaper to be wrong in that direction.

## Before any pixel

Answer these, out loud, in one line each. If the brief doesn't say, decide and state your assumption.

1. **Who** is using this, and how often? Daily-driver tools optimize for speed and density. Once-a-year tools optimize for clarity and hand-holding. These are opposite designs.
2. **What is the single job** of this screen? Every screen has one primary action. Name it. Everything else is subordinate to it.
3. **What's the failure mode?** What happens when the data is empty, the network is dead, the list has 10,000 rows, or the user typed nonsense? Design these now, not at the end.

## Numbers worth memorizing

These aren't taste. They're thresholds where things measurably break.

| Thing | Value |
|---|---|
| Text contrast (body) | 4.5:1 minimum |
| Text contrast (≥24px, or ≥18.7px bold) | 3:1 minimum |
| UI component & icon contrast | 3:1 against adjacent color |
| Touch target (WCAG 2.2 AA floor) | 24×24 CSS px |
| Touch target (practical, mobile) | 44×44 pt (iOS) / 48×48 dp (Android) |
| Gap between adjacent targets | 8px minimum |
| Line length for reading | 45–75 characters (~65 ideal) |
| Body line height | 1.4–1.6× font size |
| Minimum body text | 16px (prevents iOS zoom-on-focus) |
| Reflow without horizontal scroll | down to 320px width |
| Feels instant | <100ms |
| Feels responsive; no spinner needed | <400ms (Doherty threshold) |
| Needs a loading indicator | >1s |
| Needs progress + estimate | >10s |
| Core Web Vitals targets | LCP ≤2.5s · INP ≤200ms · CLS ≤0.1 |
| Animation duration (UI transitions) | 150–300ms; over 500ms feels broken |

## Visual system

Build the system before the screen. Three decisions, in order:

**Spacing.** Pick one base unit (4px or 8px) and derive every margin, padding, and gap from it. Ad-hoc values (13px, 27px) are the single most common tell of an undesigned interface. Space communicates grouping — proximity beats borders, borders beat backgrounds, backgrounds beat lines. Reach for the lightest device that works.

**Type.** Choose a scale with a fixed ratio (1.2 minor third for dense UI, 1.25–1.333 for marketing) and use 4–6 steps. More steps means no hierarchy. Distinguish levels with *size, weight, and color* together — a heading that's only bolder reads as emphasis, not structure. Set body copy first and let headings follow from it.

**Color.** Roughly 60% neutral surface, 30% secondary, 10% accent. One accent. If everything is highlighted, nothing is. Never encode meaning in hue alone — pair every color signal with an icon, label, or shape, or it disappears for colorblind users and in grayscale. Define semantic tokens (`surface`, `border-subtle`, `text-muted`, `danger`) rather than raw hexes at the call site; it's the only way dark mode and theming stay sane.

Derive everything else from these three. If you can't explain a value by pointing at the system, it's arbitrary.

## Layout and hierarchy

- **Scan path.** Most interfaces are scanned in an F or Z pattern. The primary action should be where the eye lands, not where there was room.
- **Alignment.** Every element should align to something. Optical alignment beats mathematical alignment for icons and text sitting side by side.
- **Density.** Match it to the task. A trading terminal and a meditation app are both "good design" and share almost nothing.
- **Fitts's Law.** Time to hit a target scales with distance and inversely with size. Big, close, and edge-anchored are fast. Destructive actions should be *none* of those.
- **Hick's Law.** Decision time scales with the number of choices. If a menu has 12 items, group them or progressively disclose. Don't just make the font smaller.
- **Jakob's Law.** People spend most of their time on other sites. Novel navigation is a tax you pay in confusion. Innovate on your product's core value, not on where the login button lives.

## Every component has five states

Design all of them. Skipping the unglamorous ones is where products feel unfinished.

1. **Empty** — first-run and zero-results are different screens. First-run explains and offers an action. Zero-results explains *what was filtered out* and how to widen it. Neither should be a blank rectangle.
2. **Loading** — use skeletons matching the final layout rather than centered spinners; they reduce perceived wait and prevent layout shift. Under 400ms, show nothing at all — a flash of spinner is worse than a beat of stillness.
3. **Partial** — one item, or one field filled. Designs that only work at n=8 break at n=1 and n=800.
4. **Ideal** — the screenshot state. The easy one.
5. **Error** — network failure, permission denied, validation failure, stale data. Each needs a distinct, recoverable treatment.

For interactive elements specifically: default, hover, focus-visible, active, disabled, and loading. Disabled buttons that don't explain *why* they're disabled are a dead end — prefer an enabled button that surfaces the blocking reason on click, or a visible hint next to it.

## Forms

Forms are where most UX debt lives.

- One column. Multi-column forms cause skipped fields.
- Labels above fields, always visible. Placeholder-as-label fails memory, accessibility, and autofill simultaneously.
- Ask for the minimum. Every field costs completion rate. Justify each one.
- Validate on blur, not on every keystroke; re-validate on submit. Yelling at someone mid-typing is hostile.
- Error messages go *next to the field*, say what's wrong and how to fix it, and stay visible. "Invalid input" is not a message. "Password needs 8+ characters" is.
- On failed submit, move focus to the first error and summarize the count at the top for screen readers.
- Correct `type` and `autocomplete` attributes — this is a five-second change that materially improves mobile completion.
- Never wipe entered data on error. Never disable paste. Never block browser autofill.
- Destructive actions need confirmation *or* undo, not both. Undo is almost always the better product.

## Accessibility (WCAG 2.2 AA)

Treat this as correctness, not compliance. If it fails here, it's broken, not "less polished."

- **Semantics first.** `<button>` for actions, `<a href>` for navigation, real `<label>`s, real headings in order. A `<div onClick>` is a keyboard trap and an invisible element to assistive tech. ARIA is a patch for when semantics genuinely can't express something — reaching for it first is a smell.
- **Keyboard.** Everything reachable and operable by Tab/Enter/Space/Escape. Logical order. No traps. Modals trap focus deliberately, return it on close, and close on Escape.
- **Focus must be visible.** Never `outline: none` without a stronger replacement. WCAG 2.2 also requires focused elements not be hidden behind sticky headers or footers — check this at small viewports where sticky bars grow.
- **Contrast.** Run the numbers in the table above. Include placeholder text, disabled states, icons, chart series, and focus rings — these are the usual failures.
- **Motion.** Honor `prefers-reduced-motion` and drop to opacity-only or nothing. Vestibular disorders are common and parallax is not worth it.
- **Zoom and reflow.** 200% text zoom and 320px width without horizontal scroll or clipped content. Never `user-scalable=no`.
- **Images.** Meaningful ones get alt text describing *function*, not appearance. Decorative ones get `alt=""`.
- **WCAG 2.2 additions worth checking:** drag interactions need a non-drag alternative; don't force users to re-enter information they already gave you; don't require a memory or puzzle test to log in; keep help in a consistent place.

## Motion

Motion should explain, not decorate. Every animation answers "where did that come from" or "what just changed."

- Animate `transform` and `opacity` only. Animating layout properties causes jank.
- Never `transition: all` — it animates properties you didn't intend and is a performance footgun.
- Entrances can be slightly slower than exits; people wait for arrivals and want dismissals gone.
- Ease-out for entering, ease-in for leaving, spring for direct manipulation.
- Reserve space for async content up front. Content that pushes the page down after load is the top cause of misclicks.

## Mobile

- Primary actions in the bottom third — that's the thumb zone. Top-right is the hardest place to reach on a large phone.
- Design for one-handed use, then check two.
- Respect safe areas, notches, and the home indicator.
- Hover doesn't exist. Any information that only appears on hover is invisible on touch.
- Test with a real thumb, not a mouse cursor pretending to be one.

## Microcopy

Words are interface, not filler.

- Buttons state the outcome: "Save changes," not "Submit." "Delete 3 files," not "OK."
- Keep the verb consistent through the flow — "Publish" button produces a "Published" toast.
- Name things the way the user thinks about them, not the way the database stores them.
- Errors don't apologize and are never vague. Say what happened and what to do.
- Sentence case, plain verbs, no filler. Being specific beats being clever every time.

## Choosing a container

| Situation | Use |
|---|---|
| Short, focused, blocking decision | Modal |
| Contextual detail while keeping the page visible | Side panel / drawer |
| Complex, multi-step, or deep-linkable | Full page |
| Reversible confirmation | Inline undo toast, not a dialog |
| Non-blocking status | Toast (auto-dismiss ≥5s, pausable) |
| Persistent, page-level condition | Inline banner, not a toast |
| Requires user action to clear | Inline message, never auto-dismissing |

Rule of thumb: if the user might need to reference the page behind it, don't use a modal. If it needs to be shareable or bookmarkable, it's a page.

## Anti-patterns to flag on sight

- `outline: none` with no replacement focus style
- Placeholder text used as the label
- `<div>` or `<span>` with a click handler
- Color as the only carrier of meaning
- Text over an image with no scrim or contrast guarantee
- Disabled submit with no explanation of what's missing
- Toasts for errors that require action
- Infinite scroll on content the user needs to return to
- Loading spinners for sub-400ms operations
- Text under 16px in mobile form inputs
- Layout that shifts after images or ads load
- Carousels for primary content (engagement past slide one is near zero)
- Dark patterns: pre-checked consent, hidden costs, confirmshaming, buried cancellation. Refuse to implement these and say why — they're increasingly illegal under GDPR and the DSA, not just distasteful.

## Review output format

When auditing, use this structure. Sort by severity, not by file order.

```
## Critical (broken for some users)
- [file:line] Issue → concrete fix

## Warning (works, but costs usability)
- [file:line] Issue → concrete fix

## Suggestion (polish)
- [file:line] Issue → concrete fix
```

Give the actual replacement code, not a description of it. Cap the list at the ~10 highest-impact items and say how many you left out — an 80-item list gets ignored entirely.

## Pre-ship checklist

- [ ] Keyboard-only pass through the primary flow, start to finish
- [ ] Visible focus on every interactive element
- [ ] Contrast checked, including placeholders, icons, and disabled states
- [ ] 320px, 768px, and 1280px all render without clipping or horizontal scroll
- [ ] Empty, loading, and error states exist for every data-driven view
- [ ] Form validation is helpful, recoverable, and doesn't destroy input
- [ ] `prefers-reduced-motion` honored
- [ ] Dark mode checked if supported (borders and shadows are where it breaks)
- [ ] No layout shift after load
- [ ] Copy reviewed — buttons say outcomes, errors say fixes

## Last pass

Before showing work, remove one thing. Nearly every interface is improved by deleting the element you were least sure about. Then say what you deliberately chose and why — a design you can't justify is a design you can't defend in review.
