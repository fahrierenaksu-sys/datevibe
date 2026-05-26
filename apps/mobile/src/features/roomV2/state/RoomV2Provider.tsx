import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { MOCK_USER_ROOM_V2_DECOR } from "../roomV2.mock"
import type {
  PlacedRoomItem,
  UserRoomDecor
} from "../roomV2.types"

export const ROOM_V2_DECOR_STORAGE_KEY = "@datevibe/room_v2/user_room_decor"

interface RoomV2ContextValue {
  userRoomDecor: UserRoomDecor
  setUserRoomDecor: (nextDecor: UserRoomDecor) => void
  resetRoomDecor: () => void
  addPlacedItem: (item: PlacedRoomItem) => void
  updatePlacedItem: (
    instanceId: string,
    patch: Partial<PlacedRoomItem>
  ) => void
  removePlacedItem: (instanceId: string) => void
}

const RoomV2Context = createContext<RoomV2ContextValue | null>(null)

interface RoomV2ProviderProps {
  children: ReactNode
}

export function RoomV2Provider({ children }: RoomV2ProviderProps) {
  const [userRoomDecor, setUserRoomDecorState] = useState<UserRoomDecor>(
    createDefaultRoomV2Decor
  )
  const [hasHydratedPersistedDecor, setHasHydratedPersistedDecor] = useState(false)

  useEffect(() => {
    let mounted = true

    AsyncStorage.getItem(ROOM_V2_DECOR_STORAGE_KEY)
      .then((rawValue) => {
        if (!mounted) return
        const storedDecor = parseStoredRoomV2Decor(rawValue)
        if (storedDecor) {
          setUserRoomDecorState(storedDecor)
        }
      })
      .catch(() => {
        // Persistence is best-effort; the default mock room remains usable.
      })
      .finally(() => {
        if (mounted) {
          setHasHydratedPersistedDecor(true)
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!hasHydratedPersistedDecor) return
    void AsyncStorage.setItem(
      ROOM_V2_DECOR_STORAGE_KEY,
      JSON.stringify(userRoomDecor)
    ).catch(() => {
      // Keep room editing responsive even if local persistence fails.
    })
  }, [hasHydratedPersistedDecor, userRoomDecor])

  const setUserRoomDecor = useCallback((nextDecor: UserRoomDecor): void => {
    setUserRoomDecorState(copyRoomV2Decor(nextDecor))
  }, [])

  const resetRoomDecor = useCallback((): void => {
    setUserRoomDecorState(createDefaultRoomV2Decor())
  }, [])

  const addPlacedItem = useCallback((item: PlacedRoomItem): void => {
    setUserRoomDecorState((current) =>
      appendRoomV2PlacedItem(current, item)
    )
  }, [])

  const updatePlacedItem = useCallback(
    (instanceId: string, patch: Partial<PlacedRoomItem>): void => {
      setUserRoomDecorState((current) =>
        patchRoomV2PlacedItem(current, instanceId, patch)
      )
    },
    []
  )

  const removePlacedItem = useCallback((instanceId: string): void => {
    setUserRoomDecorState((current) =>
      removeRoomV2PlacedItem(current, instanceId)
    )
  }, [])

  const value = useMemo<RoomV2ContextValue>(
    () => ({
      userRoomDecor,
      setUserRoomDecor,
      resetRoomDecor,
      addPlacedItem,
      updatePlacedItem,
      removePlacedItem
    }),
    [userRoomDecor, setUserRoomDecor, resetRoomDecor, addPlacedItem, updatePlacedItem, removePlacedItem]
  )

  return (
    <RoomV2Context.Provider value={value}>
      {children}
    </RoomV2Context.Provider>
  )
}

export function useRoomV2(): RoomV2ContextValue {
  const context = useContext(RoomV2Context)
  if (!context) {
    throw new Error("useRoomV2 must be used within RoomV2Provider")
  }
  return context
}

export function createDefaultRoomV2Decor(): UserRoomDecor {
  return copyRoomV2Decor(MOCK_USER_ROOM_V2_DECOR)
}

export function copyRoomV2Decor(decor: UserRoomDecor): UserRoomDecor {
  return {
    ...decor,
    placedItems: Array.isArray(decor.placedItems)
      ? decor.placedItems.map((item) => ({ ...item }))
      : []
  }
}

export function parseStoredRoomV2Decor(rawValue: string | null): UserRoomDecor | null {
  if (!rawValue) return null

  try {
    const parsed = JSON.parse(rawValue) as Partial<UserRoomDecor>
    if (!parsed || typeof parsed.roomShellId !== "string") {
      return null
    }
    return copyRoomV2Decor({
      roomShellId: parsed.roomShellId,
      placedItems: Array.isArray(parsed.placedItems)
        ? parsed.placedItems.filter(isStoredPlacedRoomItem)
        : []
    })
  } catch {
    return null
  }
}

function isStoredPlacedRoomItem(item: unknown): item is PlacedRoomItem {
  if (!item || typeof item !== "object") return false
  const placed = item as Partial<PlacedRoomItem>
  return (
    typeof placed.instanceId === "string" &&
    typeof placed.itemId === "string" &&
    typeof placed.x === "number" &&
    typeof placed.y === "number" &&
    (
      placed.rotation === "front" ||
      placed.rotation === "back" ||
      placed.rotation === "left" ||
      placed.rotation === "right"
    )
  )
}

export function patchRoomV2PlacedItem(
  decor: UserRoomDecor,
  instanceId: string,
  patch: Partial<PlacedRoomItem>
): UserRoomDecor {
  let didUpdate = false
  const placedItems = decor.placedItems.map((item) => {
    if (item.instanceId !== instanceId) return { ...item }
    didUpdate = true
    return {
      ...item,
      ...patch,
      instanceId: item.instanceId
    }
  })

  if (!didUpdate) {
    return copyRoomV2Decor(decor)
  }

  return {
    ...decor,
    placedItems
  }
}

export function appendRoomV2PlacedItem(
  decor: UserRoomDecor,
  item: PlacedRoomItem
): UserRoomDecor {
  return {
    ...decor,
    placedItems: [
      ...decor.placedItems.map((placedItem) => ({ ...placedItem })),
      { ...item }
    ]
  }
}

export function removeRoomV2PlacedItem(
  decor: UserRoomDecor,
  instanceId: string
): UserRoomDecor {
  return {
    ...decor,
    placedItems: decor.placedItems.filter((item) => item.instanceId !== instanceId)
  }
}
