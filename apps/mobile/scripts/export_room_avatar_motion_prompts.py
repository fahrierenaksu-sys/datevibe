#!/usr/bin/env python3
"""Export DateVibe room-avatar motion generation prompts from the manifest."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


DEFAULT_MANIFEST = "docs/avatar-motion-pipeline/room-avatar-motion-missing-assets.json"
DEFAULT_OUT = "docs/avatar-motion-pipeline/room-avatar-motion-production-prompts.md"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Export DateVibe room-avatar motion production prompts."
    )
    parser.add_argument("--manifest", default=DEFAULT_MANIFEST)
    parser.add_argument("--out", default=DEFAULT_OUT)
    parser.add_argument(
        "--include-optional",
        action="store_true",
        help="Reserved for future non-v1 plans if the manifest includes them.",
    )
    return parser.parse_args()


def build_prompt(plan: dict[str, object], index: int) -> str:
    frame_count = int(plan["minimumFrameCount"])
    frame_width = int(plan["canvas"]["width"])
    frame_height = int(plan["canvas"]["height"])
    strip_width = frame_width * frame_count
    frame_duration_ms = int(plan["frameDurationMs"])
    loop_label = "looping" if bool(plan["loop"]) else "static/non-looping"
    is_motion_driver = plan.get("fitRole") == "motionDriver"
    expected_files = "\n".join(
        f"  - `{file_name}`" for file_name in plan["expectedFileNames"]
    )
    frame_continuity_line = (
        "- frame 01 must match the shipped seed frame exactly"
        if frame_count == 1
        else "- frame 01 must match the shipped seed frame exactly"
    )
    driver_action_tail = (
        "- preserve the same body rig, baseline, centerline, proportions, and feet contact"
        if frame_count == 1
        else "- remaining frames must preserve the same body rig, baseline, centerline, proportions, and feet contact"
    )
    fitted_action_tail = (
        "- follow the body driver pose without adding body pixels, backgrounds, or merged clothing"
        if frame_count == 1
        else "- remaining frames must follow the body driver pose without adding body pixels, backgrounds, or merged clothing"
    )
    fit_reference_lines = (
        "- Fit role: `motionDriver`; this base/body strip defines the motion mask for the same body preset.\n"
        "- Generate this before fitted clothing, hair, face, and shoe layers."
        if is_motion_driver
        else (
            f"- Fit role: `fittedLayer`; fit this layer to motion driver `{plan['motionDriverLayerName']}`.\n"
            f"- Motion driver reference strip: `{plan['motionDriverStripPath']}`.\n"
            "- Keep every generated frame aligned to the driver's baseline, centerline, frame count, and body silhouette."
        )
    )
    action_lines = build_action_lines(
        plan=plan,
        frame_continuity_line=frame_continuity_line,
        driver_action_tail=driver_action_tail,
        fitted_action_tail=fitted_action_tail,
        is_motion_driver=is_motion_driver,
    )

    return f"""## {index}. {plan["bodyPreset"]} {plan["label"]} - {plan["layerName"]}

- Layer type: `{plan["layerType"]}`
- Fit profile: `{plan["fitProfileId"]}`
- Seed: `{plan["seedPath"]}`
- Edit canvas: `{plan["editCanvasPath"]}`
- Expected strip: `{plan["expectedStripFileName"]}`
- Catalog slot: `{plan["catalogMotionSlot"]}`
- Frame duration: `{frame_duration_ms}ms`
- Playback: `{loop_label}`
- Motion driver: `{plan["motionDriverLayerName"]}`
- Output frames:
{expected_files}

Prompt:

```text
Edit the provided transparent DateVibe room-avatar reference canvas into one horizontal {frame_count}-frame spritesheet.

Preserve the approved seed layer in slot 01 exactly:
- same 2.5D layered rig: {plan["rigId"]}
- same body preset: {plan["bodyPreset"]}
- same layer type: {plan["layerType"]}
- same layer identity: {plan["layerName"]}
- same fit profile: {plan["fitProfileId"]}
- same facing direction: {plan["direction"]}
- same silhouette family, palette family, proportions, baseline, and centerline
- transparent background

Motion fit contract:
{fit_reference_lines}

Canvas contract:
- exactly one row
- exactly {frame_count} equal {frame_width}x{frame_height} frame slots
- final strip size {strip_width}x{frame_height}
- frame duration metadata {frame_duration_ms}ms
- playback {loop_label}
- no extra characters, labels, scenery, props, UI, poster layout, or background

Action:
{action_lines}
- keep the result production mobile avatar art, not concept art

Import gate:
- do not crop or resize frames
- do not flatten onto a background
- do not change frame 01
- do not merge this layer with another avatar layer
- do not change the shared feet baseline or centerline
- animated motions must visibly change after frame 01
```
"""


def build_action_lines(
    plan: dict[str, object],
    frame_continuity_line: str,
    driver_action_tail: str,
    fitted_action_tail: str,
    is_motion_driver: bool,
) -> str:
    if is_motion_driver and plan["state"] == "walking":
        return "\n".join([
            "- define the female base body motion mask for a subtle premium front-facing walk",
            "- keep the avatar grounded with consistent feet contact near baseline y=360",
            "- keep the body centered around centerline x=128 without side-to-side sliding",
            "- make frames 2-4 visibly different from frame 01 but not exaggerated or cartoony",
            frame_continuity_line,
            driver_action_tail,
        ])
    if is_motion_driver and plan["state"] == "sitting":
        return "\n".join([
            "- define a natural premium seated front pose for the female base body",
            "- keep the seated pose usable for RoomV2 seat hotspots without cropping the body",
            "- keep the body centered around centerline x=128 and visually grounded",
            frame_continuity_line,
            driver_action_tail,
        ])
    if is_motion_driver:
        return "\n".join([
            "- define the body motion mask for this body preset",
            frame_continuity_line,
            driver_action_tail,
        ])
    return "\n".join([
        f"- create {plan['label']} for this single fitted layer only",
        f"- use `{plan['motionDriverLayerName']}` as the motion/pose reference when available",
        frame_continuity_line,
        fitted_action_tail,
    ])


def main() -> None:
    args = parse_args()
    manifest = json.loads(Path(args.manifest).read_text(encoding="utf-8"))
    plans = [
        plan for plan in manifest["plans"]
        if args.include_optional or plan["productionBlocking"]
    ]
    content = [
        "# DateVibe Room Avatar Motion Production Prompts",
        "",
        "Generated from `room-avatar-motion-missing-assets.json`.",
        "These prompts are production requests only; generated strips must pass the verifier and extraction guards before catalog import.",
        "",
    ]
    content.extend(build_prompt(plan, index) for index, plan in enumerate(plans, 1))

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("\n".join(content).rstrip() + "\n", encoding="utf-8")
    print(f"exported {len(plans)} room-avatar motion prompts to {out_path}")


if __name__ == "__main__":
    main()
