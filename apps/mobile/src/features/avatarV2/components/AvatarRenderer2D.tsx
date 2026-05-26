import { memo, useMemo } from "react"
import {
  Image,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle
} from "react-native"
import { AVATAR_V2_CATALOG } from "../avatarV2.mock"
import { getAvatarV2RenderLayers } from "../avatarV2Selectors"
import type {
  AvatarAnimationState,
  AvatarCatalogItem,
  UserAvatar
} from "../avatarV2.types"

interface AvatarRenderer2DProps {
  avatar?: Partial<UserAvatar>
  catalog?: AvatarCatalogItem[]
  animationState?: AvatarAnimationState
  size?: number
  style?: StyleProp<ViewStyle>
}

const CANVAS_ASPECT_RATIO = 512 / 768

export const AvatarRenderer2D = memo(function AvatarRenderer2D(
  props: AvatarRenderer2DProps
) {
  const {
    avatar,
    catalog = AVATAR_V2_CATALOG,
    animationState = "idle_front",
    size = 220,
    style
  } = props

  const layers = useMemo(
    () => getAvatarV2RenderLayers({ avatar, catalog, animationState }),
    [animationState, avatar, catalog]
  )
  const height = size / CANVAS_ASPECT_RATIO

  return (
    <View
      pointerEvents="none"
      style={[
        styles.root,
        {
          width: size,
          height
        },
        style
      ]}
    >
      {layers.map((layer) => (
        <Image
          key={`${layer.type}:${layer.id}:${layer.asset.key}`}
          source={layer.asset.source}
          style={styles.layer}
          resizeMode="contain"
        />
      ))}
    </View>
  )
})

const styles = StyleSheet.create({
  root: {
    position: "relative",
    overflow: "visible"
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%"
  }
})
