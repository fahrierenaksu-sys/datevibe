# DateVibe Room Avatar Motion Production Prompts

Generated from `room-avatar-motion-missing-assets.json`.
These prompts are production requests only; generated strips must pass the verifier and extraction guards before catalog import.

## 1. female Walk front - Female Room Base

- Layer type: `base`
- Fit profile: `datevibe_female_room_avatar_v1`
- Seed: `apps/mobile/src/features/avatarV2/assets/room/avatar_room_base_female_v2.png`
- Edit canvas: `docs/avatar-motion-pipeline/room_avatar_base_female_v2_walking_front_strip.png`
- Expected strip: `room_avatar_base_female_v2_walking_front_strip.png`
- Catalog slot: `assetsByMotion.walking.front`
- Frame duration: `120ms`
- Playback: `looping`
- Motion driver: `Female Room Base`
- Output frames:
  - `room_avatar_base_female_v2_walking_front_f01.png`
  - `room_avatar_base_female_v2_walking_front_f02.png`
  - `room_avatar_base_female_v2_walking_front_f03.png`
  - `room_avatar_base_female_v2_walking_front_f04.png`

Prompt:

```text
Edit the provided transparent DateVibe room-avatar reference canvas into one horizontal 4-frame spritesheet.

Preserve the approved seed layer in slot 01 exactly:
- same 2.5D layered rig: datevibe_2_5d_layered_v1
- same body preset: female
- same layer type: base
- same layer identity: Female Room Base
- same fit profile: datevibe_female_room_avatar_v1
- same facing direction: front
- same silhouette family, palette family, proportions, baseline, and centerline
- transparent background

Motion fit contract:
- Fit role: `motionDriver`; this base/body strip defines the motion mask for the same body preset.
- Generate this before fitted clothing, hair, face, and shoe layers.

Canvas contract:
- exactly one row
- exactly 4 equal 256x384 frame slots
- final strip size 1024x384
- frame duration metadata 120ms
- playback looping
- no extra characters, labels, scenery, props, UI, poster layout, or background

Action:
- define the female base body motion mask for a subtle premium front-facing walk
- keep the avatar grounded with consistent feet contact near baseline y=360
- keep the body centered around centerline x=128 without side-to-side sliding
- make frames 2-4 visibly different from frame 01 but not exaggerated or cartoony
- frame 01 must match the shipped seed frame exactly
- remaining frames must preserve the same body rig, baseline, centerline, proportions, and feet contact
- keep the result production mobile avatar art, not concept art

Import gate:
- do not crop or resize frames
- do not flatten onto a background
- do not change frame 01
- do not merge this layer with another avatar layer
- do not change the shared feet baseline or centerline
- animated motions must visibly change after frame 01
```

## 2. female Walk front - Blonde Waves Back

- Layer type: `hairBack`
- Fit profile: `datevibe_female_room_avatar_v1`
- Seed: `apps/mobile/src/features/avatarV2/assets/room/avatar_room_hair_female_blonde_long_back_v2.png`
- Edit canvas: `docs/avatar-motion-pipeline/room_avatar_hair_female_blonde_long_back_v2_walking_front_strip.png`
- Expected strip: `room_avatar_hair_female_blonde_long_back_v2_walking_front_strip.png`
- Catalog slot: `assetsByMotion.walking.front`
- Frame duration: `120ms`
- Playback: `looping`
- Motion driver: `Female Room Base`
- Output frames:
  - `room_avatar_hair_female_blonde_long_back_v2_walking_front_f01.png`
  - `room_avatar_hair_female_blonde_long_back_v2_walking_front_f02.png`
  - `room_avatar_hair_female_blonde_long_back_v2_walking_front_f03.png`
  - `room_avatar_hair_female_blonde_long_back_v2_walking_front_f04.png`

Prompt:

```text
Edit the provided transparent DateVibe room-avatar reference canvas into one horizontal 4-frame spritesheet.

Preserve the approved seed layer in slot 01 exactly:
- same 2.5D layered rig: datevibe_2_5d_layered_v1
- same body preset: female
- same layer type: hairBack
- same layer identity: Blonde Waves Back
- same fit profile: datevibe_female_room_avatar_v1
- same facing direction: front
- same silhouette family, palette family, proportions, baseline, and centerline
- transparent background

Motion fit contract:
- Fit role: `fittedLayer`; fit this layer to motion driver `Female Room Base`.
- Motion driver reference strip: `docs/avatar-motion-pipeline/room_avatar_base_female_v2_walking_front_strip.png`.
- Keep every generated frame aligned to the driver's baseline, centerline, frame count, and body silhouette.

Canvas contract:
- exactly one row
- exactly 4 equal 256x384 frame slots
- final strip size 1024x384
- frame duration metadata 120ms
- playback looping
- no extra characters, labels, scenery, props, UI, poster layout, or background

Action:
- create Walk front for this single fitted layer only
- use `Female Room Base` as the motion/pose reference when available
- frame 01 must match the shipped seed frame exactly
- remaining frames must follow the body driver pose without adding body pixels, backgrounds, or merged clothing
- keep the result production mobile avatar art, not concept art

Import gate:
- do not crop or resize frames
- do not flatten onto a background
- do not change frame 01
- do not merge this layer with another avatar layer
- do not change the shared feet baseline or centerline
- animated motions must visibly change after frame 01
```

## 3. female Walk front - Soft Smile

- Layer type: `face`
- Fit profile: `datevibe_female_room_avatar_v1`
- Seed: `apps/mobile/src/features/avatarV2/assets/room/avatar_room_face_female_default_v2.png`
- Edit canvas: `docs/avatar-motion-pipeline/room_avatar_face_female_default_v2_walking_front_strip.png`
- Expected strip: `room_avatar_face_female_default_v2_walking_front_strip.png`
- Catalog slot: `assetsByMotion.walking.front`
- Frame duration: `120ms`
- Playback: `looping`
- Motion driver: `Female Room Base`
- Output frames:
  - `room_avatar_face_female_default_v2_walking_front_f01.png`
  - `room_avatar_face_female_default_v2_walking_front_f02.png`
  - `room_avatar_face_female_default_v2_walking_front_f03.png`
  - `room_avatar_face_female_default_v2_walking_front_f04.png`

Prompt:

```text
Edit the provided transparent DateVibe room-avatar reference canvas into one horizontal 4-frame spritesheet.

Preserve the approved seed layer in slot 01 exactly:
- same 2.5D layered rig: datevibe_2_5d_layered_v1
- same body preset: female
- same layer type: face
- same layer identity: Soft Smile
- same fit profile: datevibe_female_room_avatar_v1
- same facing direction: front
- same silhouette family, palette family, proportions, baseline, and centerline
- transparent background

Motion fit contract:
- Fit role: `fittedLayer`; fit this layer to motion driver `Female Room Base`.
- Motion driver reference strip: `docs/avatar-motion-pipeline/room_avatar_base_female_v2_walking_front_strip.png`.
- Keep every generated frame aligned to the driver's baseline, centerline, frame count, and body silhouette.

Canvas contract:
- exactly one row
- exactly 4 equal 256x384 frame slots
- final strip size 1024x384
- frame duration metadata 120ms
- playback looping
- no extra characters, labels, scenery, props, UI, poster layout, or background

Action:
- create Walk front for this single fitted layer only
- use `Female Room Base` as the motion/pose reference when available
- frame 01 must match the shipped seed frame exactly
- remaining frames must follow the body driver pose without adding body pixels, backgrounds, or merged clothing
- keep the result production mobile avatar art, not concept art

Import gate:
- do not crop or resize frames
- do not flatten onto a background
- do not change frame 01
- do not merge this layer with another avatar layer
- do not change the shared feet baseline or centerline
- animated motions must visibly change after frame 01
```

## 4. female Walk front - Blonde Waves Front

- Layer type: `hairFront`
- Fit profile: `datevibe_female_room_avatar_v1`
- Seed: `apps/mobile/src/features/avatarV2/assets/room/avatar_room_hair_female_blonde_long_front_v2.png`
- Edit canvas: `docs/avatar-motion-pipeline/room_avatar_hair_female_blonde_long_front_v2_walking_front_strip.png`
- Expected strip: `room_avatar_hair_female_blonde_long_front_v2_walking_front_strip.png`
- Catalog slot: `assetsByMotion.walking.front`
- Frame duration: `120ms`
- Playback: `looping`
- Motion driver: `Female Room Base`
- Output frames:
  - `room_avatar_hair_female_blonde_long_front_v2_walking_front_f01.png`
  - `room_avatar_hair_female_blonde_long_front_v2_walking_front_f02.png`
  - `room_avatar_hair_female_blonde_long_front_v2_walking_front_f03.png`
  - `room_avatar_hair_female_blonde_long_front_v2_walking_front_f04.png`

Prompt:

```text
Edit the provided transparent DateVibe room-avatar reference canvas into one horizontal 4-frame spritesheet.

Preserve the approved seed layer in slot 01 exactly:
- same 2.5D layered rig: datevibe_2_5d_layered_v1
- same body preset: female
- same layer type: hairFront
- same layer identity: Blonde Waves Front
- same fit profile: datevibe_female_room_avatar_v1
- same facing direction: front
- same silhouette family, palette family, proportions, baseline, and centerline
- transparent background

Motion fit contract:
- Fit role: `fittedLayer`; fit this layer to motion driver `Female Room Base`.
- Motion driver reference strip: `docs/avatar-motion-pipeline/room_avatar_base_female_v2_walking_front_strip.png`.
- Keep every generated frame aligned to the driver's baseline, centerline, frame count, and body silhouette.

Canvas contract:
- exactly one row
- exactly 4 equal 256x384 frame slots
- final strip size 1024x384
- frame duration metadata 120ms
- playback looping
- no extra characters, labels, scenery, props, UI, poster layout, or background

Action:
- create Walk front for this single fitted layer only
- use `Female Room Base` as the motion/pose reference when available
- frame 01 must match the shipped seed frame exactly
- remaining frames must follow the body driver pose without adding body pixels, backgrounds, or merged clothing
- keep the result production mobile avatar art, not concept art

Import gate:
- do not crop or resize frames
- do not flatten onto a background
- do not change frame 01
- do not merge this layer with another avatar layer
- do not change the shared feet baseline or centerline
- animated motions must visibly change after frame 01
```

## 5. female Walk front - Rose Skirt

- Layer type: `bottom`
- Fit profile: `datevibe_female_room_avatar_v1`
- Seed: `apps/mobile/src/features/avatarV2/assets/room/avatar_room_bottom_female_default_v2.png`
- Edit canvas: `docs/avatar-motion-pipeline/room_avatar_bottom_female_default_v2_walking_front_strip.png`
- Expected strip: `room_avatar_bottom_female_default_v2_walking_front_strip.png`
- Catalog slot: `assetsByMotion.walking.front`
- Frame duration: `120ms`
- Playback: `looping`
- Motion driver: `Female Room Base`
- Output frames:
  - `room_avatar_bottom_female_default_v2_walking_front_f01.png`
  - `room_avatar_bottom_female_default_v2_walking_front_f02.png`
  - `room_avatar_bottom_female_default_v2_walking_front_f03.png`
  - `room_avatar_bottom_female_default_v2_walking_front_f04.png`

Prompt:

```text
Edit the provided transparent DateVibe room-avatar reference canvas into one horizontal 4-frame spritesheet.

Preserve the approved seed layer in slot 01 exactly:
- same 2.5D layered rig: datevibe_2_5d_layered_v1
- same body preset: female
- same layer type: bottom
- same layer identity: Rose Skirt
- same fit profile: datevibe_female_room_avatar_v1
- same facing direction: front
- same silhouette family, palette family, proportions, baseline, and centerline
- transparent background

Motion fit contract:
- Fit role: `fittedLayer`; fit this layer to motion driver `Female Room Base`.
- Motion driver reference strip: `docs/avatar-motion-pipeline/room_avatar_base_female_v2_walking_front_strip.png`.
- Keep every generated frame aligned to the driver's baseline, centerline, frame count, and body silhouette.

Canvas contract:
- exactly one row
- exactly 4 equal 256x384 frame slots
- final strip size 1024x384
- frame duration metadata 120ms
- playback looping
- no extra characters, labels, scenery, props, UI, poster layout, or background

Action:
- create Walk front for this single fitted layer only
- use `Female Room Base` as the motion/pose reference when available
- frame 01 must match the shipped seed frame exactly
- remaining frames must follow the body driver pose without adding body pixels, backgrounds, or merged clothing
- keep the result production mobile avatar art, not concept art

Import gate:
- do not crop or resize frames
- do not flatten onto a background
- do not change frame 01
- do not merge this layer with another avatar layer
- do not change the shared feet baseline or centerline
- animated motions must visibly change after frame 01
```

## 6. female Walk front - Cream Flats

- Layer type: `shoes`
- Fit profile: `datevibe_female_room_avatar_v1`
- Seed: `apps/mobile/src/features/avatarV2/assets/room/avatar_room_shoes_female_default_v2.png`
- Edit canvas: `docs/avatar-motion-pipeline/room_avatar_shoes_female_default_v2_walking_front_strip.png`
- Expected strip: `room_avatar_shoes_female_default_v2_walking_front_strip.png`
- Catalog slot: `assetsByMotion.walking.front`
- Frame duration: `120ms`
- Playback: `looping`
- Motion driver: `Female Room Base`
- Output frames:
  - `room_avatar_shoes_female_default_v2_walking_front_f01.png`
  - `room_avatar_shoes_female_default_v2_walking_front_f02.png`
  - `room_avatar_shoes_female_default_v2_walking_front_f03.png`
  - `room_avatar_shoes_female_default_v2_walking_front_f04.png`

Prompt:

```text
Edit the provided transparent DateVibe room-avatar reference canvas into one horizontal 4-frame spritesheet.

Preserve the approved seed layer in slot 01 exactly:
- same 2.5D layered rig: datevibe_2_5d_layered_v1
- same body preset: female
- same layer type: shoes
- same layer identity: Cream Flats
- same fit profile: datevibe_female_room_avatar_v1
- same facing direction: front
- same silhouette family, palette family, proportions, baseline, and centerline
- transparent background

Motion fit contract:
- Fit role: `fittedLayer`; fit this layer to motion driver `Female Room Base`.
- Motion driver reference strip: `docs/avatar-motion-pipeline/room_avatar_base_female_v2_walking_front_strip.png`.
- Keep every generated frame aligned to the driver's baseline, centerline, frame count, and body silhouette.

Canvas contract:
- exactly one row
- exactly 4 equal 256x384 frame slots
- final strip size 1024x384
- frame duration metadata 120ms
- playback looping
- no extra characters, labels, scenery, props, UI, poster layout, or background

Action:
- create Walk front for this single fitted layer only
- use `Female Room Base` as the motion/pose reference when available
- frame 01 must match the shipped seed frame exactly
- remaining frames must follow the body driver pose without adding body pixels, backgrounds, or merged clothing
- keep the result production mobile avatar art, not concept art

Import gate:
- do not crop or resize frames
- do not flatten onto a background
- do not change frame 01
- do not merge this layer with another avatar layer
- do not change the shared feet baseline or centerline
- animated motions must visibly change after frame 01
```

## 7. female Walk front - Blush Date Dress

- Layer type: `top`
- Fit profile: `datevibe_female_room_avatar_v1`
- Seed: `apps/mobile/src/features/avatarV2/assets/room/avatar_room_top_female_default_v2.png`
- Edit canvas: `docs/avatar-motion-pipeline/room_avatar_top_female_default_v2_walking_front_strip.png`
- Expected strip: `room_avatar_top_female_default_v2_walking_front_strip.png`
- Catalog slot: `assetsByMotion.walking.front`
- Frame duration: `120ms`
- Playback: `looping`
- Motion driver: `Female Room Base`
- Output frames:
  - `room_avatar_top_female_default_v2_walking_front_f01.png`
  - `room_avatar_top_female_default_v2_walking_front_f02.png`
  - `room_avatar_top_female_default_v2_walking_front_f03.png`
  - `room_avatar_top_female_default_v2_walking_front_f04.png`

Prompt:

```text
Edit the provided transparent DateVibe room-avatar reference canvas into one horizontal 4-frame spritesheet.

Preserve the approved seed layer in slot 01 exactly:
- same 2.5D layered rig: datevibe_2_5d_layered_v1
- same body preset: female
- same layer type: top
- same layer identity: Blush Date Dress
- same fit profile: datevibe_female_room_avatar_v1
- same facing direction: front
- same silhouette family, palette family, proportions, baseline, and centerline
- transparent background

Motion fit contract:
- Fit role: `fittedLayer`; fit this layer to motion driver `Female Room Base`.
- Motion driver reference strip: `docs/avatar-motion-pipeline/room_avatar_base_female_v2_walking_front_strip.png`.
- Keep every generated frame aligned to the driver's baseline, centerline, frame count, and body silhouette.

Canvas contract:
- exactly one row
- exactly 4 equal 256x384 frame slots
- final strip size 1024x384
- frame duration metadata 120ms
- playback looping
- no extra characters, labels, scenery, props, UI, poster layout, or background

Action:
- create Walk front for this single fitted layer only
- use `Female Room Base` as the motion/pose reference when available
- frame 01 must match the shipped seed frame exactly
- remaining frames must follow the body driver pose without adding body pixels, backgrounds, or merged clothing
- keep the result production mobile avatar art, not concept art

Import gate:
- do not crop or resize frames
- do not flatten onto a background
- do not change frame 01
- do not merge this layer with another avatar layer
- do not change the shared feet baseline or centerline
- animated motions must visibly change after frame 01
```

## 8. female Sit front - Female Room Base

- Layer type: `base`
- Fit profile: `datevibe_female_room_avatar_v1`
- Seed: `apps/mobile/src/features/avatarV2/assets/room/avatar_room_base_female_v2.png`
- Edit canvas: `docs/avatar-motion-pipeline/room_avatar_base_female_v2_sitting_front_strip.png`
- Expected strip: `room_avatar_base_female_v2_sitting_front_strip.png`
- Catalog slot: `assetsByMotion.sitting.front`
- Frame duration: `120ms`
- Playback: `static/non-looping`
- Motion driver: `Female Room Base`
- Output frames:
  - `room_avatar_base_female_v2_sitting_front_f01.png`

Prompt:

```text
Edit the provided transparent DateVibe room-avatar reference canvas into one horizontal 1-frame spritesheet.

Preserve the approved seed layer in slot 01 exactly:
- same 2.5D layered rig: datevibe_2_5d_layered_v1
- same body preset: female
- same layer type: base
- same layer identity: Female Room Base
- same fit profile: datevibe_female_room_avatar_v1
- same facing direction: front
- same silhouette family, palette family, proportions, baseline, and centerline
- transparent background

Motion fit contract:
- Fit role: `motionDriver`; this base/body strip defines the motion mask for the same body preset.
- Generate this before fitted clothing, hair, face, and shoe layers.

Canvas contract:
- exactly one row
- exactly 1 equal 256x384 frame slots
- final strip size 256x384
- frame duration metadata 120ms
- playback static/non-looping
- no extra characters, labels, scenery, props, UI, poster layout, or background

Action:
- define a natural premium seated front pose for the female base body
- keep the seated pose usable for RoomV2 seat hotspots without cropping the body
- keep the body centered around centerline x=128 and visually grounded
- frame 01 must match the shipped seed frame exactly
- preserve the same body rig, baseline, centerline, proportions, and feet contact
- keep the result production mobile avatar art, not concept art

Import gate:
- do not crop or resize frames
- do not flatten onto a background
- do not change frame 01
- do not merge this layer with another avatar layer
- do not change the shared feet baseline or centerline
- animated motions must visibly change after frame 01
```

## 9. female Sit front - Blonde Waves Back

- Layer type: `hairBack`
- Fit profile: `datevibe_female_room_avatar_v1`
- Seed: `apps/mobile/src/features/avatarV2/assets/room/avatar_room_hair_female_blonde_long_back_v2.png`
- Edit canvas: `docs/avatar-motion-pipeline/room_avatar_hair_female_blonde_long_back_v2_sitting_front_strip.png`
- Expected strip: `room_avatar_hair_female_blonde_long_back_v2_sitting_front_strip.png`
- Catalog slot: `assetsByMotion.sitting.front`
- Frame duration: `120ms`
- Playback: `static/non-looping`
- Motion driver: `Female Room Base`
- Output frames:
  - `room_avatar_hair_female_blonde_long_back_v2_sitting_front_f01.png`

Prompt:

```text
Edit the provided transparent DateVibe room-avatar reference canvas into one horizontal 1-frame spritesheet.

Preserve the approved seed layer in slot 01 exactly:
- same 2.5D layered rig: datevibe_2_5d_layered_v1
- same body preset: female
- same layer type: hairBack
- same layer identity: Blonde Waves Back
- same fit profile: datevibe_female_room_avatar_v1
- same facing direction: front
- same silhouette family, palette family, proportions, baseline, and centerline
- transparent background

Motion fit contract:
- Fit role: `fittedLayer`; fit this layer to motion driver `Female Room Base`.
- Motion driver reference strip: `docs/avatar-motion-pipeline/room_avatar_base_female_v2_sitting_front_strip.png`.
- Keep every generated frame aligned to the driver's baseline, centerline, frame count, and body silhouette.

Canvas contract:
- exactly one row
- exactly 1 equal 256x384 frame slots
- final strip size 256x384
- frame duration metadata 120ms
- playback static/non-looping
- no extra characters, labels, scenery, props, UI, poster layout, or background

Action:
- create Sit front for this single fitted layer only
- use `Female Room Base` as the motion/pose reference when available
- frame 01 must match the shipped seed frame exactly
- follow the body driver pose without adding body pixels, backgrounds, or merged clothing
- keep the result production mobile avatar art, not concept art

Import gate:
- do not crop or resize frames
- do not flatten onto a background
- do not change frame 01
- do not merge this layer with another avatar layer
- do not change the shared feet baseline or centerline
- animated motions must visibly change after frame 01
```

## 10. female Sit front - Soft Smile

- Layer type: `face`
- Fit profile: `datevibe_female_room_avatar_v1`
- Seed: `apps/mobile/src/features/avatarV2/assets/room/avatar_room_face_female_default_v2.png`
- Edit canvas: `docs/avatar-motion-pipeline/room_avatar_face_female_default_v2_sitting_front_strip.png`
- Expected strip: `room_avatar_face_female_default_v2_sitting_front_strip.png`
- Catalog slot: `assetsByMotion.sitting.front`
- Frame duration: `120ms`
- Playback: `static/non-looping`
- Motion driver: `Female Room Base`
- Output frames:
  - `room_avatar_face_female_default_v2_sitting_front_f01.png`

Prompt:

```text
Edit the provided transparent DateVibe room-avatar reference canvas into one horizontal 1-frame spritesheet.

Preserve the approved seed layer in slot 01 exactly:
- same 2.5D layered rig: datevibe_2_5d_layered_v1
- same body preset: female
- same layer type: face
- same layer identity: Soft Smile
- same fit profile: datevibe_female_room_avatar_v1
- same facing direction: front
- same silhouette family, palette family, proportions, baseline, and centerline
- transparent background

Motion fit contract:
- Fit role: `fittedLayer`; fit this layer to motion driver `Female Room Base`.
- Motion driver reference strip: `docs/avatar-motion-pipeline/room_avatar_base_female_v2_sitting_front_strip.png`.
- Keep every generated frame aligned to the driver's baseline, centerline, frame count, and body silhouette.

Canvas contract:
- exactly one row
- exactly 1 equal 256x384 frame slots
- final strip size 256x384
- frame duration metadata 120ms
- playback static/non-looping
- no extra characters, labels, scenery, props, UI, poster layout, or background

Action:
- create Sit front for this single fitted layer only
- use `Female Room Base` as the motion/pose reference when available
- frame 01 must match the shipped seed frame exactly
- follow the body driver pose without adding body pixels, backgrounds, or merged clothing
- keep the result production mobile avatar art, not concept art

Import gate:
- do not crop or resize frames
- do not flatten onto a background
- do not change frame 01
- do not merge this layer with another avatar layer
- do not change the shared feet baseline or centerline
- animated motions must visibly change after frame 01
```

## 11. female Sit front - Blonde Waves Front

- Layer type: `hairFront`
- Fit profile: `datevibe_female_room_avatar_v1`
- Seed: `apps/mobile/src/features/avatarV2/assets/room/avatar_room_hair_female_blonde_long_front_v2.png`
- Edit canvas: `docs/avatar-motion-pipeline/room_avatar_hair_female_blonde_long_front_v2_sitting_front_strip.png`
- Expected strip: `room_avatar_hair_female_blonde_long_front_v2_sitting_front_strip.png`
- Catalog slot: `assetsByMotion.sitting.front`
- Frame duration: `120ms`
- Playback: `static/non-looping`
- Motion driver: `Female Room Base`
- Output frames:
  - `room_avatar_hair_female_blonde_long_front_v2_sitting_front_f01.png`

Prompt:

```text
Edit the provided transparent DateVibe room-avatar reference canvas into one horizontal 1-frame spritesheet.

Preserve the approved seed layer in slot 01 exactly:
- same 2.5D layered rig: datevibe_2_5d_layered_v1
- same body preset: female
- same layer type: hairFront
- same layer identity: Blonde Waves Front
- same fit profile: datevibe_female_room_avatar_v1
- same facing direction: front
- same silhouette family, palette family, proportions, baseline, and centerline
- transparent background

Motion fit contract:
- Fit role: `fittedLayer`; fit this layer to motion driver `Female Room Base`.
- Motion driver reference strip: `docs/avatar-motion-pipeline/room_avatar_base_female_v2_sitting_front_strip.png`.
- Keep every generated frame aligned to the driver's baseline, centerline, frame count, and body silhouette.

Canvas contract:
- exactly one row
- exactly 1 equal 256x384 frame slots
- final strip size 256x384
- frame duration metadata 120ms
- playback static/non-looping
- no extra characters, labels, scenery, props, UI, poster layout, or background

Action:
- create Sit front for this single fitted layer only
- use `Female Room Base` as the motion/pose reference when available
- frame 01 must match the shipped seed frame exactly
- follow the body driver pose without adding body pixels, backgrounds, or merged clothing
- keep the result production mobile avatar art, not concept art

Import gate:
- do not crop or resize frames
- do not flatten onto a background
- do not change frame 01
- do not merge this layer with another avatar layer
- do not change the shared feet baseline or centerline
- animated motions must visibly change after frame 01
```

## 12. female Sit front - Rose Skirt

- Layer type: `bottom`
- Fit profile: `datevibe_female_room_avatar_v1`
- Seed: `apps/mobile/src/features/avatarV2/assets/room/avatar_room_bottom_female_default_v2.png`
- Edit canvas: `docs/avatar-motion-pipeline/room_avatar_bottom_female_default_v2_sitting_front_strip.png`
- Expected strip: `room_avatar_bottom_female_default_v2_sitting_front_strip.png`
- Catalog slot: `assetsByMotion.sitting.front`
- Frame duration: `120ms`
- Playback: `static/non-looping`
- Motion driver: `Female Room Base`
- Output frames:
  - `room_avatar_bottom_female_default_v2_sitting_front_f01.png`

Prompt:

```text
Edit the provided transparent DateVibe room-avatar reference canvas into one horizontal 1-frame spritesheet.

Preserve the approved seed layer in slot 01 exactly:
- same 2.5D layered rig: datevibe_2_5d_layered_v1
- same body preset: female
- same layer type: bottom
- same layer identity: Rose Skirt
- same fit profile: datevibe_female_room_avatar_v1
- same facing direction: front
- same silhouette family, palette family, proportions, baseline, and centerline
- transparent background

Motion fit contract:
- Fit role: `fittedLayer`; fit this layer to motion driver `Female Room Base`.
- Motion driver reference strip: `docs/avatar-motion-pipeline/room_avatar_base_female_v2_sitting_front_strip.png`.
- Keep every generated frame aligned to the driver's baseline, centerline, frame count, and body silhouette.

Canvas contract:
- exactly one row
- exactly 1 equal 256x384 frame slots
- final strip size 256x384
- frame duration metadata 120ms
- playback static/non-looping
- no extra characters, labels, scenery, props, UI, poster layout, or background

Action:
- create Sit front for this single fitted layer only
- use `Female Room Base` as the motion/pose reference when available
- frame 01 must match the shipped seed frame exactly
- follow the body driver pose without adding body pixels, backgrounds, or merged clothing
- keep the result production mobile avatar art, not concept art

Import gate:
- do not crop or resize frames
- do not flatten onto a background
- do not change frame 01
- do not merge this layer with another avatar layer
- do not change the shared feet baseline or centerline
- animated motions must visibly change after frame 01
```

## 13. female Sit front - Cream Flats

- Layer type: `shoes`
- Fit profile: `datevibe_female_room_avatar_v1`
- Seed: `apps/mobile/src/features/avatarV2/assets/room/avatar_room_shoes_female_default_v2.png`
- Edit canvas: `docs/avatar-motion-pipeline/room_avatar_shoes_female_default_v2_sitting_front_strip.png`
- Expected strip: `room_avatar_shoes_female_default_v2_sitting_front_strip.png`
- Catalog slot: `assetsByMotion.sitting.front`
- Frame duration: `120ms`
- Playback: `static/non-looping`
- Motion driver: `Female Room Base`
- Output frames:
  - `room_avatar_shoes_female_default_v2_sitting_front_f01.png`

Prompt:

```text
Edit the provided transparent DateVibe room-avatar reference canvas into one horizontal 1-frame spritesheet.

Preserve the approved seed layer in slot 01 exactly:
- same 2.5D layered rig: datevibe_2_5d_layered_v1
- same body preset: female
- same layer type: shoes
- same layer identity: Cream Flats
- same fit profile: datevibe_female_room_avatar_v1
- same facing direction: front
- same silhouette family, palette family, proportions, baseline, and centerline
- transparent background

Motion fit contract:
- Fit role: `fittedLayer`; fit this layer to motion driver `Female Room Base`.
- Motion driver reference strip: `docs/avatar-motion-pipeline/room_avatar_base_female_v2_sitting_front_strip.png`.
- Keep every generated frame aligned to the driver's baseline, centerline, frame count, and body silhouette.

Canvas contract:
- exactly one row
- exactly 1 equal 256x384 frame slots
- final strip size 256x384
- frame duration metadata 120ms
- playback static/non-looping
- no extra characters, labels, scenery, props, UI, poster layout, or background

Action:
- create Sit front for this single fitted layer only
- use `Female Room Base` as the motion/pose reference when available
- frame 01 must match the shipped seed frame exactly
- follow the body driver pose without adding body pixels, backgrounds, or merged clothing
- keep the result production mobile avatar art, not concept art

Import gate:
- do not crop or resize frames
- do not flatten onto a background
- do not change frame 01
- do not merge this layer with another avatar layer
- do not change the shared feet baseline or centerline
- animated motions must visibly change after frame 01
```

## 14. female Sit front - Blush Date Dress

- Layer type: `top`
- Fit profile: `datevibe_female_room_avatar_v1`
- Seed: `apps/mobile/src/features/avatarV2/assets/room/avatar_room_top_female_default_v2.png`
- Edit canvas: `docs/avatar-motion-pipeline/room_avatar_top_female_default_v2_sitting_front_strip.png`
- Expected strip: `room_avatar_top_female_default_v2_sitting_front_strip.png`
- Catalog slot: `assetsByMotion.sitting.front`
- Frame duration: `120ms`
- Playback: `static/non-looping`
- Motion driver: `Female Room Base`
- Output frames:
  - `room_avatar_top_female_default_v2_sitting_front_f01.png`

Prompt:

```text
Edit the provided transparent DateVibe room-avatar reference canvas into one horizontal 1-frame spritesheet.

Preserve the approved seed layer in slot 01 exactly:
- same 2.5D layered rig: datevibe_2_5d_layered_v1
- same body preset: female
- same layer type: top
- same layer identity: Blush Date Dress
- same fit profile: datevibe_female_room_avatar_v1
- same facing direction: front
- same silhouette family, palette family, proportions, baseline, and centerline
- transparent background

Motion fit contract:
- Fit role: `fittedLayer`; fit this layer to motion driver `Female Room Base`.
- Motion driver reference strip: `docs/avatar-motion-pipeline/room_avatar_base_female_v2_sitting_front_strip.png`.
- Keep every generated frame aligned to the driver's baseline, centerline, frame count, and body silhouette.

Canvas contract:
- exactly one row
- exactly 1 equal 256x384 frame slots
- final strip size 256x384
- frame duration metadata 120ms
- playback static/non-looping
- no extra characters, labels, scenery, props, UI, poster layout, or background

Action:
- create Sit front for this single fitted layer only
- use `Female Room Base` as the motion/pose reference when available
- frame 01 must match the shipped seed frame exactly
- follow the body driver pose without adding body pixels, backgrounds, or merged clothing
- keep the result production mobile avatar art, not concept art

Import gate:
- do not crop or resize frames
- do not flatten onto a background
- do not change frame 01
- do not merge this layer with another avatar layer
- do not change the shared feet baseline or centerline
- animated motions must visibly change after frame 01
```
