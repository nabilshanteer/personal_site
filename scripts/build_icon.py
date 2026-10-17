"""The browser-tab icon: the index page's mark, orange on black.

The monogram is a package seen from above with an N routed across it, and
the same geometry is redrawn here rather than screenshotted — so the icon
is sharp at 16 pixels, where a downscaled screenshot of the real thing
would be mud.

Two renderings, because browsers disagree:
  icon.svg             scalable, what modern browsers take
  favicon.ico          16/32/48, for the ones that still ask for it
  apple-touch-icon.png 180, for a page saved to an iOS home screen

Run:  python -I scripts/build_icon.py
"""

from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path("public")

BLACK = (0, 0, 0, 255)
ORANGE = (255, 143, 58, 255)  # --accent

# The mark, in the same 48-unit space the component draws it in.
BODY = (7, 7, 41, 41)
BODY_RADIUS = 7
TRACE = [(18, 33), (18, 15), (30, 33), (30, 15)]
PADS = [(18, 33), (30, 15)]
PINS = [(2, 19, 7, 19), (2, 29, 7, 29), (41, 19, 46, 19), (41, 29, 46, 29)]

# Heavier than the component's 1.8 and 2.4. At sixteen pixels a hairline
# disappears into the background entirely.
STROKE = 2.4
TRACE_STROKE = 3.4
PAD_R = 2.6

PAD = 0.07  # margin around the mark, as a fraction of the icon


def mark(px: int) -> Image.Image:
    """One square icon, drawn large and resampled down — the cheapest
    antialiasing there is, and the only kind that survives 16px."""
    scale = 8
    n = px * scale
    img = Image.new("RGBA", (n, n), BLACK)
    draw = ImageDraw.Draw(img)

    inner = n * (1 - 2 * PAD)
    k = inner / 48.0
    o = n * PAD
    at = lambda x, y: (o + x * k, o + y * k)

    wide = max(1, round(STROKE * k))
    heavy = max(1, round(TRACE_STROKE * k))

    x0, y0, x1, y1 = BODY
    draw.rounded_rectangle(
        [at(x0, y0), at(x1, y1)], radius=BODY_RADIUS * k, outline=ORANGE, width=wide
    )

    for ax, ay, bx, by in PINS:
        draw.line([at(ax, ay), at(bx, by)], fill=ORANGE, width=wide)

    draw.line([at(x, y) for x, y in TRACE], fill=ORANGE, width=heavy, joint="curve")

    for cx, cy in PADS:
        r = PAD_R * k
        px0, py0 = at(cx, cy)
        draw.ellipse([px0 - r, py0 - r, px0 + r, py0 + r], fill=ORANGE)

    return img.resize((px, px), Image.LANCZOS)


SVG = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="-3 -3 54 54">
  <rect x="-3" y="-3" width="54" height="54" fill="#000000"/>
  <g fill="none" stroke="#ff8f3a" stroke-width="{STROKE}"
     stroke-linecap="round" stroke-linejoin="round">
    <rect x="7" y="7" width="34" height="34" rx="{BODY_RADIUS}"/>
    <path d="M 18 33 L 18 15 L 30 33 L 30 15" stroke-width="{TRACE_STROKE}"/>
    <path d="M 7 19 L 2 19 M 7 29 L 2 29 M 41 19 L 46 19 M 41 29 L 46 29"/>
  </g>
  <circle cx="18" cy="33" r="{PAD_R}" fill="#ff8f3a"/>
  <circle cx="30" cy="15" r="{PAD_R}" fill="#ff8f3a"/>
</svg>
"""


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    (OUT / "icon.svg").write_text(SVG, encoding="utf-8")
    print(f"  icon.svg              {len(SVG):>5} bytes")

    # Pillow builds the whole .ico from one image plus a list of sizes.
    base = mark(256)
    base.save(OUT / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    print(f"  favicon.ico           {(OUT / 'favicon.ico').stat().st_size:>5} bytes  16/32/48")

    touch = mark(180).convert("RGB")
    touch.save(OUT / "apple-touch-icon.png", optimize=True)
    print(f"  apple-touch-icon.png  {(OUT / 'apple-touch-icon.png').stat().st_size:>5} bytes  180x180")


if __name__ == "__main__":
    main()
