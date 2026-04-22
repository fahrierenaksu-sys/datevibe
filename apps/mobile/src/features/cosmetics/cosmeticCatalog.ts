/**
 * Avatar Cosmetics — data model for purchasable/unlockable avatar items.
 *
 * Categories:
 * - hats: worn on top of the avatar head
 * - frames: decorative ring around the avatar
 * - effects: particle/glow effects behind the avatar
 * - expressions: additional eye/mouth variants
 *
 * Rarity determines visual flair and price tier.
 */

export type CosmeticCategory = "hat" | "frame" | "effect" | "expression"
export type CosmeticRarity = "common" | "rare" | "epic" | "legendary"

export interface AvatarCosmetic {
  id: string
  name: string
  category: CosmeticCategory
  rarity: CosmeticRarity
  glyph: string // emoji or unicode symbol used as placeholder
  description: string
  priceCoins: number
  unlocked: boolean
}

export interface CosmeticEquipState {
  hat: string | null
  frame: string | null
  effect: string | null
  expression: string | null
}

// ── Starter catalog ─────────────────────────────────────────

export const COSMETIC_CATALOG: AvatarCosmetic[] = [
  // Hats
  { id: "hat_crown", name: "Crown", category: "hat", rarity: "epic", glyph: "👑", description: "Rule the lobby", priceCoins: 500, unlocked: false },
  { id: "hat_beret", name: "Beret", category: "hat", rarity: "common", glyph: "🎨", description: "Artsy vibes", priceCoins: 100, unlocked: false },
  { id: "hat_beanie", name: "Beanie", category: "hat", rarity: "common", glyph: "🧶", description: "Cozy energy", priceCoins: 100, unlocked: true },
  { id: "hat_flower", name: "Flower Crown", category: "hat", rarity: "rare", glyph: "🌸", description: "Soft bloom", priceCoins: 250, unlocked: false },
  { id: "hat_halo", name: "Halo", category: "hat", rarity: "legendary", glyph: "😇", description: "Angel mode", priceCoins: 1000, unlocked: false },

  // Frames
  { id: "frame_gold", name: "Gold Ring", category: "frame", rarity: "epic", glyph: "💛", description: "Premium presence", priceCoins: 600, unlocked: false },
  { id: "frame_hearts", name: "Heart Frame", category: "frame", rarity: "rare", glyph: "💕", description: "Love aura", priceCoins: 300, unlocked: false },
  { id: "frame_spark", name: "Spark Ring", category: "frame", rarity: "common", glyph: "✨", description: "Subtle sparkle", priceCoins: 120, unlocked: true },
  { id: "frame_neon", name: "Neon Glow", category: "frame", rarity: "rare", glyph: "💜", description: "Night energy", priceCoins: 350, unlocked: false },

  // Effects
  { id: "fx_confetti", name: "Confetti", category: "effect", rarity: "rare", glyph: "🎉", description: "Party follows you", priceCoins: 400, unlocked: false },
  { id: "fx_fireflies", name: "Fireflies", category: "effect", rarity: "epic", glyph: "🌟", description: "Enchanted glow", priceCoins: 550, unlocked: false },
  { id: "fx_bubbles", name: "Bubbles", category: "effect", rarity: "common", glyph: "🫧", description: "Light and airy", priceCoins: 150, unlocked: true },

  // Expressions
  { id: "exp_wink", name: "Wink", category: "expression", rarity: "common", glyph: "😉", description: "Playful look", priceCoins: 80, unlocked: true },
  { id: "exp_hearts_eyes", name: "Heart Eyes", category: "expression", rarity: "rare", glyph: "😍", description: "Love at first sight", priceCoins: 200, unlocked: false },
  { id: "exp_starry", name: "Starry Gaze", category: "expression", rarity: "epic", glyph: "🤩", description: "Starstruck", priceCoins: 450, unlocked: false }
]

export const DEFAULT_EQUIP_STATE: CosmeticEquipState = {
  hat: null,
  frame: null,
  effect: null,
  expression: null
}

export const RARITY_COLORS: Record<CosmeticRarity, string> = {
  common: "#A0A4B0",
  rare: "#60A5FA",
  epic: "#C084FC",
  legendary: "#FACC15"
}

export function getCosmeticsByCategory(category: CosmeticCategory): AvatarCosmetic[] {
  return COSMETIC_CATALOG.filter((c) => c.category === category)
}

/** Frame ring color overrides when equipped */
export const FRAME_COLORS: Record<string, string> = {
  frame_gold: "#D4A017",
  frame_hearts: "#E8607A",
  frame_spark: "#C084FC",
  frame_neon: "#7C3AED"
}
