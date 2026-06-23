import { Image, StyleSheet, View, type ImageStyle } from "react-native"
import { useEffect, useMemo, useState } from "react"
import type {
  RoomV2AssetRef,
  RoomV2AvatarRenderLayer
} from "../../../roomV2/roomV2.types"
import type {
  RoomAvatarFitProfileId,
  RoomAvatarLayerType
} from "../avatarRoom.types"

interface RoomAvatarRenderer2DProps {
  layers: RoomV2AvatarRenderLayer[]
}

export function RoomAvatarRenderer2D(props: RoomAvatarRenderer2DProps) {
  const { layers } = props
  const animation = useMemo(() => getLayerAnimationState(layers), [layers])
  const [frameIndex, setFrameIndex] = useState(0)

  useEffect(() => {
    setFrameIndex(0)
  }, [animation.signature])

  useEffect(() => {
    if (!animation.hasAnimation) return undefined
    const interval = setInterval(() => {
      setFrameIndex((current) => {
        const next = current + 1
        if (animation.loops) return next % animation.frameCount
        return Math.min(next, animation.frameCount - 1)
      })
    }, animation.frameDurationMs)
    return () => clearInterval(interval)
  }, [
    animation.frameCount,
    animation.frameDurationMs,
    animation.hasAnimation,
    animation.loops
  ])

  return (
    <View pointerEvents="none" style={styles.root}>
      {layers.map((layer) => {
        const asset = getLayerFrameAsset(layer, frameIndex)
        return (
          <Image
            key={`${layer.type}:${layer.id}`}
            source={asset.source}
            resizeMode="contain"
            fadeDuration={0}
            style={[
              styles.layer,
              getLayerFitStyle(layer)
            ]}
          />
        )
      })}
    </View>
  )
}

function getLayerFrameAsset(
  layer: RoomV2AvatarRenderLayer,
  frameIndex: number
): RoomV2AssetRef {
  const frames = layer.animation?.frames
  if (!frames?.length) return layer.asset
  return frames[frameIndex % frames.length] ?? layer.asset
}

function getLayerAnimationState(layers: RoomV2AvatarRenderLayer[]): {
  hasAnimation: boolean
  frameCount: number
  frameDurationMs: number
  loops: boolean
  signature: string
} {
  const animatedLayers = layers.filter((layer) =>
    (layer.animation?.frames.length ?? 0) > 1
  )
  if (!animatedLayers.length) {
    return {
      hasAnimation: false,
      frameCount: 1,
      frameDurationMs: 120,
      loops: false,
      signature: "static"
    }
  }
  const frameCount = Math.max(
    ...animatedLayers.map((layer) => layer.animation?.frames.length ?? 1)
  )
  const frameDurationMs = Math.max(
    80,
    Math.min(
      ...animatedLayers.map((layer) => layer.animation?.frameDurationMs ?? 120)
    )
  )
  return {
    hasAnimation: true,
    frameCount,
    frameDurationMs,
    loops: animatedLayers.some((layer) => layer.animation?.loop !== false),
    signature: animatedLayers
      .map((layer) => `${layer.id}:${layer.animation?.frames.map((frame) => frame.key).join("|")}`)
      .join(";")
  }
}

const ROOM_AVATAR_LAYER_FIT: Record<
  RoomAvatarFitProfileId,
  Partial<Record<RoomAvatarLayerType, ImageStyle>>
> = {
  // Female Motion v1 layers share the same approved 256x384 front rig.
  // Per-layer transforms break the pixel alignment established by asset QA.
  datevibe_female_room_avatar_v1: {},
  datevibe_male_room_avatar_v1: {
    hairFront: {
      transform: [{ translateY: -1 }, { scale: 1.018 }]
    },
    face: {
      transform: [{ translateY: -1 }, { scale: 0.992 }]
    },
    topInner: {
      transform: [{ translateY: 1 }, { scaleX: 1.008 }]
    },
    topOuter: {
      transform: [{ translateY: 1 }, { scaleX: 1.018 }, { scaleY: 1.006 }]
    },
    bottom: {
      transform: [{ translateY: 1 }, { scaleX: 1.01 }]
    },
    shoes: {
      transform: [{ translateY: 2 }, { scaleX: 1.03 }, { scaleY: 0.99 }]
    },
    accessory: {
      transform: [{ translateY: 1 }, { scale: 0.99 }]
    }
  }
}

function getLayerFitStyle(layer: RoomV2AvatarRenderLayer): ImageStyle | undefined {
  if (
    !isRoomAvatarFitProfileId(layer.fitProfileId) ||
    !isRoomAvatarLayerType(layer.type)
  ) {
    return undefined
  }
  return ROOM_AVATAR_LAYER_FIT[layer.fitProfileId]?.[layer.type]
}

function isRoomAvatarFitProfileId(
  value: string | undefined
): value is RoomAvatarFitProfileId {
  return (
    value === "datevibe_female_room_avatar_v1" ||
    value === "datevibe_male_room_avatar_v1"
  )
}

function isRoomAvatarLayerType(
  value: string
): value is RoomAvatarLayerType {
  return (
    value === "hairBack" ||
    value === "base" ||
    value === "face" ||
    value === "hair" ||
    value === "bottom" ||
    value === "shoes" ||
    value === "topInner" ||
    value === "top" ||
    value === "topOuter" ||
    value === "accessory" ||
    value === "hairFront"
  )
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    height: "100%",
    position: "relative",
    overflow: "visible"
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%"
  }
})
