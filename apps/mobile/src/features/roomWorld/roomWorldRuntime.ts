import {
  deriveRoomWorldFacing,
  isRoomWorldPointWalkable,
  projectRoomWorldPointToPolygon,
  resolveRoomWorldPath,
  type RoomWorldFacing,
  type RoomWorldGeometry,
  type RoomWorldPath,
  type RoomWorldPoint
} from "./roomWorldGeometry"

export const ROOM_WORLD_AVATAR_COLLISION_CLEARANCE = 0.012
export const ROOM_WORLD_AVATAR_PERSONAL_SPACE_RADIUS = 0.058

export interface RoomWorldMovementTiming {
  minDurationMs: number
  maxDurationMs: number
  durationPerDistanceMs: number
}

export const ROOM_WORLD_MY_ROOM_MOVEMENT_TIMING: RoomWorldMovementTiming = {
  minDurationMs: 240,
  maxDurationMs: 760,
  durationPerDistanceMs: 1_800
}

export const ROOM_WORLD_MINI_ROOM_MOVEMENT_TIMING: RoomWorldMovementTiming = {
  minDurationMs: 260,
  maxDurationMs: 820,
  durationPerDistanceMs: 1_900
}

export interface RoomWorldMovementSegment {
  from: RoomWorldPoint
  to: RoomWorldPoint
  facing: RoomWorldFacing
  distance: number
  durationMs: number
  isFinal: boolean
}

export interface RoomWorldMovementPlan {
  target: RoomWorldPoint
  path: RoomWorldPath
  segments: RoomWorldMovementSegment[]
}

export interface RoomWorldMovementFrame {
  x: number
  y: number
  facing: RoomWorldFacing
  progress: number
  isComplete: boolean
}

export type RoomWorldAvatarRuntimeMotion =
  | "idle"
  | "walking"
  | "sitting"

export interface RoomWorldAvatarRuntimePose extends RoomWorldPoint {
  facing: RoomWorldFacing
  motion: RoomWorldAvatarRuntimeMotion
}

export interface RoomWorldOccupant extends RoomWorldPoint {
  id: string
  radius?: number
  blocksMovement?: boolean
}

export interface RoomWorldOccupancyOptions {
  movingOccupantId?: string
  radius?: number
}

export function createRoomWorldMovementPlan(input: {
  geometry: RoomWorldGeometry
  from: RoomWorldPoint
  to: RoomWorldPoint
  clearance?: number
  timing: RoomWorldMovementTiming
  occupants?: RoomWorldOccupant[]
  movingOccupantId?: string
}): RoomWorldMovementPlan | null {
  const geometry = addRoomWorldOccupantBlockers({
    geometry: input.geometry,
    occupants: input.occupants,
    movingOccupantId: input.movingOccupantId
  })
  const path = resolveRoomWorldPath({
    geometry,
    from: input.from,
    to: input.to,
    clearance: input.clearance ?? ROOM_WORLD_AVATAR_COLLISION_CLEARANCE
  })
  if (!path) return null

  let segmentStart = input.from
  const segments = path.map((segmentTarget, index): RoomWorldMovementSegment => {
    const distance = getRoomWorldDistance(segmentStart, segmentTarget)
    const segment = {
      from: segmentStart,
      to: segmentTarget,
      facing: deriveRoomWorldFacing(segmentStart, segmentTarget),
      distance,
      durationMs: getRoomWorldMovementDuration(distance, input.timing),
      isFinal: index === path.length - 1
    }
    segmentStart = segmentTarget
    return segment
  })

  return {
    target: input.to,
    path,
    segments
  }
}

export function resolveRoomWorldUnoccupiedTarget(input: {
  geometry: RoomWorldGeometry
  target: RoomWorldPoint
  occupants?: RoomWorldOccupant[]
  movingOccupantId?: string
  clearance?: number
  radius?: number
}): RoomWorldPoint | null {
  const clearance = input.clearance ?? ROOM_WORLD_AVATAR_COLLISION_CLEARANCE
  const radius = input.radius ?? ROOM_WORLD_AVATAR_PERSONAL_SPACE_RADIUS
  const occupantGeometry = addRoomWorldOccupantBlockers({
    geometry: input.geometry,
    occupants: input.occupants,
    movingOccupantId: input.movingOccupantId,
    radius
  })

  if (
    resolveRoomWorldPath({
      geometry: occupantGeometry,
      from: input.target,
      to: input.target,
      clearance
    })
  ) {
    return input.target
  }

  const candidates = createRoomWorldTargetRing(input.target, radius + clearance)
  const validCandidates = candidates
    .filter((candidate) =>
      resolveRoomWorldPath({
        geometry: occupantGeometry,
        from: candidate,
        to: candidate,
        clearance
      })
    )
    .sort((a, b) =>
      Math.hypot(a.x - input.target.x, a.y - input.target.y) -
      Math.hypot(b.x - input.target.x, b.y - input.target.y)
    )

  return validCandidates[0] ?? null
}

export function resolveRoomWorldInteractiveTarget(input: {
  geometry: RoomWorldGeometry
  target: RoomWorldPoint
  occupants?: RoomWorldOccupant[]
  movingOccupantId?: string
  clearance?: number
  radius?: number
}): RoomWorldPoint | null {
  const clearance = input.clearance ?? ROOM_WORLD_AVATAR_COLLISION_CLEARANCE
  const walkableTarget = resolveRoomWorldNearestWalkableTarget({
    geometry: input.geometry,
    target: input.target,
    clearance
  })
  if (!walkableTarget) return null

  return resolveRoomWorldUnoccupiedTarget({
    ...input,
    target: walkableTarget,
    clearance
  })
}

export function isRoomWorldTargetOccupied(input: {
  target: RoomWorldPoint
  occupants?: RoomWorldOccupant[]
  movingOccupantId?: string
  radius?: number
}): boolean {
  const radius = input.radius ?? ROOM_WORLD_AVATAR_PERSONAL_SPACE_RADIUS
  return (input.occupants ?? []).some((occupant) => {
    if (occupant.blocksMovement === false) return false
    if (occupant.id === input.movingOccupantId) return false
    const occupantRadius = occupant.radius ?? radius
    return Math.hypot(occupant.x - input.target.x, occupant.y - input.target.y) <
      occupantRadius + radius
  })
}

export function getRoomWorldMovementFrame(input: {
  segment: RoomWorldMovementSegment
  startedAt: number
  now: number
}): RoomWorldMovementFrame {
  const progress = Math.min(
    1,
    Math.max(0, (input.now - input.startedAt) / input.segment.durationMs)
  )
  const eased = easeOutRoomWorldMovement(progress)
  return {
    x: input.segment.from.x + (input.segment.to.x - input.segment.from.x) * eased,
    y: input.segment.from.y + (input.segment.to.y - input.segment.from.y) * eased,
    facing: input.segment.facing,
    progress,
    isComplete: progress >= 1
  }
}

export function getRoomWorldMovementSegmentStartPose(
  segment: RoomWorldMovementSegment
): RoomWorldAvatarRuntimePose {
  return {
    ...segment.from,
    facing: segment.facing,
    motion: "walking"
  }
}

export function getRoomWorldMovementFramePose(input: {
  frame: RoomWorldMovementFrame
  segment: RoomWorldMovementSegment
  arrival?: {
    facing?: RoomWorldFacing
    motion?: RoomWorldAvatarRuntimeMotion
  }
}): RoomWorldAvatarRuntimePose {
  if (!input.frame.isComplete || !input.segment.isFinal) {
    return {
      x: input.frame.x,
      y: input.frame.y,
      facing: input.frame.facing,
      motion: "walking"
    }
  }

  return {
    x: input.frame.x,
    y: input.frame.y,
    facing: input.arrival?.facing ?? input.frame.facing,
    motion: input.arrival?.motion ?? "idle"
  }
}

export function easeOutRoomWorldMovement(value: number): number {
  return 1 - Math.pow(1 - value, 3)
}

function resolveRoomWorldNearestWalkableTarget(input: {
  geometry: RoomWorldGeometry
  target: RoomWorldPoint
  clearance: number
}): RoomWorldPoint | null {
  if (
    isRoomWorldPointWalkable(input.geometry, input.target, {
      clearance: input.clearance
    })
  ) {
    return input.target
  }

  const projectedCandidates = input.geometry.walkableAreas.flatMap((area) => {
    const projected = projectRoomWorldPointToPolygon(input.target, area.points)
    return [
      projected,
      ...createRoomWorldTargetRing(projected, input.clearance + 0.025),
      ...createRoomWorldTargetRing(projected, input.clearance + 0.05)
    ]
  })

  const validCandidates = uniqueRoomWorldRuntimePoints(projectedCandidates)
    .filter((candidate) =>
      isRoomWorldPointWalkable(input.geometry, candidate, {
        clearance: input.clearance
      })
    )
    .sort((a, b) =>
      Math.hypot(a.x - input.target.x, a.y - input.target.y) -
      Math.hypot(b.x - input.target.x, b.y - input.target.y)
    )

  return validCandidates[0] ?? null
}

function getRoomWorldMovementDuration(
  distance: number,
  timing: RoomWorldMovementTiming
): number {
  return Math.min(
    timing.maxDurationMs,
    Math.max(timing.minDurationMs, distance * timing.durationPerDistanceMs)
  )
}

function getRoomWorldDistance(
  from: RoomWorldPoint,
  to: RoomWorldPoint
): number {
  return Math.hypot(to.x - from.x, to.y - from.y)
}

function addRoomWorldOccupantBlockers(input: {
  geometry: RoomWorldGeometry
  occupants?: RoomWorldOccupant[]
  movingOccupantId?: string
  radius?: number
}): RoomWorldGeometry {
  const radius = input.radius ?? ROOM_WORLD_AVATAR_PERSONAL_SPACE_RADIUS
  const occupantBlockers = (input.occupants ?? [])
    .filter((occupant) =>
      occupant.id !== input.movingOccupantId &&
      occupant.blocksMovement !== false
    )
    .map((occupant) => {
      const occupantRadius = occupant.radius ?? radius
      return {
        id: `room_world_occupant_${occupant.id}`,
        x: occupant.x,
        y: occupant.y,
        width: occupantRadius * 2,
        height: occupantRadius * 1.45,
        anchor: { x: 0.5, y: 0.66 },
        blocksMovement: true
      }
    })

  if (!occupantBlockers.length) return input.geometry
  return {
    ...input.geometry,
    blockers: [
      ...(input.geometry.blockers ?? []),
      ...occupantBlockers
    ]
  }
}

function createRoomWorldTargetRing(
  target: RoomWorldPoint,
  radius: number
): RoomWorldPoint[] {
  return [
    { x: target.x + radius, y: target.y },
    { x: target.x - radius, y: target.y },
    { x: target.x, y: target.y + radius },
    { x: target.x, y: target.y - radius },
    { x: target.x + radius * 0.72, y: target.y + radius * 0.72 },
    { x: target.x - radius * 0.72, y: target.y + radius * 0.72 },
    { x: target.x + radius * 0.72, y: target.y - radius * 0.72 },
    { x: target.x - radius * 0.72, y: target.y - radius * 0.72 }
  ].map((point) => ({
    x: Math.max(0, Math.min(1, point.x)),
    y: Math.max(0, Math.min(1, point.y))
  }))
}

function uniqueRoomWorldRuntimePoints(points: RoomWorldPoint[]): RoomWorldPoint[] {
  const seen = new Set<string>()
  return points.filter((point) => {
    const key = `${point.x.toFixed(3)}:${point.y.toFixed(3)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
