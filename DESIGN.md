# Collection surfaces — design scope for PR #10

This document applies only to the new collection and Mass page. Existing approved surfaces retain their design and implementation.

## Product and visual read

A compact space-game directory for English-speaking browser players; use the incumbent dark navy/cyan identity and make selection and actual play the primary tasks. Collection mode: Read/Operate. Mass page: Operate, with controls above the guide. Design variance 2, motion intensity 1, visual density 5; these are descriptive choices, not scores.

References are the incumbent homepage catalog (game card semantics), Spacebar hub (mode selection), and existing game screens (contained play surface). This is an extension of the existing identity, not a new brand or a visual redesign. External showcase-style references are not applicable to this constrained change.

## Implementation system

- Reuse SiteLayout, navigation, existing font loading and lazy route boundaries.
- New CSS is imported only by the new component and scoped to `.community-collection`, `.collection-*` and its descendants. It must not restyle generic document elements or incumbent surfaces.
- Dark navy surfaces, pale body text, white headings and cyan actions match the incumbent palette. No external images, font downloads, animation libraries or decorative stock media are added.
- Centered container: maximum 1100px, 24px horizontal padding. Cards use an auto-fit grid and become a single column on phones; 20px gaps, 24px card padding, 18px radius. These choices apply only to the new directory.
- Native anchors are used for game cards. Native buttons control loading/unloading. Minimum button height: 44px; visible focus outline: 3px white with offset. H1 is unique; headings and numbered instructions retain semantics.
- The player has a clear session-only notice before starting. A sandboxed frame loads only after Play, with no popup, top-navigation or storage permissions. Unload removes the frame and stops its timer. Refresh/re-entry starts over; persistent saves are not promised.
- Motion is limited to existing navigation behavior and immediate game counters. No entrance animation hides content. Critical text and game links are in prerendered HTML; actual gameplay requires JavaScript.
- Credits, license, source revision and adaptation notes are visible. Do not portray the pilot as self-developed, an officially endorsed port, a popularity winner or a game with cloud/offline saves.

Review: desktop and phone screenshots were inspected. At nominal widths 360/390/768/1024/1440 the collection layout was observed and measured without page-level horizontal overflow. Keyboard activation was confirmed with a native Return keypress on the focused in-frame Generate Mass button (visible mass changed from 1 to 2).
