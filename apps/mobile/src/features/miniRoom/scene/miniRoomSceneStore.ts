import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { miniRoomAssets } from "./miniRoomAssets"
import { cozyPinkBedroomScene } from "./roomMaps"
import type {
  AvatarFacing,
  AvatarState,
  MiniRoomStore,
  RoomEmote,
  RoomHotspot,
  RoomPoint,
  RoomScene,
  SpeechBubble
} from "./miniRoomSceneTypes"

interface UseMiniRoomSceneStoreInput {
  localUser: {
    userId: string
    displayName: string
  }
  partnerUser: {
    userId: string
    displayName: string
  }
  scene?: RoomScene
}

const MIN_MOVEMENT_DURATION_MS = 260
const MAX_MOVEMENT_DURATION_MS = 820
const BUBBLE_LIFETIME_MS = 5_500
const EMOTE_LIFETIME_MS = 1_400
const PROXIMITY_CLOSE_DISTANCE = 0.18

function pointInPolygon(point: RoomPoint, polygon: RoomPoint[]): boolean {
  let inside = false
  for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current++) {
    const currentPoint = polygon[current]
    const previousPoint = polygon[previous]
    const crosses =
      currentPoint.y > point.y !== previousPoint.y > point.y &&
      point.x <
        ((previousPoint.x - currentPoint.x) * (point.y - currentPoint.y)) /
          (previousPoint.y - currentPoint.y) +
          currentPoint.x
    if (crosses) inside = !inside
  }
  return inside
}

function isWalkable(scene: RoomScene, point: RoomPoint): boolean {
  return scene.map.walkableAreas.some((area) => pointInPolygon(point, area.points))
}

function deriveFacing(from: RoomPoint, to: RoomPoint): AvatarFacing {
  const dx = to.x - from.x
  const dy = to.y - from.y
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx >= 0 ? "right" : "left"
  }
  return dy >= 0 ? "front" : "back"
}

function easeOutCubic(value: number): number {
  return 1 - Math.pow(1 - value, 3)
}

function createInitialAvatars(input: UseMiniRoomSceneStoreInput, scene: RoomScene): Record<string, AvatarState> {
  const localSpawn = scene.spawnPoints.find((point) => point.role === "local") ?? scene.spawnPoints[0]
  const partnerSpawn = scene.spawnPoints.find((point) => point.role === "partner") ?? scene.spawnPoints[1]

  return {
    [input.localUser.userId]: {
      userId: input.localUser.userId,
      displayName: input.localUser.displayName,
      x: localSpawn.x,
      y: localSpawn.y,
      facing: localSpawn.facing,
      motion: "idle",
      appearance: {
        base: "female_base_01",
        fullBodyAsset: miniRoomAssets.avatars.localGirl
      }
    },
    [input.partnerUser.userId]: {
      userId: input.partnerUser.userId,
      displayName: input.partnerUser.displayName,
      x: partnerSpawn.x,
      y: partnerSpawn.y,
      facing: partnerSpawn.facing,
      motion: "idle",
      appearance: {
        base: "male_base_01",
        fullBodyAsset: miniRoomAssets.avatars.partnerBoy
      }
    }
  }
}

interface MoveOptions {
  hotspot?: RoomHotspot
}

export function useMiniRoomSceneStore(input: UseMiniRoomSceneStoreInput): MiniRoomStore {
  const scene = input.scene ?? cozyPinkBedroomScene
  const [avatars, setAvatars] = useState<Record<string, AvatarState>>(() =>
    createInitialAvatars(input, scene)
  )
  const [bubbles, setBubbles] = useState<SpeechBubble[]>([])
  const [emotes, setEmotes] = useState<RoomEmote[]>([])
  const [pressedPoint, setPressedPoint] = useState<RoomPoint | undefined>()
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | undefined>()
  const animationFrameRef = useRef<number | null>(null)
  const emoteCounterRef = useRef(0)
  const bubbleCounterRef = useRef(0)

  useEffect(() => {
    setAvatars(createInitialAvatars(input, scene))
  }, [input.localUser.displayName, input.localUser.userId, input.partnerUser.displayName, input.partnerUser.userId, scene])

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (bubbles.length === 0 && emotes.length === 0) return

    const interval = setInterval(() => {
      const now = Date.now()
      setBubbles((current) => current.filter((bubble) => bubble.expiresAt > now))
      setEmotes((current) => current.filter((emote) => emote.expiresAt > now))
    }, 400)

    return () => clearInterval(interval)
  }, [bubbles.length, emotes.length])

  const runMovement = useCallback(
    (point: RoomPoint, options?: MoveOptions): boolean => {
      if (!isWalkable(scene, point)) return false
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      const localUserId = input.localUser.userId
      const startedAt = Date.now()
      let start: RoomPoint | null = null
      let durationMs = MAX_MOVEMENT_DURATION_MS

      setPressedPoint(point)
      setAvatars((current) => {
        const avatar = current[localUserId]
        if (!avatar) return current
        start = { x: avatar.x, y: avatar.y }
        const distance = Math.hypot(point.x - avatar.x, point.y - avatar.y)
        durationMs = Math.min(
          MAX_MOVEMENT_DURATION_MS,
          Math.max(MIN_MOVEMENT_DURATION_MS, distance * 1_900)
        )
        return {
          ...current,
          [localUserId]: {
            ...avatar,
            targetX: point.x,
            targetY: point.y,
            facing: deriveFacing(avatar, point),
            motion: "walking",
            seatedHotspotId: undefined
          }
        }
      })

      const tick = () => {
        if (!start) return
        const elapsed = Date.now() - startedAt
        const progress = Math.min(1, elapsed / durationMs)
        const eased = easeOutCubic(progress)
        const next = {
          x: start.x + (point.x - start.x) * eased,
          y: start.y + (point.y - start.y) * eased
        }

        setAvatars((current) => {
          const avatar = current[localUserId]
          if (!avatar) return current
          if (progress < 1) {
            return {
              ...current,
              [localUserId]: {
                ...avatar,
                x: next.x,
                y: next.y,
                motion: "walking",
                targetX: point.x,
                targetY: point.y
              }
            }
          }
          const arrivalFacing = options?.hotspot?.facingOnArrival ?? avatar.facing
          const arrivalMotion: AvatarState["motion"] =
            options?.hotspot?.kind === "seat" ? "sitting" : "idle"
          return {
            ...current,
            [localUserId]: {
              ...avatar,
              x: next.x,
              y: next.y,
              motion: arrivalMotion,
              facing: arrivalFacing,
              targetX: undefined,
              targetY: undefined,
              seatedHotspotId:
                options?.hotspot?.kind === "seat" ? options.hotspot.id : undefined
            }
          }
        })

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(tick)
        } else {
          animationFrameRef.current = null
          setTimeout(() => setPressedPoint(undefined), 180)
        }
      }

      animationFrameRef.current = requestAnimationFrame(tick)
      return true
    },
    [input.localUser.userId, scene]
  )

  const moveLocalAvatar = useCallback(
    (point: RoomPoint): boolean => {
      setSelectedHotspotId(undefined)
      return runMovement(point)
    },
    [runMovement]
  )

  const moveLocalAvatarToHotspot = useCallback(
    (hotspotId: string): boolean => {
      const hotspot = scene.hotspots.find((entry) => entry.id === hotspotId)
      if (!hotspot) return false
      const target = hotspot.approachPoint ?? { x: hotspot.x, y: hotspot.y }
      setSelectedHotspotId(hotspotId)
      return runMovement(target, { hotspot })
    },
    [runMovement, scene.hotspots]
  )

  const addSpeechBubble = useCallback<MiniRoomStore["addSpeechBubble"]>((bubble) => {
    const now = Date.now()
    const id = `bubble_${++bubbleCounterRef.current}_${now}`
    setBubbles((current) => [
      ...current.filter((entry) => entry.speakerUserId !== bubble.speakerUserId),
      {
        ...bubble,
        tone: bubble.tone ?? "chat",
        id,
        createdAt: now,
        expiresAt: now + BUBBLE_LIFETIME_MS
      }
    ])

    setAvatars((current) => {
      const avatar = current[bubble.speakerUserId]
      if (!avatar) return current
      if (avatar.motion === "sitting") return current
      return {
        ...current,
        [bubble.speakerUserId]: { ...avatar, motion: "speaking" }
      }
    })

    setTimeout(() => {
      setAvatars((current) => {
        const avatar = current[bubble.speakerUserId]
        if (!avatar || avatar.motion !== "speaking") return current
        return {
          ...current,
          [bubble.speakerUserId]: { ...avatar, motion: "idle" }
        }
      })
    }, 1200)
  }, [])

  const sayPhrase = useCallback<MiniRoomStore["sayPhrase"]>(
    (userId, body, tone = "chat") => {
      addSpeechBubble({ speakerUserId: userId, body, tone })
    },
    [addSpeechBubble]
  )

  const addEmote = useCallback((userId: string, reaction: RoomEmote["reaction"]) => {
    const now = Date.now()
    const id = `emote_${++emoteCounterRef.current}_${now}`
    setEmotes((current) => [
      ...current.filter((entry) => entry.userId !== userId),
      {
        id,
        userId,
        reaction,
        createdAt: now,
        expiresAt: now + EMOTE_LIFETIME_MS
      }
    ])
  }, [])

  const proximityClose = useMemo(() => {
    const list = Object.values(avatars)
    if (list.length < 2) return false
    const [a, b] = list
    return Math.hypot(a.x - b.x, a.y - b.y) <= PROXIMITY_CLOSE_DISTANCE
  }, [avatars])

  useEffect(() => {
    const list = Object.values(avatars)
    if (list.length < 2) return
    const [a, b] = list
    const dist = Math.hypot(a.x - b.x, a.y - b.y)
    if (dist > 0.12) return
    const aMoving = a.motion === "walking"
    const bMoving = b.motion === "walking"
    if (aMoving || bMoving) return

    const wantAFacing: AvatarFacing = deriveFacing(a, b)
    const wantBFacing: AvatarFacing = deriveFacing(b, a)
    const changeA = a.facing !== wantAFacing && a.motion !== "sitting"
    const changeB = b.facing !== wantBFacing && b.motion !== "sitting"
    if (!changeA && !changeB) return
    setAvatars((current) => {
      const nextA = current[a.userId]
      const nextB = current[b.userId]
      if (!nextA || !nextB) return current
      return {
        ...current,
        [a.userId]: changeA ? { ...nextA, facing: wantAFacing } : nextA,
        [b.userId]: changeB ? { ...nextB, facing: wantBFacing } : nextB
      }
    })
  }, [avatars])

  const interaction = useMemo(
    () => ({
      pressedPoint,
      selectedHotspotId,
      proximityClose
    }),
    [pressedPoint, proximityClose, selectedHotspotId]
  )

  return {
    scene,
    avatars,
    bubbles,
    emotes,
    interaction,
    moveLocalAvatar,
    moveLocalAvatarToHotspot,
    addSpeechBubble,
    sayPhrase,
    addEmote
  }
}
