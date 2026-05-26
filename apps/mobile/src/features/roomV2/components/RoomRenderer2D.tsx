import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle
} from "react-native"
import { RoomAvatarRenderer2D } from "../../avatarV2/room/components/RoomAvatarRenderer2D"
import type {
  RoomShell,
  RoomV2RenderItem
} from "../roomV2.types"

interface RoomRenderer2DProps {
  shell: RoomShell | null
  renderItems: RoomV2RenderItem[]
  debugPlacement?: boolean
  style?: StyleProp<ViewStyle>
  testID?: string
  selectedInstanceId?: string
  onItemTap?: (item: RoomV2RenderItem) => void
}

export function RoomRenderer2D(props: RoomRenderer2DProps) {
  const { shell, renderItems, debugPlacement = false, style, testID, selectedInstanceId, onItemTap } = props

  if (!shell) {
    return <View testID={testID} style={style} />
  }

  const aspectRatio = shell.canvasSize.width / shell.canvasSize.height

  return (
    <View
      testID={testID}
      style={[
        styles.root,
        {
          aspectRatio
        },
        style
      ]}
    >
      <Image
        testID={testID ? `${testID}-shell` : undefined}
        source={shell.asset.source}
        resizeMode="cover"
        style={styles.shell}
      />
      {renderItems.map((item) => (
        item.kind === "furniture" || item.kind === "avatar" ? (
          <RoomRendererItem
            key={item.renderId}
            item={item}
            isSelected={selectedInstanceId === item.renderId}
            onTap={onItemTap ? () => onItemTap(item) : undefined}
            debugPlacement={debugPlacement}
            testID={testID ? `${testID}-item-${item.renderId}` : undefined}
          />
        ) : null
      ))}
    </View>
  )
}

function RoomRendererItem(props: {
  item: RoomV2RenderItem
  isSelected?: boolean
  onTap?: () => void
  debugPlacement: boolean
  testID?: string
}) {
  const { item, isSelected, onTap, debugPlacement, testID } = props

  const left = item.x - item.width * item.anchor.x
  const top = item.y - item.height * item.anchor.y

  // If onTap is provided, we need to allow touches. Otherwise pass through.
  const pointerEvents = onTap ? "auto" : "none"

  const Wrapper = onTap ? Pressable : View

  return (
    <Wrapper
      onPress={onTap}
      testID={testID}
      pointerEvents={pointerEvents}
      style={[
        styles.item,
        {
          left: `${left * 100}%`,
          top: `${top * 100}%`,
          width: `${item.width * 100}%`,
          height: `${item.height * 100}%`
        }
      ]}
    >
      <View style={[styles.itemContent, isSelected ? styles.itemSelected : null]}>
      {item.kind === "avatar" ? (
        <RoomAvatarRenderer2D layers={item.layers} />
      ) : (
        <Image
          source={item.asset.source}
          resizeMode="contain"
          style={[
            styles.itemImage,
            { transform: [{ scaleX: item.rotation === 'left' || item.rotation === 'back' ? -1 : 1 }] }
          ]}
        />
      )}
      {debugPlacement ? (
        <>
          <View
            testID={testID ? `${testID}-debug-bounds` : undefined}
            style={styles.debugBounds}
          />
          <View
            testID={testID ? `${testID}-debug-anchor` : undefined}
            style={[
              styles.debugAnchor,
              {
                left: `${item.anchor.x * 100}%`,
                top: `${item.anchor.y * 100}%`
              }
            ]}
          />
          <Text
            testID={testID ? `${testID}-debug-label` : undefined}
            numberOfLines={1}
            style={styles.debugLabel}
          >
            {item.name || item.renderId}
          </Text>
        </>
      ) : null}
      </View>
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#110A12"
  },
  shell: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%"
  },
  item: {
    position: "absolute"
  },
  itemContent: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
    borderRadius: 8
  },
  itemSelected: {
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1.0,
    shadowRadius: 12,
    elevation: 8,
    opacity: 0.85
  },
  itemImage: {
    width: "100%",
    height: "100%"
  },
  debugBounds: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: "#00E5FF",
    backgroundColor: "rgba(0, 229, 255, 0.08)"
  },
  debugAnchor: {
    position: "absolute",
    width: 8,
    height: 8,
    marginLeft: -4,
    marginTop: -4,
    borderRadius: 4,
    backgroundColor: "#FFEF5A",
    borderWidth: 1,
    borderColor: "#110A12"
  },
  debugLabel: {
    position: "absolute",
    left: 0,
    top: -16,
    width: 76,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: "rgba(17, 10, 18, 0.82)",
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "800"
  }
})
