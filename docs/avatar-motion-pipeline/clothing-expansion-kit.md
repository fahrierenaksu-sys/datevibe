# Motion v1 Clothing Expansion Kit

This kit defines the reusable rules for expanding the female default Motion v1
wardrobe from the completed docs-stage layer set. It is a docs-stage planning
surface only: runtime import, catalog wiring, app assets, durable state, and new
item generation remain out of scope until explicitly requested.

## Reference Stack

The approved overlay order for Motion v1 front-facing room avatar QA is:

1. `hairBack`
2. `base`
3. `face`
4. `top`
5. `bottom`
6. `shoes`
7. `hairFront`

Use this order for all full-stack contact sheets and zoom QA.

| Layer | Walking Front | Sitting Front |
| --- | --- | --- |
| `base` | `docs/avatar-motion-pipeline/room_avatar_base_female_v2_walking_front_strip.png` | `docs/avatar-motion-pipeline/room_avatar_base_female_v2_sitting_front_strip.png` |
| `face` | `docs/avatar-motion-pipeline/room_avatar_face_female_default_v2_walking_front_strip.png` | `docs/avatar-motion-pipeline/room_avatar_face_female_default_v2_sitting_front_strip.png` |
| `hairBack` | `docs/avatar-motion-pipeline/room_avatar_hair_female_blonde_long_back_v2_walking_front_strip.png` | `docs/avatar-motion-pipeline/room_avatar_hair_female_blonde_long_back_v2_sitting_front_strip.png` |
| `hairFront` | `docs/avatar-motion-pipeline/room_avatar_hair_female_blonde_long_front_v2_walking_front_strip.png` | `docs/avatar-motion-pipeline/room_avatar_hair_female_blonde_long_front_v2_sitting_front_strip.png` |
| `top` | `docs/avatar-motion-pipeline/room_avatar_top_female_default_v2_walking_front_strip.png` | `docs/avatar-motion-pipeline/room_avatar_top_female_default_v2_sitting_front_strip.png` |
| `bottom` | `docs/avatar-motion-pipeline/room_avatar_bottom_female_default_v2_walking_front_strip.png` | `docs/avatar-motion-pipeline/room_avatar_bottom_female_default_v2_sitting_front_strip.png` |
| `shoes` | `docs/avatar-motion-pipeline/room_avatar_shoes_female_default_v2_walking_front_strip.png` | `docs/avatar-motion-pipeline/room_avatar_shoes_female_default_v2_sitting_front_strip.png` |

## Required Coverage

| Item Type | Required Assets | Default Strategy |
| --- | --- | --- |
| `top` | `walking.front`, `sitting.front` | Usually one clean static torso seed can be copied into both poses after QA. |
| `bottom` | `walking.front`, `sitting.front` | Walking can often use a standing/walk seed; sitting usually needs a separate seated seed. |
| `shoes` | walking `f01`-`f04`, `sitting.front` | Walking needs frame-specific seeds; sitting needs a separate low-profile seated treatment. |
| `hairBack` | `walking.front`, `sitting.front` | Usually deterministic copy if the head anchor remains stable. |
| `hairFront` | `walking.front`, `sitting.front` | Usually deterministic copy if the head anchor remains stable. |
| `face` | `walking.front`, `sitting.front` | Usually deterministic copy if face position and expression stay fixed. |

`generated-candidates/` is scratch space for local QA. Do not stage it unless a
future task explicitly promotes a generated candidate.

## Safe Zones And Anchors

### Top

- Fit the torso from shoulder line through hem.
- Keep the neckline below the head and neck; it must not fight face or hair.
- Align sleeves and arm openings with the approved base shoulders and arms.
- Align the hem over the bottom layer without exposing awkward base-body areas.
- Reject old composed-avatar head, hair, face, skin, or contour artifacts.

### Bottom

- For walking, anchor around waist, hips, and upper thighs under the top hem.
- Preserve leg separation and avoid a flat sticker slab.
- For sitting, shape the garment to the lap and thigh volume.
- Sitting bottoms must not leave an open center gap that reads as broken.
- Do not force a standing skirt or shorts silhouette onto the seated pose.

### Shoes

- For walking, anchor each seed to the visible foot endpoint for that frame.
- Do not copy frame 01 shoes to frames 02-04 unless overlay QA proves the feet do
  not move.
- Shoes must be shoes-only pixels. Do not include leg, skin, or old foot pixels.
- For sitting, use only a low-profile visible shoe treatment where the seated
  foot or lower-end area supports it.
- Sitting shoes must not look like standing feet or legs pasted below the knees.

## QA Gates

### Technical QA

- PNG dimensions are exact:
  - static seeds and sitting strips: `256x384`
  - walking strips: `1024x384`, four `256x384` frames
- Files are RGBA with real alpha and transparent corners.
- No transparent RGB residue, checkerboard, background, shadow, labels, props, or
  UI pixels.
- Deterministic strips match approved seeds pixel-perfect where required.
- No blank frames or cropped visible pixels.
- No cross-layer contamination:
  - top contains no base, face, hair, bottom, or shoes pixels
  - bottom contains no base skin, face, hair, top, or shoes pixels
  - shoes contain no skin, leg, body, face, hair, top, or bottom pixels
  - hair and face layers remain layer-specific

### Visual QA

- Open and inspect full contact sheets before `PASS`, preserve, promote, or
  commit.
- Open and inspect zoom contact sheets for close fit, edges, color, and pose
  volume.
- Confirm the item looks worn by the character, not pasted onto the stack.
- Confirm color, shading, outline weight, and softness match the DateVibe cozy
  premium chibi style.
- Confirm no sticker look, detached side scraps, scale drift, style drift, crop,
  or inconsistent frame-to-frame style.

## Stop Rules

Stop immediately and do not preserve or promote when any of these are true:

- The source contains old composed-avatar artifacts.
- The item passes technical QA but fails visual QA.
- Sitting clothing looks pasted on, flat, detached, or cardboard-like.
- Bottom sitting leaves a broken-looking center gap or becomes a solid rectangle.
- Shoes include leg, skin, or old foot pixels.
- Shoes float, detach, or fail to follow walking foot endpoints.
- Frame 02-04 shoes are copied from frame 01 without visual proof that the foot
  endpoints are stable.
- Any layer leaks into face, hair, top, bottom, shoes, or unrelated body regions.

## Naming Convention

### Static Seeds

Use item slugs that are stable, lowercase, and underscore-separated.

General static seed:

```text
docs/avatar-motion-pipeline/static-seeds/avatar_room_{layer}_female_{item_slug}_aligned_clean_v{n}.png
```

Pose-specific bottom seeds:

```text
docs/avatar-motion-pipeline/static-seeds/avatar_room_bottom_female_{item_slug}_aligned_clean_walk_v{n}.png
docs/avatar-motion-pipeline/static-seeds/avatar_room_bottom_female_{item_slug}_aligned_clean_sit_v{n}.png
```

Frame-specific shoe seeds:

```text
docs/avatar-motion-pipeline/static-seeds/avatar_room_shoes_female_{item_slug}_aligned_clean_walk_f01_v{n}.png
docs/avatar-motion-pipeline/static-seeds/avatar_room_shoes_female_{item_slug}_aligned_clean_walk_f02_v{n}.png
docs/avatar-motion-pipeline/static-seeds/avatar_room_shoes_female_{item_slug}_aligned_clean_walk_f03_v{n}.png
docs/avatar-motion-pipeline/static-seeds/avatar_room_shoes_female_{item_slug}_aligned_clean_walk_f04_v{n}.png
docs/avatar-motion-pipeline/static-seeds/avatar_room_shoes_female_{item_slug}_aligned_clean_sit_v{n}.png
```

### Generated Candidates

General candidate:

```text
docs/avatar-motion-pipeline/generated-candidates/avatar_room_{layer}_female_{item_slug}_aligned_clean_candidate_v{n}.png
```

Frame-specific shoe candidates:

```text
docs/avatar-motion-pipeline/generated-candidates/avatar_room_shoes_female_{item_slug}_aligned_clean_walk_f01_candidate_v{n}.png
docs/avatar-motion-pipeline/generated-candidates/avatar_room_shoes_female_{item_slug}_aligned_clean_walk_f02_candidate_v{n}.png
docs/avatar-motion-pipeline/generated-candidates/avatar_room_shoes_female_{item_slug}_aligned_clean_walk_f03_candidate_v{n}.png
docs/avatar-motion-pipeline/generated-candidates/avatar_room_shoes_female_{item_slug}_aligned_clean_walk_f04_candidate_v{n}.png
docs/avatar-motion-pipeline/generated-candidates/avatar_room_shoes_female_{item_slug}_aligned_clean_sit_candidate_v{n}.png
```

### Docs-Stage Strips

Walking strip:

```text
docs/avatar-motion-pipeline/room_avatar_{layer}_female_{item_slug}_v2_walking_front_strip.png
```

Sitting strip:

```text
docs/avatar-motion-pipeline/room_avatar_{layer}_female_{item_slug}_v2_sitting_front_strip.png
```

## First Capsule Wardrobe

| Type | Slug | Style Direction |
| --- | --- | --- |
| top | `cream_basic_tee` | Soft cream tee, small rounded collar, short sleeves, subtle rose trim, quiet premium everyday look. |
| top | `lavender_cozy_sweater` | Lavender knit-style sweater, soft cuffs and hem, cozy pastel DateVibe palette. |
| bottom | `denim_skort_shorts` | Soft blue denim skort or shorts, chibi-safe rounded hems, gentle seams, no harsh slab silhouette. |
| bottom | `cream_soft_shorts` | Warm cream lounge shorts, subtle pink trim, seated variant shaped to lap and thigh volume. |
| shoes | `white_sneakers` | Rounded white sneakers with pink accents, frame-specific walking fit, no leg or skin pixels. |
| shoes | `pink_flats_slippers` | Low-profile rose flats or slippers, especially suitable for seated pose visibility. |

## Recommended Next Action

Commit this kit as the workflow contract before generating additional wardrobe
assets. After that, generate the first additional top seed:

```text
docs/avatar-motion-pipeline/generated-candidates/avatar_room_top_female_cream_basic_tee_aligned_clean_candidate_v1.png
```

Use the approved stack references above for overlay QA, and do not proceed to
walk/sit strips until the clean top seed passes both technical and visual QA.
