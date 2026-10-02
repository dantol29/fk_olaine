---
name: FK Olaine
description: The digital home of Olaine's football club.
colors:
  club-red: "#c90035"
  club-red-dark: "#a8002c"
  club-navy: "#142e49"
  club-navy-light: "#24446b"
  club-gray-light: "#f5f7fa"
  club-muted: "#66778b"
  page-background: "#f7f9fb"
  white: "#ffffff"
typography:
  display:
    fontFamily: "Outfit, sans-serif"
    fontSize: "3rem"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Outfit, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Outfit, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Outfit, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.25
rounded:
  sm: "0.375rem"
  md: "0.625rem"
  lg: "0.875rem"
  xl: "1.25rem"
  pill: "9999px"
spacing:
  1: "0.25rem"
  2: "0.5rem"
  3: "0.75rem"
  4: "1rem"
  6: "1.5rem"
  8: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.club-red}"
    textColor: "{colors.white}"
    rounded: "{rounded.xl}"
    padding: "0.375rem 1.25rem"
  header-join-button:
    backgroundColor: "{colors.club-red}"
    textColor: "{colors.white}"
    rounded: "0"
    padding: "0 1.5rem"
    height: "2.75rem"
  card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.club-navy}"
    rounded: "{rounded.xl}"
    padding: "1.5rem"
---

# Design System: FK Olaine

## Overview

**Creative North Star: “Olaines Matchday, Close to Home”**

This is a code-derived description of the existing website. It pairs football matchday energy with a practical, local club presence. The crest, photography, fixtures, team information, and news carry the identity; the interface gives them clear, sturdy framing.

The visual voice is confident, community-facing, and direct. Club red and deep navy are the strongest signals. Pale cool surfaces create room for schedules and lists, while imagery brings the people and grounds of the club forward. Keep future work consistent with the incumbent implementation unless the product owner chooses a redesign.

**Key Characteristics:** club-proud; information-led; photographic; responsive.

**The Club Colors Rule.** Use red for actions and focused emphasis; use navy for structure, headings, and navigation.

## Colors

The palette is grounded in the crest and repeated site tokens. Club red is the action color. Deep navy carries navigation and key text. Pale gray-blue surfaces separate information without competing with match imagery. White is used for cards and high-contrast text on dark surfaces.

### Named Rules

**The Matchday Accent Rule.** Keep club red purposeful: primary actions, active indicators, and small emphasis.

## Typography

**Display Font:** Outfit (sans-serif)  
**Body Font:** Outfit (sans-serif)  
**Label/Mono Font:** Geist Mono is available for technical or tabular details; Caveat is available as a signature face but is not a general interface font.

**Character:** Compact, sturdy sans-serif typography keeps schedules and club information easy to scan. Headings use tight tracking and stronger weight; body copy remains open and neutral.

### Hierarchy

- **Display** (700, 48px, 1.05): prominent page or feature headings.
- **Headline** (700, 32px, 1.15): section headings and featured content.
- **Title** (600–700, 20–24px, approximately 1.25): cards and content groups.
- **Body** (400, 16px, 1.5): paragraphs and supporting information.
- **Label** (600, 12–14px, 1.25): navigation, metadata, and controls.

**The Scan-First Type Rule.** Use weight and size to establish hierarchy; avoid decorative type for routine information.

## Layout

The public site uses a centered content width up to 1440px with page gutters that grow from 24px on small screens to 48px at wider sizes. Sections use generous vertical separation, then tighter spacing within cards and data groups. At smaller widths, multi-column content stacks and navigation becomes a drawer. The homepage can place league information over the feature photography on wide screens.

Common responsive thresholds include 640px (`sm`) and 1280px (`xl`), with Tailwind's other defaults used where present. Use full-width calendar and carousel treatments selectively; keep text and tables inside readable content bounds.

The site header has its own compact masthead layout: a white bar with navy text and a 3px club-red lower border (84px below 1280px; 100px from 1280px), a centered maximum width (1440px), and gutters (20px, then 32px from 640px and 40px from 1280px). Six desktop navigation destinations and the join action appear from 1280px; smaller widths use search and menu controls.

## Elevation & Depth

The interface uses a hybrid approach. Pale tonal backgrounds and borders separate most content; stronger shadows lift overlays, drawers, menus, and floating controls. Photography is often darkened with a gradient when text sits on top.

### Shadow Vocabulary

- **Overlay:** medium to strong diffuse shadow on drawers, dialogs, and floating selectors.
- **Menu:** restrained shadow with a subtle ring to separate the open menu from the page.

**The Surface Before Shadow Rule.** Prefer a clear surface-color or border change for ordinary cards; reserve pronounced shadows for overlays and floating UI.

## Shapes

The system favors rounded rectangles. Small controls and menu items use modest corners; cards and drawers use larger radii, with 20px as a recurring outer corner. Pills are used for compact status and filter controls. Borders stay light and functional. Crop and clip photography cleanly within its container shape.

## Components

### Buttons

- **Shape:** Rounded rectangles, typically 10–20px; circular icon affordances are also used.
- **Primary:** Club red with white text; compact padding and a clear action label.
- **Hover / Focus:** Darken red on hover where appropriate. Keyboard focus uses a visible 2px outline with 2px offset.
- **Press:** Buttons have subtle press feedback; respect reduced-motion preferences.

### Chips

- **Style:** Compact rounded controls on pale neutral surfaces; selected or active states use club red or a red-tinted background.
- **State:** Keep selected, unselected, and disabled states visually distinct.

### Cards / Containers

- **Corner Style:** Rounded rectangles, commonly 14–20px.
- **Background:** White on the pale page background; navy and red are used for featured or selected areas.
- **Shadow Strategy:** Flat or lightly separated at rest; stronger depth belongs to overlays.
- **Border:** Subtle cool gray when needed to define a boundary.
- **Internal Padding:** Commonly 16–24px, with larger values on wide screens.

### Inputs / Fields

- **Style:** White or pale neutral background with a light gray border and rounded corners.
- **Focus:** Red border or a visible focus ring, depending on the component.
- **Error / Disabled:** Use the red semantic color for errors and reduce emphasis for disabled controls without losing legibility.

### Navigation

The homepage header overlays the hero photograph with a transparent background and white navigation, icons and keyboard outlines. Inner pages use the white masthead with navy text. The main masthead now uses only the crest, with no adjacent text. The crest is 112px tall from 1280px and 92px below it, inside a white badge offset down by 16px and 12px respectively. It extends below the masthead. The mobile drawer retains the compact Outfit club name (weight 800, 18px then 24px from 640px) beside its contained crest. Desktop navigation uses navy labels (14px, weight 600), 8px spacing between destinations, a red underline for the active route, and a pale cool hover surface with red text. The club menu includes teams, coaches, dynamically managed club pages, and labelled official social links; social links also remain accessible in the footer and mobile menu.

The desktop header join button is a distinct component: a square-cornered red rectangle with a 44px height, 24px horizontal padding, white text, and an inline arrow. Its hover state darkens the red. Header links and controls use visible navy keyboard outlines against white. These measurements apply to the header action; the general button rules above continue to describe other site actions.

Mobile navigation opens from the top, is bounded by the viewport height (100dvh), and scrolls vertically when its content exceeds the available space. A navy masthead repeats the contained club identity; white navigation below groups club pages, joining, contacts, and social destinations. Main links have generous rows (minimum 56px); grouped club links and icon controls provide minimum 44px targets. Keep long club lists and contact details reachable, including the bottom safe area.

Search and joining use sibling drawers. Opening either from mobile navigation closes the menu; closing that flow returns focus to the persistent menu trigger. Opening either from the header returns focus to its own trigger. Preserve the existing search results and joining contact flow when changing masthead styling.

**The Crest Identity Rule.** The main header uses the larger crest-only white badge selected by the user. The mobile drawer keeps the contained crest and Outfit club name for its compact identity.

The white header was selected in the live browser on 2026-10-01 (session 8d5f240b). Automated desktop/mobile rendering, drawer transitions, and focus restoration remain unverified; the Browser runtime reported no available browser.

### Fixture and Schedule Cards

Schedules are information-dense but grouped by team, date, and event type. Use navy for structural context and red to draw attention to FK Olaine, the next match, or an active date. Keep dates, times, venues, and team names easy to scan at narrow widths.

## Do's and Don'ts

### Do:

- **Do** use the existing crest and club photography as the primary identity assets.
- **Do** use club red for actions and active or match-related emphasis.
- **Do** keep public navigation and schedule layouts responsive.
- **Do** preserve visible keyboard-focus styles and reduced-motion behavior.
- **Do** use the existing Outfit font for everyday interface text.

### Don't:

- **Don't** replace the club palette or crest without an explicit identity change.
- **Don't** use deep shadows on every card; the existing system relies mainly on tonal surfaces.
- **Don't** put long schedule or news copy over busy photography without a readable overlay.
- **Don't** use Caveat or Geist Mono as the default body typeface.
