"""Build favicon.svg from Pengji logo PNG (top 鹏 mark only)."""
from __future__ import annotations

import base64
import io
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC_CANDIDATES = [
    ROOT
    / "assets"
    / "c__Users_Administrator_AppData_Roaming_Cursor_User_workspaceStorage_759b0df810080f65d9e271e66c1812d6_images_50d2f8c54a691d5700e9099df5a2d093-ad1e087f-3c58-486e-a5df-ee4e491ec4c6.png",
    Path(__file__).resolve().parents[2].parent
    / ".cursor"
    / "projects"
    / "d-workSpace-industrial-realty-hifi"
    / "assets"
    / "pengji-favicon-mark.png",
    Path(
        r"C:\Users\Administrator\.cursor\projects\d-workSpace-industrial-realty-hifi\assets\pengji-favicon-mark.png"
    ),
]
OUT = Path(__file__).resolve().parents[1] / "public" / "favicon.svg"


def resolve_src() -> Path:
    for p in SRC_CANDIDATES:
        if p.is_file():
            return p
    raise FileNotFoundError(f"logo source not found; tried: {SRC_CANDIDATES}")


def main() -> None:
    src = resolve_src()
    im = Image.open(src).convert("RGBA")
    w, h = im.size
    # Full logo: crop top glyph; extracted mark: use whole image
    crop = im.crop((0, 0, w, int(h * 0.42))) if h > w * 1.2 else im

    arr = np.array(crop)
    rgb = arr[:, :, :3].astype(int)
    alpha = arr[:, :, 3]
    bg = ((rgb[:, :, 0] > 235) & (rgb[:, :, 1] > 235) & (rgb[:, :, 2] > 235)) | (alpha < 10)
    fg = ~bg
    ys, xs = np.where(fg)
    pad = max(4, int(min(crop.size) * 0.02))
    x0 = max(0, int(xs.min()) - pad)
    y0 = max(0, int(ys.min()) - pad)
    x1 = min(crop.size[0] - 1, int(xs.max()) + pad)
    y1 = min(crop.size[1] - 1, int(ys.max()) + pad)
    trim = crop.crop((x0, y0, x1 + 1, y1 + 1))

    arr2 = np.array(trim)
    r, g, b, a = arr2[:, :, 0], arr2[:, :, 1], arr2[:, :, 2], arr2[:, :, 3]
    white = (r > 230) & (g > 230) & (b > 230)
    arr2[white, 3] = 0
    trim = Image.fromarray(arr2)

    tw, th = trim.size
    side = max(tw, th)
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.paste(trim, ((side - tw) // 2, (side - th) // 2))
    sq = sq.resize((128, 128), Image.Resampling.LANCZOS)

    buf = io.BytesIO()
    sq.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")

    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="鹏基">\n'
        f'  <image width="128" height="128" href="data:image/png;base64,{b64}"/>\n'
        "</svg>\n"
    )
    OUT.write_text(svg, encoding="utf-8")
    print(f"wrote {OUT} ({len(b64)} base64 chars)")


if __name__ == "__main__":
    main()
