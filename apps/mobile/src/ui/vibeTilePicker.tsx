import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native"
import { uiTheme } from "./theme"

export interface VibeOption {
  id: string
  label: string
  swatch: string
  accent: string
  ring: string
}

export const VIBE_PRESETS: readonly VibeOption[] = [
  { id: "sunset", label: "Sunset", swatch: "#FFB99A", accent: "#C94D20", ring: "#F7D8C5" },
  { id: "dusk", label: "Dusk", swatch: "#CBB6F2", accent: "#4A2F87", ring: "#E3D6F7" },
  { id: "mint", label: "Mint", swatch: "#B7E7CE", accent: "#236C4D", ring: "#D2EFDF" },
  { id: "rose", label: "Rose", swatch: "#FFBEDA", accent: "#B93872", ring: "#FBDAE8" },
  { id: "aurora", label: "Aurora", swatch: "#B7D9F2", accent: "#1D5A8C", ring: "#D6E7F5" },
  { id: "dawn", label: "Dawn", swatch: "#FFE38C", accent: "#7A4B09", ring: "#F7E3B2" }
]

interface VibeTilePickerProps {
  selectedId: string
  onSelect: (id: string) => void
  style?: StyleProp<ViewStyle>
}

export function VibeTilePicker(props: VibeTilePickerProps) {
  const { selectedId, onSelect, style } = props

  return (
    <View style={[styles.grid, style]}>
      {VIBE_PRESETS.map((option) => {
        const selected = option.id === selectedId
        return (
          <Pressable
            key={option.id}
            onPress={() => onSelect(option.id)}
            style={({ pressed }) => [
              styles.tile,
              selected ? styles.tileSelected : null,
              pressed && !selected ? styles.tilePressed : null
            ]}
          >
            <View
              style={[
                styles.swatch,
                {
                  backgroundColor: option.swatch,
                  borderColor: selected ? option.accent : "rgba(0,0,0,0.05)"
                }
              ]}
            />
            {selected ? (
              <View style={[styles.swatchRing, { borderColor: option.accent }]} pointerEvents="none" />
            ) : null}
            <Text
              style={[
                styles.label,
                selected ? { color: option.accent, fontWeight: "800" } : null
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: uiTheme.spacing.sm,
    justifyContent: "space-between"
  },
  tile: {
    width: "31%",
    alignItems: "center",
    paddingVertical: uiTheme.spacing.sm,
    paddingHorizontal: uiTheme.spacing.xs,
    borderRadius: uiTheme.radius.lg,
    position: "relative"
  },
  tilePressed: {
    backgroundColor: "rgba(255, 255, 255, 0.55)"
  },
  tileSelected: {
    backgroundColor: "#FFFFFF",
    ...uiTheme.shadow.soft
  },
  swatch: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2
  },
  swatchRing: {
    position: "absolute",
    top: 4,
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderStyle: "solid"
  },
  label: {
    marginTop: 8,
    fontSize: uiTheme.typography.caption,
    color: uiTheme.colors.textSecondary,
    fontWeight: "700"
  }
})
