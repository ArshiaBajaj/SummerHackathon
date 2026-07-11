/**
 * Anact Ortho color system.
 *
 * Base surface is a deep slate rather than pure black — same design language as
 * modern athletic platforms (Nike Training Club, Whoop, Strava's premium tier)
 * so the app reads as premium without going full "black hole".
 *
 * Primary action: emerald-500 (#10b981) — echoes the "GO" / "safe" affordance
 * used in sports officiating (green light = play).
 * Secondary action: indigo-500 (#6366f1) — reserved for analytical / scout
 * surfaces where cool tones read as "data".
 */
export const palette = {
  slate: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
    950: "#020617",
  },
  emerald: {
    50: "#ecfdf5",
    100: "#d1fae5",
    200: "#a7f3d0",
    300: "#6ee7b7",
    400: "#34d399",
    500: "#10b981",
    600: "#059669",
    700: "#047857",
    800: "#065f46",
    900: "#064e3b",
  },
  indigo: {
    50: "#eef2ff",
    100: "#e0e7ff",
    200: "#c7d2fe",
    300: "#a5b4fc",
    400: "#818cf8",
    500: "#6366f1",
    600: "#4f46e5",
    700: "#4338ca",
    800: "#3730a3",
    900: "#312e81",
  },
  amber: {
    400: "#fbbf24",
    500: "#f59e0b",
  },
  rose: {
    400: "#fb7185",
    500: "#f43f5e",
  },
} as const;

export const semanticColors = {
  /** Absolute base surface — sits behind everything. */
  background: palette.slate[900],
  /** Elevated surface — cards, panels, sheets. */
  surface: palette.slate[800],
  /** Doubly elevated — modals, popovers, hero blocks. */
  surfaceElevated: palette.slate[700],
  /** Hairline dividers, subtle borders. */
  border: "rgba(148, 163, 184, 0.14)",
  borderStrong: "rgba(148, 163, 184, 0.28)",
  /** Primary text. */
  text: palette.slate[50],
  /** Secondary text — captions, hints. */
  textMuted: palette.slate[400],
  /** Placeholder / disabled text. */
  textFaint: palette.slate[500],
  /** Primary action, "GO", scoring emphasis. */
  primary: palette.emerald[500],
  primaryHover: palette.emerald[400],
  primaryPressed: palette.emerald[600],
  primarySoft: "rgba(16, 185, 129, 0.15)",
  onPrimary: palette.slate[950],
  /** Secondary action — analytics, insight, scout surfaces. */
  secondary: palette.indigo[500],
  secondaryHover: palette.indigo[400],
  secondaryPressed: palette.indigo[600],
  secondarySoft: "rgba(99, 102, 241, 0.15)",
  onSecondary: palette.slate[50],
  /** Warning / streak alerts. */
  warning: palette.amber[500],
  /** Whistle / danger / stop. */
  danger: palette.rose[500],
  /** Live indicator. */
  live: palette.rose[500],
} as const;

export type SemanticColor = keyof typeof semanticColors;
