---
name: Resume Conversion Resume Converter
description: A calm editorial workspace wrapped around a faithful Resume Conversion A4 résumé template.
colors:
  ink: "#17201d"
  muted: "#64706b"
  line: "#cdd3cf"
  paper: "#ffffff"
  workspace: "#eef0ee"
  accent: "#b9ff3d"
  accent-ink: "#213114"
  warning: "#a4531c"
typography:
  display:
    fontFamily: "Georgia, Times New Roman, serif"
    fontSize: "clamp(3.7rem, 7vw, 7.5rem)"
    fontWeight: 700
    lineHeight: 0.86
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Georgia, Times New Roman, serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.025em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.82rem"
    fontWeight: 400
    lineHeight: 1.45
  document:
    fontFamily: "Times New Roman, Times, serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.18
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.12em"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "0"
    padding: "0.72rem 1rem"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "0"
    padding: "0.7rem 0.75rem"
---

# Design System: Resume Conversion Resume Converter

## Overview

**Creative North Star: "The Registrar's Worktable"**

The app is an orderly document-preparation surface: quiet controls on cool gray, one dark institutional bar, and an undisturbed sheet of white A4 paper. The editor may feel contemporary, but the output page remains subordinate to the supplied Resume Conversion template rather than adopting the app's visual language.

**Key Characteristics:**

- Split editor-and-paper workspace on desktop.
- Square, ruled controls with clear state contrast.
- Acid-lime accent reserved for decisive actions and identity marks.
- Print preview follows the supplied bilingual document structure.

## Colors

Restrained neutrals carry the work surface; one high-energy lime marks action without entering the printed résumé.

### Primary

- **Action Lime** (`#b9ff3d`): logo blocks, export action, and verified-state accents.
- **Institutional Ink** (`#17201d`): app bar, upload-stage ground, and primary text.

### Neutral

- **Paper White** (`#ffffff`): résumé page, inputs, and source-file surface.
- **Cool Workspace** (`#eef0ee`): background surrounding the page.
- **Divider Gray** (`#cdd3cf`): structural separators.
- **Muted Copy** (`#64706b`): secondary instructions and metadata.
- **Attention Ochre** (`#a4531c`): missing-field notices.

**The Paper Boundary Rule.** App colors stop at the paper edge. Printed content stays black on white.

## Typography

**Display Font:** Georgia with Times New Roman fallback  
**Body Font:** native system sans  
**Document Font:** Times New Roman with Times fallback

The interface uses sturdy editorial headlines beside compact utility copy. The résumé itself uses the supplied template's conventional serif rhythm and a heavier bilingual title.

### Hierarchy

- **Display** (700, `clamp(3.7rem, 7vw, 7.5rem)`, `0.86`): upload-page promise only.
- **Headline** (700, `2rem`, `1`): editor section title.
- **Body** (400, `0.82rem`, `1.45`): fields and operational copy.
- **Document** (400, `16px`, `1.18`): A4 résumé content.
- **Label** (800, `0.72rem`, tracked uppercase where used): compact workflow metadata.

**The Two Registers Rule.** Interface typography may be editorial; document typography must stay faithful to the template.

## Layout

Desktop uses a sticky 68px command bar, a `minmax(390px, 38vw)` editor, and a flexible preview stage. The preview is always 794 × 1123px on screen and 210 × 297mm in print. Below 760px the workspace becomes one column; fields collapse below 460px. The document scales visually on small screens without changing its print geometry.

## Elevation & Depth

Most surfaces are flat and separated by tone or one-pixel rules. The paper alone receives ambient lift (`0 12px 40px rgba(24,35,31,.16)`), reinforcing that it is the primary artifact.

**The Single Lift Rule.** Only the paper floats; controls and panels remain structurally flat.

## Shapes

Corners are square. Borders, table rules, and rectangular blocks carry the institutional character. Circular geometry is limited to status dots and the upload screen's oversized background arc.

## Components

### Buttons

- **Primary:** square Action Lime block with Institutional Ink text and `0.72rem 1rem` padding.
- **Hover / Focus:** lighter lime on hover; three-pixel olive focus outline with two-pixel offset.
- **Text action:** borderless, underlined, and used for replacement only.

### Cards / Containers

- **Corner Style:** zero radius.
- **Background:** paper white or cool tonal gray.
- **Shadow Strategy:** none except the A4 preview.
- **Border:** one-pixel Divider Gray where containment is needed.

### Inputs / Fields

- **Style:** square white field, one-pixel gray stroke, compact padding.
- **Focus:** visible three-pixel olive outline.
- **Missing:** warm white background and ochre border, paired with a textual “Missing” marker.

### Navigation

The command bar is a single dark strip with identity at left, document state centered on desktop, and the export action at right. On mobile, identity condenses to its Q mark and the status sentence is hidden.

### A4 Résumé Preview

This signature component preserves the bilingual title, personal-detail order, portrait anchor, four-column education table, numbered work history, and research-results close. App-only blank indicators disappear in print.

## Do's and Don'ts

### Do:

- **Do** keep extraction uncertainty editable and visibly marked.
- **Do** preserve the 794 × 1123px preview and A4 print dimensions.
- **Do** keep the accent rare and operational.
- **Do** use rules and tonal changes before adding containers.

### Don't:

- **Don't** restyle the résumé with app colors, rounded cards, or decorative shadows.
- **Don't** hide missing data or present best-effort extraction as guaranteed.
- **Don't** truncate long user content merely to hold one page; allow printed continuation.
