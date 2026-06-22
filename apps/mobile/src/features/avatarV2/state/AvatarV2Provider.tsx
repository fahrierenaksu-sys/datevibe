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
import {
  AVATAR_V2_CATALOG,
  DEFAULT_AVATAR_V2
} from "../avatarV2.mock"
import { useInventoryStore } from "../../inventory/inventoryStore"
import {
  canEquipAvatarV2Item,
  equipAvatarV2Item,
  resolveAvatarV2
} from "../avatarV2Selectors"
import {
  createAvatarQaInventory,
  isAvatarQaUnlockEnabled
} from "../qa/avatarQaInventory"
import type {
  AvatarCatalogItem,
  AvatarInventory,
  UserAvatar
} from "../avatarV2.types"

export const AVATAR_V2_STORAGE_KEY = "@datevibe/avatar_v2/user_avatar"

interface AvatarV2ContextValue {
  avatar: UserAvatar
  catalog: AvatarCatalogItem[]
  inventory: AvatarInventory
  canEquipItem: (item: AvatarCatalogItem) => boolean
  equipItem: (item: AvatarCatalogItem) => boolean
}

const AvatarV2Context = createContext<AvatarV2ContextValue | null>(null)

const AVATAR_QA_UNLOCK_ENABLED = isAvatarQaUnlockEnabled(
  __DEV__,
  process.env.EXPO_PUBLIC_DATEVIBE_QA_UNLOCK_AVATAR_ITEMS
)

interface AvatarV2ProviderProps {
  children: ReactNode
}

export function AvatarV2Provider({ children }: AvatarV2ProviderProps) {
  const localInventory = useInventoryStore()
  const [avatar, setAvatar] = useState<UserAvatar>(() =>
    resolveAvatarV2(DEFAULT_AVATAR_V2, AVATAR_V2_CATALOG)
  )
  const [hasHydratedPersistedAvatar, setHasHydratedPersistedAvatar] = useState(false)

  useEffect(() => {
    let mounted = true

    AsyncStorage.getItem(AVATAR_V2_STORAGE_KEY)
      .then((rawValue) => {
        if (!mounted) return
        const storedAvatar = parseStoredAvatarV2(rawValue, AVATAR_V2_CATALOG)
        if (storedAvatar) {
          setAvatar(storedAvatar)
        }
      })
      .catch(() => {
        // Avatar customization remains usable with the built-in default.
      })
      .finally(() => {
        if (mounted) {
          setHasHydratedPersistedAvatar(true)
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!hasHydratedPersistedAvatar) return
    // Disposable regression QA must never overwrite the user's saved avatar.
    // The env flag is also guarded by __DEV__ above, so production builds
    // always retain the normal persistence and inventory behavior.
    if (AVATAR_QA_UNLOCK_ENABLED) return
    void AsyncStorage.setItem(
      AVATAR_V2_STORAGE_KEY,
      JSON.stringify(avatar)
    ).catch(() => {
      // Keep wardrobe interactions responsive if local persistence fails.
    })
  }, [avatar, hasHydratedPersistedAvatar])

  const avatarInventory = useMemo<AvatarInventory>(
    () => createAvatarQaInventory(
      localInventory.inventory.ownedAvatarItemIds,
      AVATAR_QA_UNLOCK_ENABLED
    ),
    [localInventory.inventory.ownedAvatarItemIds]
  )

  const canEquipItem = useCallback((item: AvatarCatalogItem): boolean => {
    return canEquipAvatarV2Item(avatarInventory, item)
  }, [avatarInventory])

  const equipItem = useCallback(
    (item: AvatarCatalogItem): boolean => {
      if (!canEquipItem(item)) return false
      setAvatar((current) => equipAvatarV2Item(current, item))
      return true
    },
    [canEquipItem]
  )

  const value = useMemo<AvatarV2ContextValue>(
    () => ({
      avatar,
      catalog: AVATAR_V2_CATALOG,
      inventory: avatarInventory,
      canEquipItem,
      equipItem
    }),
    [avatar, avatarInventory, canEquipItem, equipItem]
  )

  return (
    <AvatarV2Context.Provider value={value}>
      {children}
    </AvatarV2Context.Provider>
  )
}

export function useAvatarV2(): AvatarV2ContextValue {
  const context = useContext(AvatarV2Context)
  if (!context) {
    throw new Error("useAvatarV2 must be used within AvatarV2Provider")
  }
  return context
}

export function parseStoredAvatarV2(
  rawValue: string | null,
  catalog: AvatarCatalogItem[] = AVATAR_V2_CATALOG
): UserAvatar | null {
  if (!rawValue) return null

  try {
    const parsed = JSON.parse(rawValue) as Partial<UserAvatar>
    if (!isStoredAvatarCandidate(parsed)) {
      return null
    }
    return resolveAvatarV2({
      bodyId: parsed.bodyId,
      faceId: parsed.faceId,
      hairId: parsed.hairId,
      topId: parsed.topId,
      bottomId: parsed.bottomId,
      shoesId: parsed.shoesId,
      accessoryIds: Array.isArray(parsed.accessoryIds)
        ? parsed.accessoryIds.filter((id): id is string => typeof id === "string")
        : []
    }, catalog)
  } catch {
    return null
  }
}

function isStoredAvatarCandidate(value: unknown): value is Partial<UserAvatar> {
  if (!value || typeof value !== "object") return false
  const avatar = value as Partial<UserAvatar>
  return (
    typeof avatar.bodyId === "string" &&
    typeof avatar.faceId === "string" &&
    typeof avatar.hairId === "string" &&
    typeof avatar.topId === "string" &&
    typeof avatar.bottomId === "string" &&
    typeof avatar.shoesId === "string"
  )
}
