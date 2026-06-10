"""Prepare profile assets from a top-view module photo (reference 28.2 x 1000 mm)."""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image

RUBBER_SOURCE = Path(
    r"C:\Users\admin\.cursor\projects\c-Users-admin-Desktop-Programs-Aluminum-mudguard\assets"
    r"\c__Users_admin_AppData_Roaming_Cursor_User_workspaceStorage_fdf2c4f5009e7af5df54536aef6918cf_images"
    r"_ChatGPT_Image_10____._2026__.__10_13_20-981ed019-5f4f-4a7e-b87b-af71a271cca9.png"
)
PILE_SOURCE = Path(
    r"C:\Users\admin\.cursor\projects\c-Users-admin-Desktop-Programs-Aluminum-mudguard\assets"
    r"\c__Users_admin_AppData_Roaming_Cursor_User_workspaceStorage_fdf2c4f5009e7af5df54536aef6918cf_images"
    r"_ChatGPT_Image_10____._2026__.__10_17_46-2da07bdf-cf2f-4530-95fc-e680ca0adb06.png"
)
BRUSH_SOURCE = Path(
    r"C:\Users\admin\.cursor\projects\c-Users-admin-Desktop-Programs-Aluminum-mudguard\assets"
    r"\c__Users_admin_AppData_Roaming_Cursor_User_workspaceStorage_fdf2c4f5009e7af5df54536aef6918cf_images"
    r"_ChatGPT_Image_10____._2026__.__12_22_26-7943ab5a-ed86-47d6-958a-d950f3644b61.png"
)
SCRAPER_SOURCE = Path(
    r"C:\Users\admin\.cursor\projects\c-Users-admin-Desktop-Programs-Aluminum-mudguard\assets"
    r"\c__Users_admin_AppData_Roaming_Cursor_User_workspaceStorage_fdf2c4f5009e7af5df54536aef6918cf_images"
    r"_ChatGPT_Image_10____._2026__.__12_40_31-bed6b3fe-940e-4f69-af9a-84712a7c871d.png"
)
OUT_DIR = Path(__file__).resolve().parents[1] / "src" / "assets" / "profiles"

PLANK_WIDTH_MM = 28.2
SCRAPER_WIDTH_MM = 3.0
REFERENCE_LENGTH_MM = 1000
PROFILE_WIDTH_MM: dict[str, float] = {
    "rubber": PLANK_WIDTH_MM,
    "pile": PLANK_WIDTH_MM,
    "brush": PLANK_WIDTH_MM,
    "scraper": SCRAPER_WIDTH_MM,
}
TILE_LENGTH_MM = 300
EXPORT_PX_PER_MM = 12


def rgb(px, x: int, y: int) -> tuple[int, int, int]:
    value = px[x, y]
    return value[0], value[1], value[2]


def content_bbox(img: Image.Image) -> tuple[int, int, int, int]:
    px = img.load()
    w, h = img.size
    minx, miny, maxx, maxy = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            r, g, b = rgb(px, x, y)
            if r < 250 or g < 250 or b < 250:
                minx = min(minx, x)
                miny = min(miny, y)
                maxx = max(maxx, x)
                maxy = max(maxy, y)
    return minx, miny, maxx, maxy


def trim_vertical_shadow(crop: Image.Image) -> Image.Image:
    px = crop.load()
    w, h = crop.size

    def center_darkness(y: int) -> float:
        values = []
        for x in range(int(w * 0.25), int(w * 0.75)):
            r, g, b = rgb(px, x, y)
            values.append((255 - r) + (255 - g) + (255 - b))
        return sum(values) / len(values)

    darkness = [center_darkness(y) for y in range(h)]
    max_dark = max(darkness)
    bottom = next(i for i in range(len(darkness) - 1, -1, -1) if darkness[i] > max_dark * 0.2)
    return crop.crop((0, 0, w, bottom + 1))


def detect_module_horizontal_bounds(crop: Image.Image) -> tuple[int, int]:
    """Outer edges of module including aluminum side rails — no center crop."""
    px = crop.load()
    w, h = crop.size
    y0, y1 = int(h * 0.12), int(h * 0.88)
    scores: list[int] = []
    for x in range(w):
        count = sum(
            1
            for y in range(y0, y1)
            if rgb(px, x, y)[0] < 245 or rgb(px, x, y)[1] < 245 or rgb(px, x, y)[2] < 245
        )
        scores.append(count)

    max_score = max(scores) if scores else 1
    threshold = max_score * 0.25
    active = [i for i, score in enumerate(scores) if score > threshold]
    if not active:
        return 0, w - 1
    return active[0], active[-1]


def crop_module(crop: Image.Image) -> Image.Image:
    left, right = detect_module_horizontal_bounds(crop)
    return crop.crop((left, 0, right + 1, crop.size[1]))


def scale_to_mm_reference(crop: Image.Image, reference_width_mm: float) -> Image.Image:
    export_w = max(1, round(reference_width_mm * EXPORT_PX_PER_MM))
    export_h = max(1, round(REFERENCE_LENGTH_MM * EXPORT_PX_PER_MM))
    return crop.resize((export_w, export_h), Image.Resampling.LANCZOS)


def compose_with_shared_cap(
    rubber_module: Image.Image,
    insert_module: Image.Image,
    cap_px: int | None = None,
) -> Image.Image:
    """Replace insert caps with rubber caps; keep insert middle (bristle/pile/etc.)."""
    w, h = rubber_module.size
    if insert_module.size != (w, h):
        insert_module = insert_module.resize((w, h), Image.Resampling.LANCZOS)

    if cap_px is None:
        cap_px, _, _ = detect_caps(rubber_module)

    _, insert_top, insert_bottom = detect_caps(insert_module)
    insert_middle = insert_module.crop((0, insert_top, w, insert_bottom + 1))
    middle_h = h - 2 * cap_px
    insert_middle_scaled = insert_middle.resize((w, middle_h), Image.Resampling.LANCZOS)

    top_cap = rubber_module.crop((0, 0, w, cap_px))
    bottom_cap = top_cap.transpose(Image.Transpose.FLIP_TOP_BOTTOM)

    out = Image.new("RGBA", (w, h))
    out.paste(top_cap, (0, 0))
    out.paste(insert_middle_scaled, (0, cap_px))
    out.paste(bottom_cap, (0, h - cap_px))
    return out


def detect_caps(crop: Image.Image) -> tuple[int, int, int]:
    px = crop.load()
    w, h = crop.size

    def center_darkness(y: int) -> float:
        values = []
        for x in range(int(w * 0.15), int(w * 0.85)):
            r, g, b = rgb(px, x, y)
            values.append((255 - r) + (255 - g) + (255 - b))
        return sum(values) / len(values)

    darkness = [center_darkness(y) for y in range(h)]
    max_dark = max(darkness)
    is_middle = [value > max_dark * 0.55 for value in darkness]
    top = next(i for i, value in enumerate(is_middle) if value)
    bottom = next(i for i in range(len(is_middle) - 1, -1, -1) if is_middle[i])
    return max(top, 1), top, bottom


def process_profile(source: Path, out_dir: Path, profile_name: str, write_meta: bool) -> dict:
    reference_width_mm = PROFILE_WIDTH_MM.get(profile_name, PLANK_WIDTH_MM)
    img = Image.open(source).convert("RGBA")
    minx, miny, maxx, maxy = content_bbox(img)
    crop = img.crop((minx, miny, maxx + 1, maxy + 1))
    crop = trim_vertical_shadow(crop)
    crop = crop_module(crop)

    module = scale_to_mm_reference(crop, reference_width_mm)
    module_path = out_dir / f"{profile_name}-module.png"
    module.save(module_path, optimize=True)

    cw, ch = module.size
    cap_px, _, _ = detect_caps(module)
    cap_height_mm = round(cap_px / ch * REFERENCE_LENGTH_MM, 2)

    if profile_name == "rubber":
        module.crop((0, 0, cw, cap_px)).save(out_dir / "shared-cap.png", optimize=True)

    if profile_name == "brush":
        rubber_path = out_dir / "rubber-module.png"
        if rubber_path.exists():
            rubber_module = Image.open(rubber_path).convert("RGBA")
            shared_cap_px, _, _ = detect_caps(rubber_module)
            composed = compose_with_shared_cap(rubber_module, module, shared_cap_px)
            composed.save(module_path, optimize=True)
            module = composed
            cap_px = shared_cap_px
            cap_height_mm = round(cap_px / ch * REFERENCE_LENGTH_MM, 2)

    meta = {
        "profile": profile_name,
        "source": str(source),
        "exportPxPerMm": EXPORT_PX_PER_MM,
        "moduleWidthPx": cw,
        "moduleHeightPx": ch,
        "moduleAspect": round(cw / ch, 5),
        "capPx": cap_px,
        "referenceWidthMm": reference_width_mm,
        "referenceLengthMm": REFERENCE_LENGTH_MM,
        "referenceCapHeightMm": cap_height_mm,
        "tileLengthMm": TILE_LENGTH_MM,
    }

    if write_meta:
        (out_dir / "slice-meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")

    return meta


def main() -> None:
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else RUBBER_SOURCE
    out_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else OUT_DIR
    profile_name = sys.argv[3] if len(sys.argv) > 3 else "rubber"
    out_dir.mkdir(parents=True, exist_ok=True)

    write_meta = profile_name == "rubber"
    meta = process_profile(source, out_dir, profile_name, write_meta)
    print(json.dumps(meta, indent=2))


if __name__ == "__main__":
    main()
