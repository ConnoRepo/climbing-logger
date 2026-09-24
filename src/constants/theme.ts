/**
 * Design tokens from the "App: Climbing Logging Prototype" Figma file.
 * The look is a paper notebook: black ink on white, square corners,
 * thick outlines and flat grey fills.
 */

export const colors = {
  paper: "#FFFFFF",
  ink: "#000000",
  // Figma "Simple Design System" text/icon colour
  inkSoft: "#1E1E1E",
  // Flat fills: timer panels & buttons, journal hint box, active day pill
  fill: "#D9D9D9",
  fillLight: "#EAEAEA",
  fillFaint: "#F5F5F5",
  placeholder: "#C0C0C0",
  // Start button and the timer's GO panel
  go: "#B9E8B0",
  // Destructive actions (swipe-to-delete)
  danger: "#E03B2F",
} as const;

export const fonts = {
  regular: "Inter_400Regular",
  semiBold: "Inter_600SemiBold",
} as const;

/** Text styles, named after where they appear in the Figma frames. */
export const type = {
  display: { fontFamily: fonts.semiBold, fontSize: 64, lineHeight: 77 }, // TIMER, Set 1
  title: { fontFamily: fonts.semiBold, fontSize: 48, lineHeight: 58 }, // Journal
  subDisplay: { fontFamily: fonts.semiBold, fontSize: 40, lineHeight: 48 }, // Rest
  header: { fontFamily: fonts.semiBold, fontSize: 36, lineHeight: 43 }, // Monday, 2nd
  heading: { fontFamily: fonts.semiBold, fontSize: 30, lineHeight: 36 }, // One Arm Pull Ups
  row: { fontFamily: fonts.semiBold, fontSize: 24, lineHeight: 29 }, // Mobility
  label: { fontFamily: fonts.semiBold, fontSize: 20, lineHeight: 24 }, // Mar, 2nd / Block 1
  button: { fontFamily: fonts.semiBold, fontSize: 16, lineHeight: 19 }, // Journal / + Workout
  note: { fontFamily: fonts.semiBold, fontSize: 15, lineHeight: 18 }, // Start typing...
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 16 }, // day pills
} as const;

export type TypeVariant = keyof typeof type;

export const borders = {
  thick: 3, // cards, workout rows, journal page
  thin: 2, // small buttons, checkboxes, hint box
  hairline: 1, // "+" add box
} as const;

export const space = {
  xs: 8,
  sm: 12,
  md: 20,
  lg: 29,
  xl: 40,
} as const;

export const radii = {
  none: 0,
  pill: 8,
  sheet: 55, // top corners of bottom sheets
} as const;
