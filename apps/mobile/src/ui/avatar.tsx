import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native"
import { uiTheme } from "./theme"

interface AvatarProps {
  name: string
  seed?: string
  size?: number
  ring?: "none" | "soft" | "strong"
  style?: StyleProp<ViewStyle>
  /** Optional cosmetic hat glyph rendered above the face */
  hatGlyph?: string
  /** Optional cosmetic frame ring color override */
  frameColor?: string
}

function hashSeed(value: string): number {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0
  }
  return Math.abs(hash)
}

function deriveInitials(name: string): string {
  const trimmed = name.trim()
  if (trimmed.length === 0) {
    return "?"
  }
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) {
    return parts[0][0].toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function pickAvatarSwatch(seed: string): { bg: string; fg: string } {
  const palette = uiTheme.palette.avatar
  return palette[hashSeed(seed) % palette.length]
}

// ── Face part catalogs ──────────────────────────────────────
// Each catalog is indexed by (hash % catalog.length)

const EYES: string[] = ["◕ ◕", "● ●", "◉ ◉", "◔ ◔", "✦ ✦", "◕ ◔"]
const MOUTHS: string[] = ["⌣", "‿", "◡", "▽", "∪", "◠"]
const BLUSH: string[] = ["none", "soft", "bright"]
const ACCESSORIES: string[] = ["none", "none", "sparkle", "halo", "heart", "star"]

interface FaceParts {
  eyes: string
  mouth: string
  blush: "none" | "soft" | "bright"
  accessory: "none" | "sparkle" | "halo" | "heart" | "star"
}

function deriveFaceParts(seed: string): FaceParts {
  const h = hashSeed(seed)
  return {
    eyes: EYES[h % EYES.length],
    mouth: MOUTHS[(h >> 4) % MOUTHS.length],
    blush: BLUSH[(h >> 8) % BLUSH.length] as FaceParts["blush"],
    accessory: ACCESSORIES[(h >> 12) % ACCESSORIES.length] as FaceParts["accessory"]
  }
}

const ACCESSORY_GLYPH: Record<string, string> = {
  sparkle: "✧",
  halo: "◌",
  heart: "♥",
  star: "✦"
}

export function Avatar(props: AvatarProps) {
  const { name, seed, size = 64, ring = "none", style, hatGlyph, frameColor } = props
  const key = seed ?? name
  const swatch = pickAvatarSwatch(key)
  const initials = deriveInitials(name)
  const face = deriveFaceParts(key)
  const isLarge = size >= 72
  const isHero = size >= 120
  const ringWidth = ring === "strong" ? 3 : ring === "soft" ? 1.5 : 0
  const ringColor = frameColor ?? (ring === "strong" ? "#FFFFFF" : "rgba(255,255,255,0.7)")

  const eyeSize = isHero ? 16 : isLarge ? 12 : 9
  const mouthSize = isHero ? 14 : isLarge ? 11 : 8
  const accessorySize = isHero ? 12 : isLarge ? 10 : 7
  const blushSize = isHero ? 10 : isLarge ? 7 : 5

  const showFace = size >= 40
  const showAccessory = face.accessory !== "none" && size >= 52
  const showBlush = face.blush !== "none" && size >= 52

  return (
    <View
      style={[
        styles.wrapper,
        ring !== "none" ? uiTheme.shadow.soft : null,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: swatch.bg,
          borderWidth: ringWidth,
          borderColor: ringColor
        },
        style
      ]}
    >
      {/* Highlight orb for depth */}
      <View
        style={[
          styles.highlight,
          {
            width: size * 0.65,
            height: size * 0.65,
            borderRadius: (size * 0.65) / 2,
            top: -size * 0.1,
            left: -size * 0.05
          }
        ]}
      />

      {showFace ? (
        <View style={styles.faceContainer}>
          {/* Eyes */}
          <Text
            style={[
              styles.faceElement,
              {
                color: swatch.fg,
                fontSize: eyeSize,
                marginBottom: isHero ? 2 : 1,
                letterSpacing: isHero ? 4 : isLarge ? 3 : 2
              }
            ]}
          >
            {face.eyes}
          </Text>

          {/* Blush cheeks */}
          {showBlush ? (
            <View style={styles.blushRow}>
              <View
                style={[
                  styles.blushDot,
                  {
                    width: blushSize,
                    height: blushSize,
                    borderRadius: blushSize / 2,
                    backgroundColor:
                      face.blush === "bright"
                        ? "rgba(255, 120, 160, 0.45)"
                        : "rgba(255, 160, 180, 0.3)"
                  }
                ]}
              />
              <View style={{ width: size * 0.25 }} />
              <View
                style={[
                  styles.blushDot,
                  {
                    width: blushSize,
                    height: blushSize,
                    borderRadius: blushSize / 2,
                    backgroundColor:
                      face.blush === "bright"
                        ? "rgba(255, 120, 160, 0.45)"
                        : "rgba(255, 160, 180, 0.3)"
                  }
                ]}
              />
            </View>
          ) : null}

          {/* Mouth */}
          <Text
            style={[
              styles.faceElement,
              {
                color: swatch.fg,
                fontSize: mouthSize,
                opacity: 0.75,
                marginTop: isHero ? 1 : 0
              }
            ]}
          >
            {face.mouth}
          </Text>

          {/* Accessory badge */}
          {showAccessory ? (
            <View
              style={[
                styles.accessoryBadge,
                {
                  top: -size * 0.06,
                  right: -size * 0.04,
                  width: accessorySize * 2,
                  height: accessorySize * 2,
                  borderRadius: accessorySize
                }
              ]}
            >
              <Text
                style={[
                  styles.accessoryGlyph,
                  { color: swatch.fg, fontSize: accessorySize }
                ]}
              >
                {ACCESSORY_GLYPH[face.accessory]}
              </Text>
            </View>
          ) : null}

          {/* Equipped hat cosmetic */}
          {hatGlyph && size >= 52 ? (
            <View
              style={[
                styles.hatBadge,
                {
                  top: -size * 0.22,
                  width: size * 0.5,
                  height: size * 0.5
                }
              ]}
            >
              <Text style={{ fontSize: isHero ? 28 : isLarge ? 20 : 14 }}>
                {hatGlyph}
              </Text>
            </View>
          ) : null}
        </View>
      ) : (
        /* Fallback to initials for tiny sizes */
        <Text
          style={[
            styles.initials,
            {
              color: swatch.fg,
              fontSize: Math.round(size * 0.42)
            }
          ]}
        >
          {initials}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative"
  },
  highlight: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.45)"
  },
  faceContainer: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    position: "relative"
  },
  faceElement: {
    fontWeight: "800",
    textAlign: "center"
  },
  blushRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: "55%"
  },
  blushDot: {},
  accessoryBadge: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.6)"
  },
  accessoryGlyph: {
    fontWeight: "800"
  },
  hatBadge: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3
  },
  initials: {
    fontWeight: "800",
    letterSpacing: 0.5,
    zIndex: 1
  }
})
