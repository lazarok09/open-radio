---
name: open-radio-design-system
version: 1.0.0
description: Use when building Open Radio interfaces.
---
# Open Radio design system
- Use a dark broadcast-console base: `#07090f` background, `#111521` panels, `#eff2ff` text, `#8d96ad` muted text, `#ccff00` primary signal, and `#9c6bff` accent.
- Use Radix primitives for dialogs and interactive accessible primitives; use Tabler icons rather than custom SVG icons.
- Use existing `card`, `btn`, `icon`, and `input` tokens before introducing one-off styles.
- Show disabled states and explicit inline/toast errors. Keep visible focus outlines.
- Animate queue order changes with Motion layout animations; do not animate purely decorative static elements.
