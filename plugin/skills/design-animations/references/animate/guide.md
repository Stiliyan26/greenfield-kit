# Building Animations

The decision layer for motion that feels right, distilled from Emil Kowalski's *Animations on the Web* course ([animations.dev](https://animations.dev/)). Decide here first; take every value from [STANDARDS.md](../review-animations/STANDARDS.md); then implement with the CSS, Motion for React or SVG reference.

## Contents
- Core Philosophy
- The Animation Decision Framework
- Where the values live
- Process

## Core Philosophy

An animation feels right when it satisfies three things at once:

1. **It feels natural.** It mirrors the physics of the real world. Nothing around us moves at a constant speed or appears out of nowhere — so `linear` easing feels lifeless and `scale(0)` entrances feel wrong.
2. **It has a purpose.** You can answer "why does this animate?" in one sentence, and neither you nor the user is surprised or annoyed by it.
3. **It's made with taste.** Taste is trained, not innate — the ability to tell good motion from bad and justify why. In a world where everyone's software works, taste is the differentiator.

Two consequences run through everything below:

- **Unseen details compound.** Most motion details users never consciously notice — that's the point. The aggregate of invisible correctness is what makes an interface feel expensive.
- **If everything animates, nothing stands out.** Motion is a spice, not the meal. Pace it through the experience; the more you add, the less each one is worth.

## The Animation Decision Framework

Answer these in order **before** writing animation code.

### 1. Should this animate at all?

Match motion to how often the user sees it — use the frequency table in [STANDARDS.md](../review-animations/STANDARDS.md#should-it-animate-frequency-table). Keyboard-initiated and 100+/day actions get no animation; a high-frequency selection highlight is **instant**, not a fade that trails one step behind.

### 2. What's the purpose?

Every animation needs one of: **explanation** (marketing/onboarding), **feedback/responsiveness** (a button that reacts to a press), **spatial consistency** (an element enters and exits the same way), **state indication**, **preventing a jarring change** (a toast that eases in instead of popping), or — rarely — **delight** (reserved for interactions seen seldom, so it stays a pleasant surprise). "It looks cool" on a frequently-seen element is not a purpose.

### 3. Then pick the ingredients

Easing → duration → physicality → (spring?) → interruptibility → performance → accessibility. Choose the easing first, then tune the duration to it — they are one decision.

## Where the values live

| Ingredient | Read |
| --- | --- |
| Easing curves, durations, physicality, springs, interruptibility, stagger, cohesion, reduced motion | [STANDARDS.md](../review-animations/STANDARDS.md) |
| CSS transitions, keyframes, transforms, `clip-path`, `@starting-style` | [css-animations](../css-animations/guide.md) |
| `motion/react`: `AnimatePresence`, `layout`/`layoutId`, motion values, recipes | [motion-react](../motion-react/guide.md) |
| SVG line drawing, origin, path morphing | [svg-animation.md](svg-animation.md) |
| Frame budget, dropped frames | [animation-performance](../animation-performance/guide.md) |
| Reduced motion, two-variant workflow | [animation-accessibility](../animation-accessibility/guide.md) |

Load a reference rather than approximating a value.

## Process

Great animations take iteration, not one sitting.

- **Record and scrub** the reference (and your own work) frame by frame; tune magic transform values live in the console.
- **Review deliberately** — replay at normal speed and inspect transitions with a fresh pass.
- **Test gestures on real devices** (hit the dev server by IP; opacity-heavy motion wants high-refresh screens).
- Steal like an artist: recreate great animations by studying proven products rather than inventing patterns.

To review motion, use the [review-animations](../review-animations/guide.md) reference. To name an effect, use [animation-vocabulary](../animation-vocabulary/guide.md).
