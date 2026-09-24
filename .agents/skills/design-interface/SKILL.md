---
name: design-interface
description: Design a screen or flow with real content, responsive states, visual review, and user approval before feature implementation. Use for new screens, flows, or visual-system changes.
---

# Design an interface

Read the product brief, existing code, and `DESIGN.md` if there is one. Preserve an approved design system for ordinary new screens. For a new product or a full replacement, follow [greenfield.md](references/greenfield.md) and use [choose-a-look.md](references/choose-a-look.md) to make intentional visual choices. The client brief wins over either reference.

1. Identify the user's task, device, important information, and the states that could change the layout. Ask only about material gaps.
2. Study relevant reference patterns when available. Name what each reference contributes; do not copy a whole product identity.
3. For a new visual world, write a distinct direction contract for each option before coding: a product-specific source idea, a layout sketch, 4–6 named colors, type roles, and one recognizable detail. Compare those plans to the brief and reject defaults that could fit any product. Use the installed `frontend-design` skill for this pass when available. Then build locally inspectable mockups with the same realistic content. Show two or three materially different representative screens in the local studio before choosing production tokens or building a component kit. For a settled world, use its existing components and tokens.
4. Include loaded, empty, long-content, loading, save/error, and permission states where they matter. Design the phone layout as its own arrangement. Give keyboard focus a visible treatment.
5. Run the [visual quality gate](references/visual-quality.md). Open and inspect the real mockups at desktop, tablet, and phone widths. Fix hierarchy, clipping, awkward spacing, contrast, inaccessible controls, and repeated template patterns before presenting them. Compare the captures with any references the user supplied for the intended level of craft, while preserving this product's own identity. A passing typecheck does not establish design quality.
6. Let the user choose and refine a named revision. Record its palette, typography, layout, and state decisions. Build production screens only after the user approves that revision. An earlier approval remains valid for small fixes that preserve the design.
7. List the pieces to reuse, the data each screen needs, and any remaining questions for `plan-feature` and `deliver-feature`.

In a greenfield project, use its local studio and saved selection as the choice record. If none exists, use `greenfield-mode` to initialize and populate one. Follow the commands and paths documented by that project; do not assume a framework, stylesheet path, or design-review script exists.
