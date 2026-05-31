export const uiTheme = {
  colors: {
    background: "#FBF8FD",
    backgroundWarm: "#FEF4F9",
    surface: "#FFFFFF",
    surfaceSoft: "#FFF2F8",
    surfaceMuted: "#F9F3FC",
    surfaceRaised: "#FFFDFE",
    overlayDark: "rgba(28, 16, 34, 0.56)",
    overlaySoft: "rgba(28, 16, 34, 0.16)",
    textPrimary: "#20162A",
    textSecondary: "#675B73",
    textMuted: "#9589A4",
    textInverted: "#FFFFFF",
    border: "#F0E7F6",
    borderStrong: "#E7DAF0",
    primary: "#FF4F98",
    primaryDeep: "#D92A79",
    primaryPressed: "#E24486",
    primaryDisabled: "#F7A8CB",
    primarySoft: "#FFE2EE",
    secondary: "#F3EDF7",
    secondaryPressed: "#E9E1F0",
    secondaryText: "#493F56",
    chipBackground: "#FFE9F4",
    chipText: "#B93872",
    avatarBackground: "#F5ECFA",
    avatarAccent: "#EADBF5",
    divider: "#F3ECF8",
    success: "#3AC08A",
    successSoft: "#DDF5EA",
    successInk: "#1F6B4A",
    warning: "#E0A53A",
    warningSoft: "#FFF2D9",
    warningInk: "#8A5B0B",
    danger: "#E2586C",
    dangerSoft: "#FEE6EA",
    dangerInk: "#8D2634",
    blobPink: "#FFC8DF",
    blobPeach: "#FFE0CC",
    blobLilac: "#E7D5F4",
    blobMint: "#D6F0E3",
    nightBackground: "#1B0F26",
    nightSurface: "rgba(255, 255, 255, 0.08)",
    nightSurfaceSoft: "rgba(255, 255, 255, 0.05)",
    nightBorder: "rgba(255, 255, 255, 0.12)",
    nightTextPrimary: "#FFFFFF",
    nightTextSecondary: "rgba(255, 255, 255, 0.78)",
    nightTextMuted: "rgba(255, 255, 255, 0.5)"
  },
  radius: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 22,
    xl: 30,
    xxl: 40,
    full: 999
  },
  spacing: {
    xxs: 4,
    xs: 6,
    sm: 10,
    md: 15,
    lg: 20,
    xl: 26,
    xxl: 32,
    xxxl: 44
  },
  typography: {
    display: 40,
    title: 30,
    heading: 24,
    subheading: 18,
    body: 16,
    bodySmall: 14,
    caption: 12,
    micro: 11
  },
  shadow: {
    card: {
      shadowColor: "#2A123C",
      shadowOpacity: 0.08,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4
    },
    soft: {
      shadowColor: "#2A123C",
      shadowOpacity: 0.05,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2
    },
    lift: {
      shadowColor: "#D92A79",
      shadowOpacity: 0.22,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 8
    }
  },
  palette: {
    avatar: [
      { bg: "#FFD9E8", fg: "#9E1F56" },
      { bg: "#E3DAF8", fg: "#5A3FB5" },
      { bg: "#D6EEFF", fg: "#1D5A8C" },
      { bg: "#FFE4CC", fg: "#9C4B16" },
      { bg: "#D9F0E0", fg: "#236C4D" },
      { bg: "#FFE8F0", fg: "#B93872" },
      { bg: "#E8E0F5", fg: "#4A2F87" },
      { bg: "#FEEBC8", fg: "#7A4B09" }
    ]
  }
} as const

export type UiTheme = typeof uiTheme
