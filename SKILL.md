# Design System — Agent Instructions

This skill describes the visual design language for all UI output. Every component, layout, and page should follow the design specs in the module files below. These describe *what the design looks like* — you choose how to implement the styles.

## Style
An immersive, interactive, exhibit-style interface that blends storytelling, animation, and gamified elements to create a playful, experience-driven journey. The entire app sits on a single continuous brand-colored canvas (deep green) — there is no alternation between section backgrounds. Crisp white cards with thick black borders, hard offset block shadows, and oversized condensed display typography (Oswald) punch off that canvas. Buttons are skewed white blocks with hard black shadows that grow on hover, like posters or arcade signs reacting to the player. Decorative geometric blocks in brand-tertiary (cobalt blue) and brand-quaternary (hot pink) layer behind cards to add depth without breaking the brand-color continuity. The result feels less like browsing a website and more like exploring a digital exhibit.


## Before Writing Any Code

1. **Read every module that applies.** For a landing page, read at minimum: `layout.md`, `typography.md`, `colors.md`, `buttons.md`, `cards.md`, `shadows.md`, `radius.md`, `borders.md`. Do NOT write component code until you have loaded all relevant modules.

## Critical Rules

- **Tokens are AGNOSTIC, framework-neutral:** The tokens defined in the `.md` files (like `neutral-primary-soft`, `heading`, `border-default`) are agnostic design system tokens. Map them to whatever styling layer you use — they are NOT literal class names from any specific framework.

- **One immersive canvas.** Every section uses the SAME brand color background. Never alternate section backgrounds with neutrals. The continuous brand-colored canvas is the foundation of the immersive feel.
- **Cards are framed white blocks.** Every card uses brand-secondary (white) background, 4px solid black border, 20px radius, 8px outer padding gap, and a hard offset block shadow. No soft drop shadows, ever.
- **Buttons are skewed posters.** Every primary button is a 20px-radius brand-secondary (white) block with `skewX(-15deg)`, oversized Oswald label, and a hard black offset shadow that grows on hover.
- **Cross-reference modules.** A card containing buttons must satisfy both `cards.md` AND `buttons.md`.
- **Dark mode is automatic.** The CSS custom properties resolve differently in light/dark via `@media (prefers-color-scheme: dark)`. Never manually swap colors.
- **Every interactive element needs hover, focus, and disabled states** — defined in the relevant module. Hover should feel tactile and gamified (shadow grows, optional `-2px, -2px` translate).
- **Use semantic HTML:** proper heading hierarchy (`h1`→`h6`), `<button>` for actions, `<a>` for navigation, ARIA attributes where needed.

## Module Index

### Foundation (read first for any UI work)
- [colors.md](colors.md) — all background, text, and border color tokens
- [typography.md](typography.md) — heading scale, paragraphs, labels, links
- [layout.md](layout.md) — spacing rhythm, containers, animation, visual depth
- [radius.md](radius.md) — border-radius scale
- [shadows.md](shadows.md) — elevation tokens
- [borders.md](borders.md) — border widths and styles

### Components
- [buttons.md](buttons.md) — button variants, sizes, states, skew + hard shadow signature
- [button-group.md](button-group.md) — grouped button structure
- [cards.md](cards.md) — card structure, background, interactivity
- [inputs.md](inputs.md) — form controls, labels, states
- [alerts.md](alerts.md) — alert variants
- [badges.md](badges.md) — badge variants, sizes, dismissible chips
- [lists.md](lists.md) — list components
- [avatars.md](avatars.md) — avatar variants, sizes, indicators
- [icon-shapes.md](icon-shapes.md) — icon containers

### Complex Components
- [accordion.md](accordion.md) — accordion variants
- [dropdown.md](dropdown.md) — dropdown menus
- [modals.md](modals.md) — modal dialogs
- [tabs.md](tabs.md) — tab navigation
- [tables.md](tables.md) — table structure
- [pagination.md](pagination.md) — pagination components
- [sidebars.md](sidebars.md) — sidebar navigation
- [radios-checkboxes-toggle.md](radios-checkboxes-toggle.md) — selection controls
- [tooltips-popovers.md](tooltips-popovers.md) — tooltips and popovers
- [content.md](content.md) — grid system, responsiveness

---

## Source file: `accordion.md`

# Accordion

> Dependencies: `colors.md`, `radius.md`, `borders.md`, `shadows.md`, `typography.md`

## Core Specs

- **Wrapper:** full width, 4px solid black border (border-default color), 20px radius, brand-secondary (white) background, shadow-md hard offset — clips first/last item corners
- **Item separator:** 2px solid black bottom border on every item except last

## Trigger (Button)

- **Layout:** flex, space-between, full width
- **Padding:** 32px horizontal, 24px vertical
- **Font:** Oswald, 20px, bold weight, uppercase
- **Text color:** brand color (deep green) over the white surface
- **Background:** brand-secondary (white)
- **Hover:** brand-quaternary background, black text
- **Focus:** outline none, 4px ring in brand-tertiary color
- **Transition:** colors, 200ms
- **Open state:** brand color background, brand-secondary (white) text

## Panel (Content)

- **Padding:** 32px horizontal, 24px vertical
- **Background:** brand-secondary (white)
- **Top border:** 2px solid black
- **Font:** Oswald, 18px, body color (over a dark background) or brand color (over the white panel) — when panel is white, body copy uses brand color set, 1.5 line-height

## Chevron Icon

- Size: 20x20px
- Color: brand color (matches trigger text)
- Closed: 0deg rotation
- Open: 180deg rotation
- Transition: transform, 200ms

## Variants

### Default (Collapse)
One panel open at a time. Items stacked inside a single shared bordered/rounded wrapper.

### Separated Cards
Each item is independent — has its own 4px solid black border, 20px radius, brand-secondary (white) background, and shadow-md hard offset. 16px bottom margin between items. No shared outer border.

### Always Open
Multiple panels can expand simultaneously. Same styling as Default.

### Flush
No outer border, no shadow. Trigger and panel have transparent backgrounds. Only 2px black bottom border dividers between items. Use inside containers that already provide a white surface.

## States

| State | Trigger appearance |
|---|---|
| Closed | brand color text, brand-secondary (white) background |
| Open | brand-secondary (white) text, brand color background |
| Hover | brand-quaternary background, black text |
| Focus | 4px brand-tertiary ring, no outline |
| Disabled | fg-disabled text, not-allowed cursor, no hover/focus |

---

## Source file: `alerts.md`

# Alerts

> Dependencies: `colors.md`, `radius.md`, `borders.md`, `shadows.md`, `typography.md`

## Core Specs

- **Padding:** 24px
- **Radius:** 20px
- **Border:** 4px solid black
- **Shadow:** shadow-sm (6px 6px 0 #000000) — hard offset block
- **Heading:** Oswald, 20px, bold weight, uppercase
- **Body:** 16px, normal weight, 1.5 line-height

## Variants

### Brand
- **Background:** brand-secondary (white)
- **Border:** 4px solid black
- **Text:** brand color (heading + body)

### Success
- **Background:** success-soft
- **Border:** 4px solid black
- **Text:** fg-success-strong

### Danger
- **Background:** danger-soft
- **Border:** 4px solid black
- **Text:** fg-danger-strong

### Warning
- **Background:** warning-soft
- **Border:** 4px solid black
- **Text:** fg-warning

---

## Source file: `avatars.md`

# Avatars

> Dependencies: `colors.md`, `radius.md`, `borders.md`

## Core Specs

- **Circular shape:** fully rounded (9999px)
- **Rounded square shape:** 20px radius
- **Default size:** 48x48px
- **Image fit:** cover
- **Border:** 4px solid black on every avatar (matches the system silhouette)

## Sizes

| Size | Dimensions | Radius |
|---|---|---|
| Extra Small | 24x24px | 8px |
| Small | 32x32px | 8px |
| Base | 40x40px | 20px |
| Large | 48x48px | 20px |
| XL | 64x64px | 20px |
| 2XL | 80x80px | 20px |

## Bordered Avatar

- 4px solid black border, fully rounded (or 20px for square avatars)
- Optional: shadow-xs (4px 4px 0 #000000) hard offset to lift the avatar off the canvas

## Stacked Avatars

- Displayed in a row (flex)
- Each avatar: 48x48px, fully rounded, 4px solid black border
- Overlap: -16px negative margin on all except first

### Stacked Counter
- Same size as avatars (48x48px), fully rounded, 4px solid black border
- Background: brand color, text: brand-secondary (white), 14px Oswald font, bold weight, uppercase
- Same overlap margin as other avatars

## Avatar with Text

- Flex row, 16px gap between avatar and text
- Avatar: 48x48px, fully rounded, 4px solid black border, cover fit
- Name: heading color, Oswald, bold weight, uppercase
- Subtitle: 14px, body color

---

## Source file: `badges.md`

# Badges

> Dependencies: `colors.md`, `radius.md`, `borders.md`, `typography.md`

## Core Specs

- **Border:** 4px solid black
- **Default radius:** 20px
- **Pill radius:** 9999px
- **Font:** Oswald, bold weight, uppercase
- **Optional shadow:** shadow-2xs (2px 2px 0 #000000) for badges that need to pop off a card surface

## Sizes

| Size | Font size | Horizontal padding | Vertical padding |
|---|---|---|---|
| Default (small) | 14px | 12px | 4px |
| Large | 16px | 16px | 6px |

## Variants

### Brand
- **Background:** brand color (deep green)
- **Border:** 4px solid black
- **Text:** brand-secondary (white)

### Alternative (Neutral Soft)
- **Background:** brand-secondary (white)
- **Border:** 4px solid black
- **Text:** brand color

### Gray (Neutral Medium)
- **Background:** brand-quaternary (hot pink)
- **Border:** 4px solid black
- **Text:** black

### Danger
- **Background:** danger
- **Border:** 4px solid black
- **Text:** brand-secondary (white)

### Success
- **Background:** success
- **Border:** 4px solid black
- **Text:** brand-secondary (white)

### Warning
- **Background:** warning
- **Border:** 4px solid black
- **Text:** black

### Dark
- **Background:** black
- **Border:** 4px solid black
- **Text:** brand-secondary (white)

### Tertiary (Accent)
- **Background:** brand-tertiary (#0023D1)
- **Border:** 4px solid black
- **Text:** brand-secondary (white)

## Pill Badges

Use 9999px radius instead of 20px on any variant.

## Badges with Icons

- Icon size (default): 14x14px
- Icon size (large): 16x16px
- Icon spacing: 8px margin next to label

## Icon-only Badge

Square shape — equalize dimensions to 32x32px, no horizontal text padding, 20px radius, 4px solid black border.

## Dismissible Badges

Badge content + a close button. Close button hover backgrounds per variant:

| Variant | Close button hover background |
|---|---|
| Brand | brand-strong |
| Alternative | brand-quaternary |
| Gray | brand-tertiary |
| Danger | danger-strong |
| Success | success-strong |
| Warning | warning-strong |
| Tertiary | brand-quaternary |

## Dot / Notification Badge

- Positioned absolutely: -6px top, -6px right
- Size: 16x16px, fully rounded
- 2px solid black border
- Background: brand-quaternary (hot pink) for visibility against the brand-color canvas

---

## Source file: `borders.md`

# Borders

## Width Scale

| Context | Width |
|---|---|
| Default (inputs, buttons, cards, surfaces) | 4px |
| Emphasis / focus | 4px (color shift instead of width shift) |
| Fine internal dividers | 2px |

## Rules

- Use solid black borders by default — heavy, posterlike, never soft
- Borders are a primary visual element, not an afterthought; they define the silhouette of every surface
- Cards over the brand-colored canvas MUST have a 4px solid black border
- Dashed borders only for special cases like file dropzones
- Components in the same family must use matching border widths
- Never mix 4px and 2px borders within a single component
- Focus states change border COLOR (e.g., to brand-tertiary) rather than width

## Usage

| Context | Width |
|---|---|
| Inputs / selects / textareas | 4px default; 4px brand-tertiary on focus or 4px danger border on error |
| Buttons | No border — silhouette comes from the hard offset shadow |
| Cards / containers / surfaces | 4px solid black, no exceptions |
| Internal dividers within a card | 2px solid black |

---

## Source file: `button-group.md`

# Button Groups

> Dependencies: `buttons.md`, `colors.md`, `radius.md`, `shadows.md`, `borders.md`

## Core Specs

- **Wrapper:** inline-flex, 20px radius, 4px solid black border around the entire group, shadow-md (8px 8px 0 #000000) hard offset
- **Wrapper transform:** `skewX(-15deg)` on the wrapper so the entire group reads as one slanted poster — counter-skew the inner button labels and icons
- **Children overlap:** each child shares a 4px solid black divider on its trailing edge (no double borders)
- **Buttons inside the group must NOT have individual shadows or individual skews.** Only the wrapper has the shadow and the skew.

## Anatomy

### Wrapper
- Display: inline-flex
- Radius: 20px
- Border: 4px solid black
- Shadow: shadow-md (8px 8px 0 #000000)
- Transform: `skewX(-15deg)`

### First Button
- 20px radius on inline-start side only, 0 on inline-end
- No left divider

### Middle Button(s)
- No radius (0 on all corners)
- 4px solid black left divider

### Last Button
- 20px radius on inline-end side only, 0 on inline-start
- 4px solid black left divider

## Hover

- The wrapper shadow grows to shadow-lg (10px 10px 0 #000000) on hover
- Individual buttons inside may change background color on hover, but never grow their own shadow

## Rules

- Buttons inside groups follow all color/text styles from `buttons.md` (background, text color) except they do NOT have individual shadows or individual skews — those belong to the wrapper
- Counter-skew labels and icons `skewX(15deg)` so content reads upright
- Icon-only buttons: 20x20px icon, match height of text buttons

---

## Source file: `buttons.md`

# Buttons

> Dependencies: `colors.md`, `radius.md`, `shadows.md`, `typography.md`

## Signature Style (applies to every variant except ghost and disabled)

Every button is a posterlike, skewed block with a hard black offset shadow. This is the most recognizable element of the system and must remain consistent across the entire app.

- **Cursor:** pointer
- **Display:** inline-flex
- **Padding:** 11px 33px
- **Text decoration:** none
- **Font:** Oswald, 25px, bold (700), uppercase
- **Color:** white text on top of the brand-secondary surface (overridden per variant)
- **Background:** brand-secondary (white) — buttons sit on top of the brand-colored canvas, so the white block is what gives them visual punch
- **Border:** none (silhouette is created by the offset shadow + skew, not a border)
- **Radius:** 20px (from `radius.md`)
- **Box shadow:** `6px 6px 0 0 #000000` (hard offset block — equivalent to shadow-sm in `shadows.md`)
- **Transform:** `skewX(-15deg)` on the button itself; the inner label content should be counter-skewed `skewX(15deg)` so the text reads upright while the silhouette stays slanted
- **Transition:** 1s on default rest state, 0.5s when entering hover/active

## Hover & Active

- **Box shadow:** `10px 10px 0 0 #000000` (the offset visibly grows — equivalent to shadow-lg)
- **Transition:** 0.5s
- **Optional translate:** the button may shift `-2px, -2px` to amplify the press-out feel as the shadow grows
- The skew and radius do not change on hover

## Focus

- 4px outline in brand-tertiary color, offset by 4px from the silhouette
- The hard shadow remains; the focus ring layers on top

## Sizes

All sizes preserve the 25px label / 11px 33px proportions for the default. Smaller and larger sizes scale proportionally while keeping the skew, radius, and hard shadow.

| Size | Font size | Horizontal padding | Vertical padding | Shadow |
|---|---|---|---|---|
| Extra small | 16px | 18px | 6px | shadow-2xs (2px 2px 0 #000) |
| Small | 18px | 22px | 8px | shadow-xs (4px 4px 0 #000) |
| Base (default) | 25px | 33px | 11px | shadow-sm (6px 6px 0 #000) |
| Large | 28px | 40px | 14px | shadow-md (8px 8px 0 #000) |
| Extra large | 32px | 48px | 18px | shadow-lg (10px 10px 0 #000) |

## Variants

### Brand (Primary CTA)
- **Background:** brand-secondary (white)
- **Text:** brand color (deep green)
- **Hover:** background stays brand-secondary; shadow grows to shadow-lg
- **Focus ring:** 4px, brand-tertiary color
- The primary CTA across the entire app uses this variant — every button is the brand-secondary (white) block sitting on the brand-colored canvas

### Secondary
- **Background:** brand-tertiary (#0023D1)
- **Text:** brand-secondary (white)
- **Hover:** background stays brand-tertiary; shadow grows to shadow-lg
- **Focus ring:** 4px, brand-quaternary color

### Tertiary
- **Background:** transparent over brand-secondary surfaces, or brand-secondary over brand surfaces
- **Text:** brand color
- **Border:** 4px solid black (this is the only variant where a border is used instead of a shadow-only silhouette)
- **Hover:** background fills with brand-quaternary, text becomes black; shadow grows to shadow-lg
- **Focus ring:** 4px, brand-tertiary color

### Success
- **Background:** success token
- **Text:** white
- **Hover:** shadow grows to shadow-lg
- **Focus ring:** 4px, success-medium color

### Danger
- **Background:** danger token
- **Text:** white
- **Hover:** shadow grows to shadow-lg
- **Focus ring:** 4px, danger-medium color

### Warning
- **Background:** warning token
- **Text:** black
- **Hover:** shadow grows to shadow-lg
- **Focus ring:** 4px, warning-medium color

### Dark
- **Background:** black
- **Text:** brand-secondary (white)
- **Hover:** shadow grows to shadow-lg (note: shadow stays black — the silhouette merges with the shadow on hover for a stamped effect)
- **Focus ring:** 4px, brand-quaternary color

### Ghost (NO shadow, NO skew)
- **Background:** transparent
- **Text:** brand-secondary (over brand surfaces) or brand color (over white surfaces)
- **Border:** none
- **Transform:** none — the ghost variant is the only one that opts out of the skew
- **Radius:** 20px
- **Hover:** underline appears under the label, no background change
- **Focus ring:** 4px, brand-tertiary color
- **No shadow, no skew, no fill**

### Disabled (NO shadow, NO interactive states)
- **Background:** disabled token
- **Text:** fg-disabled color
- **Transform:** still skewed for visual consistency, but no hover or shadow changes
- **Cursor:** not-allowed
- **Box shadow:** none
- **No hover, no focus, no shadow growth**

## Icons in Buttons

- Icon size: 20x20px (24x24px on large/xl sizes)
- Spacing: 12px gap between icon and label
- Icons should also be counter-skewed `skewX(15deg)` so they appear upright inside the slanted button silhouette

## Rules

- The skew + hard offset shadow combination is non-negotiable — it is the signature gesture of the system
- Always counter-skew the label content so text reads upright
- Never replace the hard offset shadow with a soft drop shadow
- Buttons sit ON TOP of the brand-colored canvas — they do not need a background "section" of their own
- Maintain a minimum 16px clearance around any button so the offset shadow is never clipped

---

## Source file: `cards.md`

# Cards

> Dependencies: `colors.md`, `radius.md`, `shadows.md`, `typography.md`, `borders.md`

## Core Specs

Cards are the primary surface that lifts content off the brand-colored canvas. They are bold white blocks with thick black borders and hard offset shadows — the same posterlike language used by every other component.

- **Background:** brand-secondary (white)
- **Border:** 4px solid black
- **Radius:** 20px
- **Outer padding (gap from card edge to inner content wrapper):** 8px — this 8px buffer between the 4px border and the inner content gives the card a "framed" feel
- **Inner content padding:** 24px (on top of the 8px buffer for total 32px from border edge to text)
- **Shadow:** shadow-md (8px 8px 0 #000000) — solid hard offset, no blur
- **Box sizing:** border-box

## Card Heading

- Desktop: 24px, bold weight, uppercase, brand color (deep green) — heading sits on the white card surface
- Mobile: 20px, bold weight, uppercase, brand color
- Never skip heading levels — the page hierarchy must logically arrive at the card heading level

## States

### Static Card (no interactivity)
- Background: brand-secondary (white)
- Border: 4px solid black
- Radius: 20px
- Padding: 8px outer + 24px inner
- Shadow: shadow-md (8px 8px 0 #000000)
- No hover styles. Non-interactive cards must NOT have hover background changes.

### Interactive Card (clickable)
- Same base styles as static card
- Hover: shadow grows to shadow-lg (10px 10px 0 #000000); card may translate `-2px, -2px` to amplify the lift
- Optional hover accent: top-left corner of the card flashes a 8px brand-quaternary tab/ribbon
- Transition: transform and box-shadow, 0.5s
- Cursor: pointer

### Featured / Hero Card
- Same base styles
- Shadow: shadow-lg or shadow-xl depending on prominence
- May overlap a decorative brand-quaternary or brand-tertiary block sitting behind the card to add visual depth (must follow `layout.md` decoration rules)

## Rules

- Background: brand-secondary (white) — always, no other card surface color
- Border: 4px solid black — always, no soft borders
- Radius: 20px — always
- Outer padding: 8px between the 4px border and the inner content wrapper
- Shadow: hard offset only (shadow-md baseline, shadow-lg on hover for interactive cards)
- Interactive hover: shadow grows by one level + optional translate
- Non-interactive: no hover styles
- Cards must always sit on top of the brand-colored canvas — never on a white-on-white surface

---

## Source file: `colors.md`

# Color Tokens

## Background Tokens

### Neutral
| Token | Light | Dark |
|---|---|---|
| neutral-primary-soft | #00592B | #00401F |
| neutral-primary | #00592B | #002E16 |
| neutral-primary-medium | #00592B | #00401F |
| neutral-primary-strong | #00592B | #00592B |
| neutral-secondary-soft | #00592B | #00401F |
| neutral-secondary | #00592B | #002E16 |
| neutral-secondary-medium | #FFFFFF | #00401F |
| neutral-secondary-strong | #F2EDE2 | #00592B |
| neutral-tertiary-soft | #FFFFFF | #00401F |
| neutral-tertiary | #F2EDE2 | #00592B |
| neutral-tertiary-medium | #E8E0CC | #007038 |
| neutral-quaternary | #D6CCB0 | #007038 |
| quaternary-medium | #D6CCB0 | #2A8859 |
| gray | #B8AC8A | #2A8859 |

### Brand
| Token | Light | Dark |
|---|---|---|
| brand-softer | #E5F1EA | #002E16 |
| brand-soft | #B3D6BF | #00401F |
| brand | #00592B | #00592B |
| brand-medium | #4D8A6B | #00401F |
| brand-strong | #003F1E | #00592B |

### Brand Secondary / Tertiary / Quaternary
| Token | Light | Dark |
|---|---|---|
| brand-secondary | #FFFFFF | #FFFFFF |
| brand-tertiary | #0023D1 | #0023D1 |
| brand-quaternary | #E374C7 | #E374C7 |

### Status
| Token | Light | Dark |
|---|---|---|
| success-soft | #E5F1EA | #002E16 |
| success | #00592B | #007038 |
| success-medium | #B3D6BF | #00401F |
| success-strong | #003F1E | #00592B |
| danger-soft | #FDECEC | #4D0218 |
| danger | #C42424 | #C42424 |
| danger-medium | #FAD2D2 | #8B0836 |
| danger-strong | #8E1717 | #8E1717 |
| warning-soft | #FFF4D6 | #6E4A00 |
| warning | #E0A100 | #E0A100 |
| warning-medium | #FFE7A0 | #6E4A00 |
| warning-strong | #8A6300 | #8A6300 |

### Button Glint (CSS custom properties, used for the glint box-shadow effect)
| Variable | Light | Dark |
|---|---|---|
| `--color-1-400` | rgba(255,255,255,0.18) | rgba(255,255,255,0.10) |
| `--color-1-700` | rgba(0,0,0,0.35) | rgba(0,0,0,0.55) |

### Utility
| Token | Light | Dark |
|---|---|---|
| dark | #000000 | #000000 |
| dark-strong | #000000 | #000000 |
| disabled | #E8E0CC | #00401F |

### Accent
| Token | Value (same both modes) |
|---|---|
| purple | #E374C7 |
| sky | #0023D1 |
| teal | #00592B |
| pink | #E374C7 |
| cyan | #0023D1 |
| fuchsia | #E374C7 |
| indigo | #0023D1 |
| orange | #E0A100 |

## Text Color Tokens

### Base
| Token | Light | Dark |
|---|---|---|
| white | #FFFFFF | #FFFFFF |
| black | #000000 | #000000 |
| heading | #FFFFFF | #FFFFFF |
| body | #F2EDE2 | #F2EDE2 |
| body-subtle | #D6CCB0 | #D6CCB0 |

### Brand
| Token | Light | Dark |
|---|---|---|
| fg-brand-subtle | #B3D6BF | #4D8A6B |
| fg-brand | #00592B | #B3D6BF |
| fg-brand-strong | #003F1E | #FFFFFF |

### Status
| Token | Light | Dark |
|---|---|---|
| fg-success | #003F1E | #B3D6BF |
| fg-success-strong | #002E16 | #E5F1EA |
| fg-danger | #8E1717 | #F8B5B5 |
| fg-danger-strong | #5C0808 | #FAD2D2 |
| fg-warning-subtle | #E0A100 | #FFCB47 |
| fg-warning | #8A6300 | #FFE7A0 |
| fg-disabled | #B8AC8A | #4D8A6B |

### Informational / Accent
| Token | Light | Dark |
|---|---|---|
| fg-yellow | #E0A100 | #FFCB47 |
| fg-info | #0023D1 | #6F90FF |
| fg-purple | #E374C7 | #E374C7 |
| fg-purple-strong | #B83BA0 | #F2A8E0 |
| fg-cyan | #0023D1 | #6F90FF |
| fg-indigo | #0023D1 | #6F90FF |
| fg-pink | #E374C7 | #E374C7 |
| fg-lime | #00592B | #4D8A6B |

## Border Color Tokens

| Token | Light | Dark |
|---|---|---|
| border-dark | #000000 | #000000 |
| border-buffer | #FFFFFF | #00592B |
| border-buffer-medium | #FFFFFF | #00401F |
| border-buffer-strong | #000000 | #000000 |
| border-muted | #00401F | #002E16 |
| border-light-subtle | #00592B | #002E16 |
| border-light | #00592B | #00401F |
| border-light-medium | #003F1E | #00592B |
| border-default-subtle | #000000 | #000000 |
| border-default | #000000 | #000000 |
| border-default-medium | #000000 | #000000 |
| border-default-strong | #000000 | #000000 |
| border-success-subtle | #B3D6BF | #003F1E |
| border-success | #003F1E | #B3D6BF |
| border-danger-subtle | #FAD2D2 | #8E1717 |
| border-danger | #8E1717 | #C42424 |
| border-warning-subtle | #FFE7A0 | #6E4A00 |
| border-warning | #8A6300 | #E0A100 |
| border-brand-subtle | #B3D6BF | #00401F |
| border-brand-light | #4D8A6B | #4D8A6B |
| border-brand | #00592B | #B3D6BF |
| border-dark-subtle | #000000 | #000000 |
| border-purple | #E374C7 | #E374C7 |
| border-orange | #0023D1 | #0023D1 |

## Semantic Usage Rules

- Page/section backgrounds: brand color (deep green) for ALL sections — the entire app uses a single immersive brand-colored canvas, not alternating neutrals
- Surface cards over sections: brand-secondary (white) background, with heavy black border and 8px outer padding gap
- Primary buttons: brand-secondary (white) background with brand-color text, hard offset shadow, skewed silhouette
- Headings: heading text color (white over the brand surface)
- Body text: body text color (warm cream over the brand surface)
- CTA links: brand-secondary text color with underline
- Default borders: heavy black borders for surfaces and components
- Status borders match intent: success → border-success, danger → border-danger, warning → border-warning
- Disabled: disabled background + fg-disabled text
- Use brand-tertiary (#0023D1) for secondary accents, links inside white surfaces, and informational highlights
- Use brand-quaternary (#E374C7) for playful highlights, decorative shapes, badges, and gamified callouts

## Prohibited

- No raw hex/rgb values in component code — always use design tokens
- No alternating section backgrounds — every section uses the same brand color so the page reads as a single continuous immersive canvas
- No soft drop shadows on surfaces — use hard offset block shadows only
- No accent text tokens (fg-purple, etc.) for body copy or navigation
- No manual light/dark value swapping — let the CSS custom properties handle it

---

## Source file: `content.md`

# Content & Grid System

> Dependencies: `layout.md`, `typography.md`

## Containers

| Type | Max width | Horizontal padding |
|---|---|---|
| Standard | 1280px | 32px |
| Internal (reading) | 720px | — (45–75 char line length) |

## Vertical Padding

| Breakpoint | Vertical padding |
|---|---|
| Mobile | 64px |
| Tablet (≥768px) | 96px |
| Desktop (≥1024px) | 128px (160px for hero/feature sections) |

## Grid System

Mobile-first with flexible desktop configurations. Card grids should give each white card enough room for the 8px outer padding, 4px black border, and the hard offset shadow without clipping.

| Context | Gap |
|---|---|
| Standard content/cards | 32px |
| Compact widgets/metadata | 16px |
| Wide feature grids | 48px |

### Responsive Columns

| Breakpoint | Columns |
|---|---|
| Mobile (default) | 1 |
| Small/Tablet (≥640px) | 2 |
| Desktop (≥1024px) | 2–4 |

Favour fewer, larger cards over dense grids — the immersive exhibit feel relies on scale and breathing room.

## Breakpoints

| Name | Width |
|---|---|
| Small | 640px |
| Medium | 768px |
| Large | 1024px |
| Extra large | 1280px |
| 2x Extra large | 1536px |

## Rules

- Always design mobile-first
- Use layout shifts (column → row) to accommodate horizontal space
- Lists: 32px indentation, 12px vertical gap between items
- Body copy: 18px, 1.5 line-height
- All interactive links follow brand underline/hover protocol
- Always leave at least 16px of clearance on the bottom-right of any card or button so its hard offset shadow is never clipped

---

## Source file: `dropdown.md`

# Dropdown

> Dependencies: `colors.md`, `radius.md`, `shadows.md`, `borders.md`, `inputs.md`, `typography.md`

## Core Specs

### Chevron Icon
- Size: 20x20px
- Spacing: 8px left margin, -2px right margin
- Color: inherits from trigger button

### Menu Container
- Background: brand-secondary (white)
- Border: 4px solid black
- Radius: 20px
- Shadow: shadow-md (8px 8px 0 #000000) — hard offset
- Z-index: elevated above content

### Menu List
- Padding: 12px
- Font: Oswald, 16px, brand color (deep green), bold weight, uppercase

### Menu Item
- Layout: inline-flex, vertically centered, full width
- Padding: 12px horizontal, 12px vertical
- Radius: 12px (default)
- Hover: brand-quaternary background, black text
- Transition: colors, 200ms

## Trigger Sizes

| Size | Font size | Horizontal padding | Vertical padding |
|---|---|---|---|
| Small | 16px | 18px | 8px |
| Base | 20px | 24px | 10px |
| Large | 25px | 33px | 11px |

Triggers follow the signature button silhouette from `buttons.md` (skewed, hard offset shadow) unless used inside a card body where a flatter, bordered trigger may be appropriate.

## Icon-only Trigger

- Padding: 12px
- Min size: 48x48px
- Icon: 24x24px

## Variants

### Default
- Menu width: 224px, items have 12px radius

### With Divider
- 2px solid black top border between child groups, skip first group

### With Header
- Header padding: 20px horizontal, 16px vertical
- Bottom border: 2px solid black
- Name: brand color, Oswald, 16px, bold weight, uppercase
- Email: body-subtle color, 14px, truncated

### With Icons
- Icon before label: 20x20px, 12px right margin, brand color
- On hover, icon color changes to black

### With Checkbox / Radio
- Inputs: 20x20px, 4px solid black border, focus ring in brand-tertiary
- Helper text: 12px, body-subtle color, 4px top margin

### With Search
- Search input at top of menu following `inputs.md` specs
- Left icon: 16px left padding, input 44px left padding

### Scrollable
- Max height: 240px, vertical scroll overflow

## States

| State | Appearance |
|---|---|
| Focused trigger | no outline, 4px brand-tertiary ring |
| Hover item | brand-quaternary background, black text |
| Active/open item | brand color background, brand-secondary (white) text |
| Disabled item | fg-disabled text, not-allowed cursor, no pointer events |

---

## Source file: `icon-shapes.md`

# Icon Shapes

> Dependencies: `colors.md`, `radius.md`, `borders.md`, `shadows.md`

## Core Specs

- Box sizing: border-box
- Icon must be perfectly centered (inline-flex, centered both axes)
- Circle: fully rounded (9999px)
- Rounded square: 20px radius (MD/LG/XL), 8px radius (XS/SM)
- Border: 4px solid black on every shape — matches the system silhouette
- Optional shadow: shadow-xs (4px 4px 0 #000000) for icon shapes that need to lift off a card surface

## Sizes

| Size | Container | Icon |
|---|---|---|
| XS | 32x32px | 16x16px |
| SM | 40x40px | 20x20px |
| MD | 48x48px | 24x24px |
| LG | 56x56px | 28x28px |
| XL | 64x64px | 32x32px |

## Color Variants

### Brand
- Shape: circle
- Background: brand color (deep green)
- Icon color: brand-secondary (white)

### Gray (Neutral)
- Shape: circle
- Background: brand-secondary (white)
- Icon color: brand color

### Tertiary (Accent)
- Shape: rounded square (20px)
- Background: brand-tertiary (#0023D1)
- Icon color: brand-secondary (white)

### Quaternary (Playful)
- Shape: rounded square (20px)
- Background: brand-quaternary (#E374C7)
- Icon color: black

### Danger
- Shape: circle
- Background: danger
- Icon color: brand-secondary (white)

### Success
- Shape: circle
- Background: success
- Icon color: brand-secondary (white)

### Warning
- Shape: circle
- Background: warning
- Icon color: black

---

## Source file: `inputs.md`

# Inputs

> Dependencies: `colors.md`, `radius.md`, `borders.md`, `shadows.md`, `typography.md`

## Core Specs

- **Display:** block, full width
- **Radius:** 20px
- **Border:** 4px solid black
- **Background:** brand-secondary (white)
- **Shadow:** shadow-xs (4px 4px 0 #000000) — hard offset
- **Font:** Oswald, 18px, brand color (deep green)
- **Padding:** 20px horizontal, 16px vertical
- **Placeholder:** body-subtle color, uppercase, Oswald
- **Transition:** all properties, 200ms

## Label

- Display: block
- Font: Oswald, 16px, bold weight, uppercase, heading color
- Margin bottom: 12px
- Label `htmlFor` must match the input `id`

## States

### Default
- Border: 4px solid black
- Background: brand-secondary (white)
- Shadow: shadow-xs (4px 4px 0 #000000)

### Hover
- Shadow grows to shadow-sm (6px 6px 0 #000000)
- Border stays 4px solid black

### Focus
- No outline
- Border: 4px solid brand-tertiary (#0023D1)
- Shadow: shadow-sm (6px 6px 0 #000000)

### Success
- Border: 4px solid border-success
- Shadow: shadow-xs (4px 4px 0 #000000)

### Error / Danger
- Border: 4px solid border-danger
- Shadow: shadow-xs (4px 4px 0 #000000)

### Disabled
- Background: disabled
- Text: fg-disabled
- No shadow
- Cursor: not-allowed

## Input with Icons

- Icon size: 20x20px
- Icon color: brand color
- Container: relative positioned wrapper
- Start icon: absolutely positioned left, 16px left padding — input gets 48px left padding
- End icon: absolutely positioned right, 16px right padding — input gets 48px right padding
- Icons vertically centered within the wrapper

## Rules

- Every input must have a unique `id`
- Every label must have a matching `htmlFor`
- Padding: 20px horizontal, 16px vertical unless overridden for icon variants
- No arbitrary hex or hardcoded colors — always use design tokens
- Inputs always sit on the brand-color canvas with their white surface and hard offset shadow, matching the cards/buttons silhouette

---

## Source file: `layout.md`

# Layout & Spacing

## Spacing Rhythm

Base unit: **8px**. All spacing values should be multiples of 8px.

| Context | Value |
|---|---|
| Section vertical padding | 128px |
| Section header → content | 64px or 80px |
| Heading → paragraph | 24px |
| Container horizontal padding | 32px |
| Flex/grid row gap | 24px |
| Card grid gap | 32px |
| Wide component grid gap | 48px |
| Column layout gap | 64px |

The whole experience favours generous, posterlike breathing room. Headings are oversized, white cards punch out of the brand-colored canvas with thick borders and hard shadows, so the layout itself must give them room to land.

## Container

Standard section container: max-width 1280px, centered, 32px horizontal padding.

Every major section wraps content in this container.

## Content Composition Order

Inside each section, follow this order:
1. Heading (`h1`–`h3`) — oversized, uppercase, bold
2. Leading paragraph — large supporting line of copy
3. Normal paragraph(s)
4. Lists, CTA buttons, or component grids of white cards

## Section Pattern

Every section in the entire app shares the SAME background — the brand color (deep green). There is no alternation between neutral backgrounds; the entire page reads as one continuous immersive canvas. Sections are differentiated by content, oversized typography, decorative shapes, and the layered white cards that punch off the canvas.

Each section has:
- 128px vertical padding
- Brand-color background (always the same — never alternate)
- A centered container (max-width 1280px, 32px horizontal padding)
- A section header area with 64px bottom margin
- Section content below
- Optional decorative blocks (brand-tertiary, brand-quaternary, or solid black silhouettes) sitting behind cards to add depth

## Motion & Animation

- Prefer CSS-native: `transition`, `animation`, `@keyframes`. Use a motion library only when CSS cannot achieve the behavior.
- The site is designed to feel like a guided digital exhibit, not a static page — lean into scroll-triggered reveals, parallax depth on decorative blocks, staggered card entrances, and oversized heading animations
- Cards and buttons should react to hover with a press-out gesture (translate `-2px, -2px` while the hard offset shadow grows) — this is the signature interaction
- Reserve scroll-triggered and hover transitions for moments that reinforce hierarchy or reward attention; every interaction should feel gamified and tactile
- Mix bold typographic moments (oversized rotating words, marquee strips, animated numerals) with playful illustrated or geometric accents

## Backgrounds & Visual Depth

- The base canvas is a single, immersive brand-color fill across the entire app — every section, header, and footer
- Layer decorative geometric blocks (solid brand-tertiary or brand-quaternary rectangles, circles, or skewed shapes) behind cards and headings to create depth without breaking the brand-color continuity
- White cards and buttons act as the primary "lifted" elements; the contrast of crisp white over brand-green is what creates the depth
- Decorative shapes may use hard black borders and offset shadows to match the system language
- Optional grain or noise overlays at very low opacity are allowed for texture, but never compete with the white cards
- Every decorative element must serve a compositional purpose (depth, separation, or emphasis). No purely ornamental effects competing with content.

## Must

- All sections: consistent 128px vertical padding
- All sections: SAME brand-color background — never alternate or break the continuous canvas
- All containers: max-width 1280px, centered, 32px horizontal padding
- Section headers: 64px or 80px bottom margin
- White cards always have 8px outer padding gap, 4px black border, 20px radius, and a hard offset shadow
- Consistent vertical rhythm, generous breathing room, no crowded sections
- Layouts readable and properly spaced on both desktop and mobile

---

## Source file: `lists.md`

# Lists

> Dependencies: `colors.md`, `typography.md`

## Core Specs

- Item spacing: 16px vertical gap between list items
- Text: body color (over the brand canvas) or brand color (over white card surfaces)
- Font: Oswald, 18px, normal weight

## List Icons

- Size: 24x24px
- Prevent squishing: no shrink
- Spacing: 12px right margin between icon and text
- Active/featured icon: brand-quaternary (hot pink) for playful punch, or brand-tertiary (#0023D1) for informational lists
- Neutral icon: brand color (over white surfaces) or brand-secondary white (over brand canvas)

## Inactive / Disabled Items

Strikethrough text with body-subtle color decoration on the list item.

## Pattern

Vertical flex list with 16px gap. Each item is a flex row with centered alignment — icon (24x24, no-shrink, 12px right margin) followed by a span of body-colored text in Oswald.

When the list is rendered inside a white card surface, prefer brand color text and brand-quaternary or brand-tertiary icons. When rendered directly on the brand-color canvas, use brand-secondary (white) text and brand-quaternary icons.

---

## Source file: `modals.md`

# Modals

> Dependencies: `colors.md`, `radius.md`, `shadows.md`, `borders.md`, `buttons.md`, `inputs.md`, `typography.md`

## Core Specs

### Overlay (Backdrop)
- Fixed, covers full screen
- Z-index: 40
- Background: brand color (deep green) at 75% opacity — the modal "drops" the player back into the immersive canvas
- Optional grain or noise overlay for texture, very low opacity

### Content Container
- Background: brand-secondary (white)
- Border: 4px solid black
- Radius: 20px
- Shadow: shadow-xl (14px 14px 0 #000000) — hard offset block
- Outer padding gap: 8px between the 4px border and the inner content wrapper
- Inner padding: 32px

## Anatomy

### Header
- Bottom border: 4px solid black (or 2px if used inside a tighter modal)
- Top corners rounded (20px)
- Title: Oswald, 32px, bold weight, uppercase, brand color
- Close button: Ghost variant from `buttons.md`, 12px padding

### Body
- Vertical padding: 32px
- Vertical spacing between elements: 24px
- Text: 18px, 1.5 line-height, brand color (modal body sits on white)

### Footer
- Top border: 4px solid black
- Bottom corners rounded (20px)
- Padding: 24px
- Buttons follow `buttons.md` (skewed, hard offset shadow)

## Variants

### Default (Information)
Standard header + body + footer with primary/secondary action buttons.

### Pop-up (Confirmation)
Centered text, prominent icon, reduced padding:
- Body: 32px padding, text centered
- Icon: centered, 24px bottom margin, 64x64px, brand-quaternary background, 4px solid black border, 20px radius — matches `icon-shapes.md` Quaternary variant

### Form Modal
Body contains inputs following `inputs.md`. Vertical spacing between form elements: 24px.

## Rules

- Backdrop covers full screen with fixed positioning, brand-color tint at 75% opacity
- Content: brand-secondary (white) background, 20px radius, 4px solid black border, shadow-xl hard offset
- Header/Footer separated by 4px solid black borders
- Close button must be present and functional
- Accessibility: `role="dialog"`, implement focus trap in code
- Dark mode automatic via token system

---

## Source file: `pagination.md`

# Pagination

> Dependencies: `colors.md`, `radius.md`, `borders.md`, `shadows.md`, `typography.md`

## Container

Font: Oswald, 16px, bold weight, uppercase. Items displayed as flex with -4px overlap so the heavy black borders align rather than double.

## Pagination Item

- Layout: flex, centered both axes
- Size: 48x48px
- Text: brand color (over white surfaces) or brand-secondary white (over brand canvas), bold weight, uppercase
- Background: brand-secondary (white)
- Border: 4px solid black
- Hover: brand-quaternary background, black text
- Focus: no outline, 4px brand-tertiary ring offset 4px
- Overlap: -4px left margin so adjacent borders align

## Previous / Next Buttons

- Horizontal padding: 20px, height: 48px
- First item: 20px radius on inline-start side
- Last item: 20px radius on inline-end side

## Active Page Item

- Text: brand-secondary (white)
- Background: brand color (deep green)
- Hover text: brand-secondary (stays same)
- Optional shadow-2xs (2px 2px 0 #000000) hard offset to lift the active page

## Rules

- Display as flex with -4px child overlap so borders align cleanly
- Items: brand-secondary (white) background, 4px solid black border, brand color text
- Active: brand color background, brand-secondary (white) text
- First item: rounded start (20px), Last item: rounded end (20px)
- All items need hover and focus states

---

## Source file: `radios-checkboxes-toggle.md`

# Radios, Checkboxes & Toggles

> Dependencies: `colors.md`, `radius.md`, `borders.md`

## Checkbox

- Size: 24x24px
- Radius: 8px
- Border: 4px solid black
- Background: brand-secondary (white)
- Focus ring: 4px, brand-tertiary
- Checked: brand color background, brand-secondary (white) checkmark icon

### Disabled
- Border: 4px solid border-light
- Background: disabled
- Text: fg-disabled

## Radio

- Size: 24x24px
- Radius: fully rounded (9999px)
- Border: 4px solid black
- Background: brand-secondary (white)
- Focus ring: 4px, brand-tertiary
- Checked: 4px solid black border, brand color filled inner dot

### Disabled
- Border: 4px solid border-light-medium
- Background: disabled
- Text: fg-disabled

Group all radio items under the same `name` attribute.

## Toggle

### Track
- Size: 56x32px
- Fully rounded
- Background: brand-secondary (white)
- Border: 4px solid black
- Focus-within ring: 4px, brand-tertiary
- Checked track: brand color background
- Disabled track: disabled background

### Thumb
- Size: 20x20px
- Fully rounded
- Background: brand-secondary (white) when off, brand-quaternary (hot pink) when on
- Border: 2px solid black
- Transition: transform 200ms

### Disabled
- Track: disabled background
- Label: fg-disabled text

## Rules

- All selection inputs must have `id` matching label `htmlFor`
- Focus states use brand-tertiary ring for every control type
- Disabled states: no hover/focus interaction
- All controls match the heavy black border + hard silhouette of the system

---

## Source file: `radius.md`

# Border Radius

| Token | Value | Default usage |
|---|---|---|
| base | 20px | Buttons, cards, inputs, modals, popovers, tables, sections, surfaces |
| default | 12px | Inner menu items, nested controls inside a 20px container |
| sm | 8px | Checkboxes, tiny elements |
| full | 9999px | Pills, avatars, toggles, dot indicators |

## Rules

- 20px is the default radius across the product — every component, card, and surface uses 20px unless it is explicitly a tiny control or pill
- All cards (white surfaces over the brand background) MUST use 20px radius
- All buttons MUST use 20px radius (combined with the skewed silhouette defined in `buttons.md`)
- Never use arbitrary radius values outside this scale
- Radius must be consistent within each component family

---

## Source file: `shadows.md`

# Shadows

Shadows in this system are HARD OFFSET BLOCK shadows (no blur, no softness). They sit behind a surface as a solid black slab to create the playful, posterlike, gamified depth seen across the experience.

| Token | CSS value |
|---|---|
| shadow-2xs | `2px 2px 0 0 #000000` |
| shadow-xs | `4px 4px 0 0 #000000` |
| shadow-sm | `6px 6px 0 0 #000000` |
| shadow-md | `8px 8px 0 0 #000000` |
| shadow-lg | `10px 10px 0 0 #000000` |
| shadow-xl | `14px 14px 0 0 #000000` |
| shadow-2xl | `20px 20px 0 0 #000000` |

## Component Mapping

| Component type | Token |
|---|---|
| Subtle separators, tiny UI details | shadow-2xs |
| Inputs, small controls, lightweight cards | shadow-xs |
| Buttons (default) | shadow-sm |
| Standard cards, popovers, dropdowns | shadow-md |
| Prominent cards, sticky surfaces | shadow-lg |
| Modals, high-priority overlays | shadow-xl |
| Hero overlays, top-level emphasis (sparingly) | shadow-2xl |

## Rules

- Use only these tokens — no custom box-shadow values, never use blurred drop shadows
- All shadows are solid black, hard-edged, offset to the bottom-right; this is the signature look
- Keep elevation steps intentional; avoid jumping multiple levels
- Components in the same family share the same baseline elevation
- Hover/focus on interactive elevated elements: step up by one level (the offset visibly grows, reinforcing the gamified press effect)
- Never stack multiple shadow tokens on one element
- Never use shadow-xl/shadow-2xl for dense list items or body containers

---

## Source file: `sidebars.md`

# Sidebars

> Dependencies: `colors.md`, `radius.md`, `borders.md`, `shadows.md`, `typography.md`, `badges.md`, `alerts.md`

## Core Specs

- Background: brand-secondary (white)
- Right border: 4px solid black (for left-sidebar); left border for right-sidebar
- Width: 288px

The sidebar is one of the few full-height white surfaces in the system — it functions as a permanent "framed panel" that lifts off the brand-color canvas.

## Anatomy

### Outer Container
Hidden on mobile, visible at small breakpoint. Needs a toggle/trigger for mobile.

### Inner Wrapper
- Full height, vertical scroll overflow
- Padding: 16px horizontal, 24px vertical

### Navigation List
- Vertical spacing: 12px between items
- Font: Oswald, bold weight, uppercase

### Navigation Item
- Layout: flex, vertically centered
- Padding: 12px horizontal, 12px vertical
- Text: brand color (deep green)
- Radius: 20px
- Hover: brand-quaternary background, black text
- Transition: colors, 200ms
- Icon: 24x24px, brand color, hover → black, 200ms transition
- Label: 16px left margin from icon

### Active Item
- Background: brand color
- Text: brand-secondary (white)
- Optional 4px solid black border + shadow-2xs (2px 2px 0 #000000) for the active item to mimic the signature card silhouette

### Separator
- 24px top padding, 24px top margin
- Top border: 2px solid black
- 12px vertical spacing below

### Bottom CTA / Card
- Padding: 24px
- Top margin: 32px
- Radius: 20px
- Background: brand color (deep green)
- Text: brand-secondary (white)
- Border: 4px solid black
- Shadow: shadow-sm (6px 6px 0 #000000) hard offset
- Can also use any alert variant from `alerts.md`

## Rules

- Responsive: hidden on mobile with a trigger mechanism
- Icons: 24x24px, brand color (hover: black)
- Multi-level menus: indent with 48px left padding
- Spacing follows 8px grid
- Only neutral, brand, brand-tertiary, brand-quaternary, or status tokens — no arbitrary colors

---

## Source file: `tables.md`

# Tables

> Dependencies: `colors.md`, `radius.md`, `borders.md`, `shadows.md`, `typography.md`

## Wrapper

- Horizontal scroll overflow
- Background: brand-secondary (white)
- Radius: 20px
- Border: 4px solid black
- Shadow: shadow-md (8px 8px 0 #000000) hard offset
- Outer padding gap: 8px between border and table edge — same framed treatment as cards

## Table Element

- Full width, left-aligned text (right-aligned for RTL)
- Font: Oswald, 16px, brand color (deep green)

## Table Head

- Font: Oswald, 16px, bold weight, uppercase, brand-secondary (white)
- Background: brand color (deep green)
- Bottom border: 4px solid black
- Cell padding: 32px horizontal, 16px vertical

## Table Body

- Row background: brand-secondary (white)
- Row bottom border: 2px solid black (omit on last row to avoid doubling with wrapper border)
- Row hover: brand-quaternary background at 30% opacity (optional)
- Row header: bold weight, uppercase, brand color, no-wrap
- Cell padding: 32px horizontal, 20px vertical

## Rules

- Wrapper must have horizontal scroll overflow for responsive scrolling
- Last row: omit bottom border to avoid doubling with wrapper border
- Row headers: always `scope="row"` for semantic structure
- Hover on rows is optional — keep it subtle (brand-quaternary at low opacity) so it doesn't fight the immersive canvas
- No arbitrary hex codes — use token colors only

---

## Source file: `tabs.md`

# Tabs

> Dependencies: `colors.md`, `radius.md`, `borders.md`, `shadows.md`, `typography.md`

## Core Specs

- Typography: Oswald, 18px, bold weight, uppercase, brand color (over white surfaces) or brand-secondary (over brand canvas)
- Transitions: all properties, 200ms

## Variants

### 1. Underline (Default)

**Wrapper:** bottom border, 4px solid black

**Tab Item:**
- Padding: 24px horizontal, 20px vertical
- Bottom border: 4px transparent (will become brand color on active)
- Top corners: 20px radius
- Transition: colors, 200ms

| State | Appearance |
|---|---|
| Active | brand color text, 4px solid brand color bottom border |
| Inactive | transparent bottom border; hover → black text, 4px solid brand-quaternary bottom border |
| Disabled | fg-disabled text, not-allowed cursor |

### 2. Pills

**Tab Item:**
- Padding: 20px horizontal, 12px vertical
- Radius: 20px
- Border: 4px solid black
- Font weight: bold, uppercase
- Transition: all, 200ms

| State | Appearance |
|---|---|
| Active | brand color background, brand-secondary (white) text, shadow-xs (4px 4px 0 #000000) hard offset |
| Inactive | brand-secondary (white) background, brand color text; hover → brand-quaternary background, black text |
| Disabled | fg-disabled text, not-allowed cursor |

### 3. Full Width

Children overlap with -4px left margin so the heavy black borders align rather than double.

**Tab Item:**
- Full width, centered text
- Padding: 24px horizontal, 20px vertical
- Background: brand-secondary (white)
- Border: 4px solid black
- Transition: colors, 200ms
- Hover: brand-quaternary background, black text

| State | Appearance |
|---|---|
| Active | brand color background, brand-secondary (white) text |
| First item | rounded start (20px) |
| Last item | rounded end (20px) |

## Tabs with Icons

- Icon size: 20x20px or 24x24px
- Spacing: 12px right margin
- Layout: inline-flex, centered
- Icons inherit the text color of the tab state

---

## Source file: `tooltips-popovers.md`

# Tooltips & Popovers

> Dependencies: `colors.md`, `radius.md`, `borders.md`, `shadows.md`, `typography.md`

## Tooltips

### Core Specs
- Padding: 16px horizontal, 12px vertical
- Font: Oswald, 14px, bold weight, uppercase
- Radius: 20px
- Border: 4px solid black
- Shadow: shadow-xs (4px 4px 0 #000000) hard offset
- Transition: opacity, 200ms

### Dark (Default)
- Background: black
- Text: brand-secondary (white)
- Border: 4px solid black

### Light
- Background: brand-secondary (white)
- Text: brand color (deep green)
- Border: 4px solid black

### Brand
- Background: brand color (deep green)
- Text: brand-secondary (white)
- Border: 4px solid black

## Popovers

### Core Specs
- Background: brand-secondary (white)
- Radius: 20px
- Border: 4px solid black
- Shadow: shadow-md (8px 8px 0 #000000) hard offset
- Outer padding gap: 8px between border and inner content — same framed treatment as cards
- Transition: opacity, 200ms

### Header / Title
- Padding: 16px horizontal, 12px vertical
- Background: brand color (deep green)
- Bottom border: 4px solid black
- Font: Oswald, 16px, bold weight, uppercase, brand-secondary (white)

### Body / Content
- Standard: 16px horizontal, 12px vertical padding; 16px, brand color
- Rich: 24px padding; 16px, brand color

## Arrows

- Size: 12x12px rotated 45deg
- Color must match the background of the tooltip/popover variant
- 4px solid black border on the two visible edges so the arrow reads as part of the framed silhouette

## Rules

- Tooltips: 20px radius, 4px solid black border
- Popovers: 20px radius, 4px solid black border, 8px outer padding gap
- Dark tooltips: black background, brand-secondary (white) text
- Light tooltips/popovers: brand-secondary (white) background + brand color text
- Brand tooltips: brand color background, brand-secondary (white) text
- Arrows match parent background color and carry the same 4px black border treatment

---

## Source file: `typography.md`

# Typography

> Dependencies: `colors.md`

## Core Rules

- **Font:** Oswald, sans-serif — configured at app level, never override. Oswald is a condensed display family; embrace its tall, narrow proportions for an immersive editorial-poster feel
- **Headings:** bold weight (700), uppercase, slightly tightened letter-spacing, heading text color
- **Body copy:** body text color, normal weight (400), regular sentence case, never use brand color for paragraphs longer than one sentence
- **Semantic HTML:** Use `h1`–`h6` in order, never skip levels

## Heading Scale

### Desktop

| Element | Size | Line-height | Letter-spacing | Margin-bottom |
|---|---|---|---|---|
| `h1` | 96px | 0.95 | -1.5px | 32px |
| `h2` | 64px | 1 | -1px | 24px |
| `h3` | 44px | 1.1 | -0.5px | 20px |
| `h4` | 32px | 1.2 | -0.25px | 16px |
| `h5` | 24px | 1.3 | 0 | 12px |
| `h6` | 20px | 1.3 | 0.5px | 12px |

### Responsive

| Element | Tablet (≥768px) | Mobile (default) |
|---|---|---|
| `h1` | 64px | 44px |
| `h2` | 48px | 36px |
| `h3` | 36px | 28px |
| `h4` | 28px | 24px |
| `h5` | 22px | 20px |
| `h6` | 18px | 18px |

Mobile-first: start with mobile sizes, scale up at tablet and desktop breakpoints.

Never reduce line-height below 0.95 for any heading. Headings should feel oversized, bold, and posterlike.

## Paragraphs

### Leading Paragraph
- Size: 22px
- Weight: normal (400)
- Color: body
- Line-height: 1.5
- Max width: ~70 characters

### Normal Paragraph
- Size: 18px
- Weight: normal (400)
- Color: body
- Line-height: 1.5
- Max width: ~65 characters

### Small Supporting Copy
- Size: 14px
- Weight: normal (400)
- Color: body
- Line-height: 1.5
- Use only for helper text, legal text, captions, metadata.

## UI Labels

| Context | Size | Weight |
|---|---|---|
| Button labels | 25px | 700 (bold), uppercase |
| Input labels | 16px or 18px | 600 (semibold), uppercase |
| Captions / meta / badges | 12px or 14px | 600 (semibold), uppercase |

Do not apply paragraph line-height (1.5) to control labels. Labels should be tight and posterlike.

## Links

- **Inline links:** Same size as surrounding text, brand-secondary color (over brand surfaces) or brand color (over white surfaces), underline, hover → no underline
- **CTA links:** brand color, bold weight, uppercase, underline, hover → no underline

## Emphasis

- `<strong>` for high-priority emphasis in body text
- `<em>` for tone emphasis only, not visual hierarchy
- All-caps is the default for headings, buttons, and labels: uppercase, 0.5px letter-spacing minimum, 12px or larger
- Mix oversized headings with much smaller body copy for dramatic editorial contrast

## Dark Mode

Hierarchy stays identical. Only color tokens change (automatic via CSS custom properties). Size, weight, and spacing remain constant.