---
name: design-animations
description: Designs, implements, debugs and audits purposeful web motion with the animations.dev course recipes. Use for transitions, easing, springs, hover and press feedback, entrances and exits, drawers, sheets, toasts, modals and popovers; Motion for React (framer-motion, AnimatePresence, layoutId), CSS keyframes and clip-path; drag, swipe and scroll animation (reveal on scroll, parallax); reduced motion (prefers-reduced-motion); animation that feels janky, laggy or off, stutters, flickers, jumps or drops frames; choosing an animation library; naming an effect ("what's it called when..."); a motion brief, prototypes to compare, or an audit of where motion would help.
---

# Motion

Make web motion that has a purpose. Keep the character of the project's
existing motion.

## Rules

- Use the project's existing animation stack. A recipe that names a library
  is not a request to install it.
- Check each recipe against the installed library version.
- Keep keyboard and touch behavior usable. Do not add a two-tap activation
  pattern to ordinary controls to imitate hover.
- Take each value (curve, duration, scale, spring) from
  [STANDARDS.md](references/review-animations/STANDARDS.md).

The references hold course material. They are not separate workflows.
STANDARDS.md is the one source of values, so the references do not drift.

## Steps

Copy this checklist into the reply and tick it off:

```text
Motion progress:
- [ ] 1 Task type known
- [ ] 2 References read
- [ ] 3 Motion defined (build or change only)
- [ ] 4 Task done
- [ ] 5 Movement verified (build or change only)
```

1. **Name the task type.** Use the first column of the table below.

   Done when the request matches one row.

2. **Read the references for that row.** Read only those files.

   Done when you have read each reference the task needs.

3. **Define the motion.** Do this step only when you build or change
   motion. Write down its purpose, frequency, trigger, states, interruption
   behavior and reduced-motion alternative.

   Done when each of the six items has an answer.

4. **Do the task.**
   - Audit-only request: return the current-state evidence and the proposed
     changes. Change no code.
   - Implementation request or approved findings: make the changes within
     the stated scope.
   - Question (a name, a library, a brief): answer from the reference.

   Done when the output matches the request.

5. **Verify the movement.** Do this step only when motion changed. Inspect
   it with a recording, a trace or a frame capture. Enable the
   reduced-motion preference. Repeat the input fast to test interruption.
   If a check fails, return to step 4.

   Done when each check passes. Keep any before and after evidence the user
   asked for.

A static screenshot cannot verify timing. Only a recording, a trace or
frame captures show movement over time.

## References

| Task | Read |
| --- | --- |
| Build or change motion | [Decisions](references/animate/guide.md), [values](references/review-animations/STANDARDS.md), then the implementation row below |
| CSS implementation | [CSS](references/css-animations/guide.md), [CSS recipes](references/css-animations/RECIPES.md) |
| Motion for React implementation | [Motion for React](references/motion-react/guide.md), [recipes](references/motion-react/RECIPES.md) |
| SVG | [SVG animation](references/animate/svg-animation.md) |
| Reduced motion | [Accessibility](references/animation-accessibility/guide.md), [snippets](references/animation-accessibility/SNIPPETS.md) |
| Jank, or motion that feels off | [Debugging](references/debug-animation/guide.md), [performance](references/animation-performance/guide.md) |
| Gestures or scroll | [Gestures](references/gesture-ui/guide.md), [scroll](references/scroll-animations/guide.md) |
| Review a diff or a few files | [Review](references/review-animations/guide.md), [values](references/review-animations/STANDARDS.md) |
| Audit a whole codebase and write plans | [Audit](references/improve-animations/guide.md), [audit signals](references/improve-animations/AUDIT.md), [plan template](references/improve-animations/PLAN-TEMPLATE.md) |
| Find where motion would help | [Opportunities](references/find-animation-opportunities/guide.md) |
| Choose a library | [Library selection](references/pick-ui-library/guide.md) |
| Name an effect | [Vocabulary](references/animation-vocabulary/guide.md) |
| Define direction before code | [Brief](references/motion-brief/guide.md) |
| Compare prototypes | [Prototype](references/prototype/guide.md), [picker](references/prototype/PICKER.md) |
