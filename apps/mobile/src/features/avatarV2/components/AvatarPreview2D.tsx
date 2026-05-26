import { useMemo } from "react"
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native"
import { uiTheme } from "../../../ui/theme"
import { AVATAR_V2_CATALOG } from "../avatarV2.mock"
import { ROOM_AVATAR_CATALOG } from "../room/avatarRoom.mock"
import { projectAvatarV2ToRoomAvatarAppearance } from "../room/avatarRoomProjection"
import { getRoomAvatarRenderLayers } from "../room/avatarRoomSelectors"
import { RoomAvatarRenderer2D } from "../room/components/RoomAvatarRenderer2D"
import type {
  AvatarAnimationState,
  AvatarCatalogItem,
  AvatarItemType,
  UserAvatar
} from "../avatarV2.types"

interface AvatarPreview2DProps {
  avatar?: Partial<UserAvatar>
  catalog?: AvatarCatalogItem[]
  animationState?: AvatarAnimationState
  size?: number
  stageHeight?: number
  selectedType?: AvatarItemType
  label?: string
  style?: StyleProp<ViewStyle>
}

export function AvatarPreview2D(props: AvatarPreview2DProps) {
  const {
    avatar,
    catalog = AVATAR_V2_CATALOG,
    size = 220,
    stageHeight = 286,
    selectedType,
    label,
    style
  } = props
  const roomAvatarLayers = useMemo(() => {
    const { appearance } = projectAvatarV2ToRoomAvatarAppearance({
      avatar,
      avatarCatalog: catalog,
      roomAvatarCatalog: ROOM_AVATAR_CATALOG
    })

    return getRoomAvatarRenderLayers({
      appearance,
      catalog: ROOM_AVATAR_CATALOG
    })
  }, [avatar, catalog])

  const avatarHeight = size / (256 / 384)

  return (
    <View style={[styles.root, style]}>
      <View style={[styles.stage, { minHeight: stageHeight }]}>
        <View style={styles.glow} />
        <View style={styles.floorShadow} />
        <View style={[styles.avatar, { width: size, height: avatarHeight }]}>
          <RoomAvatarRenderer2D layers={roomAvatarLayers} />
        </View>
      </View>
      {label || selectedType ? (
        <View style={styles.metaPill}>
          <View style={styles.metaDot} />
          <Text style={styles.metaText} numberOfLines={1}>
            {label ?? `${selectedType} selected`}
          </Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center"
  },
  stage: {
    width: "100%",
    minHeight: 286,
    alignItems: "center",
    justifyContent: "flex-end",
    overflow: "visible"
  },
  glow: {
    position: "absolute",
    bottom: 30,
    width: 196,
    height: 156,
    borderRadius: 98,
    backgroundColor: "rgba(255, 79, 152, 0.14)"
  },
  floorShadow: {
    position: "absolute",
    bottom: 14,
    width: 132,
    height: 24,
    borderRadius: 999,
    backgroundColor: "rgba(20, 8, 24, 0.36)"
  },
  avatar: {
    marginBottom: -2
  },
  metaPill: {
    marginTop: uiTheme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: uiTheme.radius.full,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)"
  },
  metaDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: uiTheme.colors.primary
  },
  metaText: {
    maxWidth: 170,
    color: "rgba(255,255,255,0.78)",
    fontSize: uiTheme.typography.caption,
    fontWeight: "800",
    textTransform: "capitalize"
  }
})
