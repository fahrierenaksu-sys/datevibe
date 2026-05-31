/**
 * MyAvatar — renders the current user's avatar with any equipped cosmetics.
 *
 * Use this instead of plain <Avatar> for the current user's avatar
 * (YouScreen, lobby preview, match modal). For other users' avatars,
 * use <Avatar> directly since cosmetics are per-user.
 */

import type { StyleProp, ViewStyle } from "react-native"
import { FRAME_COLORS } from "../features/cosmetics/cosmeticCatalog"
import { useCosmeticStore } from "../features/cosmetics/cosmeticStore"
import { Avatar } from "./avatar"

interface MyAvatarProps {
  name: string
  seed?: string
  size?: number
  ring?: "none" | "soft" | "strong"
  style?: StyleProp<ViewStyle>
}

export function MyAvatar(props: MyAvatarProps) {
  const cosmetics = useCosmeticStore()

  const hat = cosmetics.getEquippedItem("hat")
  const frame = cosmetics.getEquippedItem("frame")

  return (
    <Avatar
      {...props}
      hatGlyph={hat?.glyph}
      frameColor={frame ? FRAME_COLORS[frame.id] : undefined}
    />
  )
}
