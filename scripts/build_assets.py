"""Turn the two source photographs into the layers the panel needs.

Outputs into public/img/:
    face.png        cut-out portrait, straight alpha
    face_depth.png  greyscale depth map driving the parallax
    face_visor.png  the visor shot, aligned to face.png's framing
    face.json       eye-region box and other geometry the page needs

Run:  python -I build_assets.py <project-root>
"""

import json
import shutil
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

root = Path(sys.argv[1])
src = root / "images"
out = root / "public" / "img"
out.mkdir(parents=True, exist_ok=True)

base = cv2.imread(str(src / "my_face.jpg"))
visor = cv2.imread(str(src / "my_face_visor.jpg"))
H, W = base.shape[:2]
print(f"base {W}x{H}   visor {visor.shape[1]}x{visor.shape[0]}")


# ----------------------------------------------------------------- key ----
def chroma_key(image):
    """Pull a matte from the green screen.

    Green screens are keyed on how far green runs ahead of the other two
    channels, not on a colour distance — that is what lets the gaps
    between his curls come out as holes rather than as a blurred outline,
    and it gives a soft edge for free where hair is半 transparent.
    """
    bgr = image.astype(np.float32)
    blue, green, red = bgr[:, :, 0], bgr[:, :, 1], bgr[:, :, 2]

    # How much greener than the brighter of red/blue each pixel is.
    key = green - np.maximum(red, blue)

    # Fully background above HIGH, fully subject below LOW, soft between.
    LOW, HIGH = 6.0, 34.0
    alpha = 1.0 - np.clip((key - LOW) / (HIGH - LOW), 0.0, 1.0)

    # Nothing but screen should survive out at the corners.
    alpha[key > 60] = 0.0
    return (alpha * 255).astype(np.uint8)


def despill(image, alpha):
    """Take the green cast off the edges the key leaves behind.

    Hair lit against a green screen picks up a green rim. Clamping green
    to the average of the other two channels removes it without touching
    skin, which is never the greenest channel — and the clamp is pulled
    tighter the more transparent a pixel is, because the fringe is where
    nearly all of the spill lives (measured: +7.5 at the 90th percentile
    on the soft edge, against none at all in the interior).
    """
    bgr = image.astype(np.float32)
    blue, green, red = bgr[:, :, 0], bgr[:, :, 1], bgr[:, :, 2]

    softness = np.clip((1.0 - alpha.astype(np.float32) / 255.0) * 1.6, 0.0, 1.0)
    ceiling = (red + blue) * 0.5 * (1.0 - 0.14 * softness)

    bgr[:, :, 1] = np.minimum(green, ceiling)
    return np.clip(bgr, 0, 255).astype(np.uint8)


def bleed_colour(image, alpha, iterations=10):
    """Push the subject's colour out into the transparent surround.

    Transparent pixels still carry colour, and bilinear sampling and WebP
    compression both pull it back into the visible fringe. If that colour
    is screen green, a green rim reappears no matter how well the matte
    was pulled. Flooding his own colours outward removes the source.
    """
    out = image.astype(np.float32)
    known = (alpha > 8).astype(np.float32)

    for _ in range(iterations):
        weight = cv2.blur(known, (5, 5))
        spread = cv2.blur(out * known[:, :, None], (5, 5)) / (weight[:, :, None] + 1e-6)
        fill = (weight > 0.02) & (known < 0.5)
        out[fill] = spread[fill]
        known = np.maximum(known, fill.astype(np.float32))

    return np.clip(out, 0, 255).astype(np.uint8)


alpha = chroma_key(base)

# Clean up stray specks of either kind, then soften by a hair.
solid = (alpha > 160).astype(np.uint8)
n, labels, stats, _ = cv2.connectedComponentsWithStats(solid, 8)
if n > 1:
    biggest = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
    # Keep the figure, plus anything sizeable (a stray curl, a shoulder).
    keep = np.zeros_like(solid)
    for k in range(1, n):
        if k == biggest or stats[k, cv2.CC_STAT_AREA] > 240:
            keep[labels == k] = 1
    alpha = (alpha.astype(np.float32) * np.maximum(keep, cv2.GaussianBlur(keep.astype(np.float32), (0, 0), 3))).astype(np.uint8)

alpha = cv2.GaussianBlur(alpha, (0, 0), 0.7)
base = bleed_colour(despill(base, alpha), alpha)
print(f"keyed — {100 * (alpha > 200).mean():.1f}% opaque, {100 * (alpha < 20).mean():.1f}% clear")


# --------------------------------------------------------------- depth ----
# No depth model offline, so the map is built from what the image already
# tells us: the silhouette says foreground, a bump over the face says the
# nose is nearer than the ears, and softened luminance adds the detail.
face_box = None
cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
faces = cascade.detectMultiScale(cv2.cvtColor(base, cv2.COLOR_BGR2GRAY), 1.1, 6)
if len(faces):
    face_box = max(faces, key=lambda f: f[2] * f[3])
    print("face detected at", face_box)
else:
    face_box = np.array([int(W * 0.30), int(H * 0.22), int(W * 0.40), int(H * 0.40)])
    print("no face detected — using fallback box")

fx, fy, fw, fh = face_box
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)

# Elliptical bump centred on the face, peaking at the nose.
cx, cy = fx + fw * 0.5, fy + fh * 0.58
ellipse = ((xx - cx) / (fw * 0.85)) ** 2 + ((yy - cy) / (fh * 0.95)) ** 2
bump = np.clip(1.0 - ellipse, 0, 1) ** 0.7

# The body is nearer than the backdrop but further than the face.
body = cv2.GaussianBlur(alpha.astype(np.float32) / 255.0, (0, 0), 28)

# Shading detail: lit from the front, so brighter skin tends to be nearer.
# Confined to the face bump — across the whole figure the dark suit reads
# as a hole, which is a lighting fact, not a depth one.
grey = cv2.cvtColor(base, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0
detail = cv2.GaussianBlur(grey, (0, 0), 9)
detail = (detail - detail.min()) / max(1e-6, detail.ptp())

depth = 0.42 * body + 0.5 * bump + 0.12 * detail * bump
depth *= alpha.astype(np.float32) / 255.0
depth = cv2.GaussianBlur(depth, (0, 0), 6)
depth = (depth - depth.min()) / max(1e-6, depth.ptp())
print("depth done")


# ------------------------------------------------------------- circuit ----
# What the hover reveals: the same face, redrawn as a single-layer board.
# Edges become copper runs, feature points become solder pads, and a few
# Manhattan traces break out to the edge of the frame as though he were a
# component someone had routed. Drawn in the same ink as the typography
# rather than in sci-fi cyan — this is a technical drawing, not a costume.
grey_for_edges = cv2.cvtColor(base, cv2.COLOR_BGR2GRAY)
smooth = cv2.bilateralFilter(grey_for_edges, 9, 70, 70)
edges = cv2.Canny(smooth, 30, 90)
edges[alpha < 140] = 0

# Drop the speckle; keep runs long enough to read as traces.
n, labels, stats, _ = cv2.connectedComponentsWithStats(edges, 8)
traces = np.zeros_like(edges)
for i in range(1, n):
    if stats[i, cv2.CC_STAT_AREA] >= 14:
        traces[labels == i] = 255
traces = cv2.dilate(traces, np.ones((2, 2), np.uint8))

circuit = traces.astype(np.float32)

# Solder pads on strong corners, spaced out so they do not clump.
corners = cv2.goodFeaturesToTrack(
    smooth, maxCorners=120, qualityLevel=0.018, minDistance=26,
    mask=(alpha > 160).astype(np.uint8)
)
pads = []
if corners is not None:
    for [[px, py]] in corners.astype(int):
        pads.append((px, py))
        cv2.circle(circuit, (px, py), 7, 255, 2)
        cv2.circle(circuit, (px, py), 2, 255, -1)

# A handful of breakout traces leaving the figure, 90° then straight out.
rng = np.random.default_rng(99)
for px, py in rng.permutation(np.array(pads))[:7] if pads else []:
    px, py = int(px), int(py)
    direction = -1 if px < W / 2 else 1
    knee = px + direction * int(W * (0.08 + rng.random() * 0.1))
    cv2.line(circuit, (px, py), (knee, py), 255, 1)
    cv2.line(circuit, (knee, py), (knee, int(py + (rng.random() - 0.5) * H * 0.25)), 255, 1)

circuit = cv2.GaussianBlur(circuit, (0, 0), 0.6)

# A whisper of the silhouette so the head still has a shape behind the lines.
circuit_alpha = np.maximum(circuit, alpha.astype(np.float32) * 0.13)
circuit_alpha = np.clip(circuit_alpha, 0, 255).astype(np.uint8)
circuit_rgb = np.zeros_like(base)
circuit_rgb[:] = (21, 17, 15)  # BGR of the ink the type is set in
print(f"circuit drawn — {len(pads)} pads")


# --------------------------------------------------------------- frame ----
# The photograph is cropped through his shoulders, so the cut-out ends in
# hard vertical lines at the left and right edges. There are no more
# pixels to recover, so the canvas is widened and the jacket continued by
# reflection, then faded out across the new margin — the shoulders leave
# the frame instead of being sliced off by it.
PAD_X = int(W * 0.05)
PAD_B = 0  # the shader fades this edge; replicating it only smears


def extend(image):
    # Replicate, not reflect: mirroring the shoulder slope folds a
    # visible chevron into the jacket. Smearing the edge column
    # outward reads as cloth continuing past the frame.
    return cv2.copyMakeBorder(image, 0, PAD_B, PAD_X, PAD_X, cv2.BORDER_REPLICATE)


def falloff(h, w):
    """1 across the original frame, easing to 0 through the added margin."""
    ramp = np.ones((h, w), np.float32)
    for i in range(PAD_X):
        t = (i / PAD_X) ** 1.7
        ramp[:, i] = t
        ramp[:, w - 1 - i] = t
    for j in range(PAD_B):
        t = (j / PAD_B) ** 1.7
        ramp[h - 1 - j, :] = np.minimum(ramp[h - 1 - j, :], t)
    return cv2.GaussianBlur(ramp, (0, 0), PAD_X * 0.12)


PH, PW = H + PAD_B, W + 2 * PAD_X
ramp = falloff(PH, PW)

base = extend(base)
alpha = (extend(alpha).astype(np.float32) * ramp).astype(np.uint8)
depth = extend((depth * 255).astype(np.uint8)).astype(np.float32) / 255.0

# The line work gets a transparent margin, not a replicated one — smearing
# a drawing sideways looks like a printing fault.
circuit_rgb = cv2.copyMakeBorder(circuit_rgb, 0, PAD_B, PAD_X, PAD_X, cv2.BORDER_CONSTANT, value=(21, 17, 15))
circuit_alpha = cv2.copyMakeBorder(circuit_alpha, 0, PAD_B, PAD_X, PAD_X, cv2.BORDER_CONSTANT, value=0)
circuit_alpha = (circuit_alpha.astype(np.float32) * ramp).astype(np.uint8)

# The face box moves with the padding.
fx += PAD_X
print(f"frame extended to {PW}x{PH}")

# WebP, and scaled to what the page actually displays. The full-size PNG
# of a 1024px cut-out is over a megabyte, which is a lot to ask of a hero
# image nobody can see the extra pixels in.
MAX_EDGE = 900


def save(name, bgr, alpha=None, quality=88):
    scale = min(1.0, MAX_EDGE / max(bgr.shape[:2]))
    size = (int(bgr.shape[1] * scale), int(bgr.shape[0] * scale))
    rgb = cv2.cvtColor(cv2.resize(bgr, size, interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2RGB)
    if alpha is None:
        image = Image.fromarray(rgb)
    else:
        a = cv2.resize(alpha, size, interpolation=cv2.INTER_AREA)
        image = Image.fromarray(np.dstack([rgb, a]))
    path = out / f"{name}.webp"
    image.save(path, "WEBP", quality=quality, method=6)
    print(f"  {path.name:20s} {path.stat().st_size // 1024:>4} kB  {size[0]}x{size[1]}")


save("face", base, alpha)
save("face_depth", cv2.cvtColor((depth * 255).astype(np.uint8), cv2.COLOR_GRAY2BGR), quality=92)
save("face_circuit", circuit_rgb, circuit_alpha, quality=92)

# The autograph. Priestacy is already a joined script, so the signature
# is built from its own outlines rather than drawn by hand: each glyph is
# traced, flipped out of font space into SVG space, and laid along the
# baseline with a little overlap so the letters run together the way a
# signed name does.
try:
    from fontTools.ttLib import TTFont
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.boundsPen import BoundsPen
    from fontTools.pens.transformPen import TransformPen
    from fontTools.misc.transform import Transform

    font_file = root / "public" / "fonts" / "priestacy.otf"
    if font_file.exists():
        font = TTFont(str(font_file))
        glyphs = font.getGlyphSet()
        charmap = font.getBestCmap()

        WORD = "Nabil"
        TIGHTEN = 0.955  # letters sit slightly into each other

        # Each letter is kept separately, with its own bounds, so the page
        # can write them one at a time rather than drawing a curtain across
        # the whole word.
        letters, cursor = [], 0.0
        whole = BoundsPen(glyphs)
        for character in WORD:
            name = charmap[ord(character)]
            flip = Transform(1, 0, 0, -1, cursor, 0)

            pen = SVGPathPen(glyphs)
            glyphs[name].draw(TransformPen(pen, flip))
            drawn = pen.getCommands()

            own = BoundsPen(glyphs)
            glyphs[name].draw(TransformPen(own, flip))
            glyphs[name].draw(TransformPen(whole, flip))

            if drawn and own.bounds:
                letters.append({"d": drawn, "bounds": own.bounds})

            cursor += glyphs[name].width * TIGHTEN

        x0, y0, x1, y1 = whole.bounds
        pad = (x1 - x0) * 0.04
        X0, Y0 = x0 - pad, y0 - pad
        W, H = (x1 - x0) + pad * 2, (y1 - y0) + pad * 2

        signature = {
            "viewBox": f"{X0:.1f} {Y0:.1f} {W:.1f} {H:.1f}",
            # One joined path: the page draws this and fades it up. Masking
            # five separate letters every frame cost more than it was worth.
            "d": " ".join(letter["d"] for letter in letters),
            "letters": [
                {
                    "d": letter["d"],
                    # Cropped to this letter horizontally, full height, so the
                    # pieces line up exactly when laid back over each other.
                    "viewBox": f"{letter['bounds'][0]:.1f} {Y0:.1f} "
                               f"{letter['bounds'][2] - letter['bounds'][0]:.1f} {H:.1f}",
                    "left": round((letter["bounds"][0] - X0) / W, 5),
                    "width": round((letter["bounds"][2] - letter["bounds"][0]) / W, 5),
                }
                for letter in letters
            ],
        }
        (out / "signature.json").write_text(json.dumps(signature), encoding="utf-8")
        print(f"  signature.json        {len(signature['letters'])} letters, viewBox {signature['viewBox']}")
except ImportError:
    print("  fontTools missing — signature not rebuilt")

# A country outline, if one has been dropped in as images/uae.svg. Every
# path in it is kept, since country files are usually one path per region.
map_path = src / "uae.svg"
if map_path.exists():
    import re
    svg_text = map_path.read_text(encoding="utf-8", errors="ignore")
    box = re.search(r'viewbox="([^"]+)"', svg_text, re.I)
    paths = re.findall(r'\sd="([^"]+)"', svg_text)
    if box and paths:
        (out / "country.json").write_text(
            json.dumps({"viewBox": box.group(1), "paths": paths}), encoding="utf-8"
        )
        print(f"  country.json          {len(paths)} path(s), viewBox {box.group(1)}")
    else:
        print("  uae.svg found but no viewBox/path could be read")

# The electronics symbol he supplied: black line art on transparent, kept
# as-is so the page can use it as a CSS mask and colour it with currentColor.
symbol_path = src / "symbol_source.png"
if symbol_path.exists():
    from PIL import Image as PILImage
    symbol = PILImage.open(symbol_path).convert("RGBA")
    symbol.thumbnail((160, 160), PILImage.LANCZOS)
    symbol.save(out / "symbol.png", optimize=True)
    print(f"  symbol.png           {(out / 'symbol.png').stat().st_size // 1024:>4} kB  {symbol.size[0]}x{symbol.size[1]}")

# Project figures: anything under images/projects/<slug>/ is flattened
# onto white (these are line drawings with transparent backgrounds, which
# would vanish against a dark page) and written out at web size.
#
# PDFs dropped in the same folder are mined for their embedded images, so
# a specification or a project-management document can be handed over
# whole and the diagrams inside it still reach the site. Anything small
# enough to be a logo or an icon is left behind. A loose PNG always wins
# over a PDF-extracted one of the same name, so a figure can be replaced
# by hand without the pipeline overwriting it again.
#
# The folder name is the project's slug, slugified — "Thematic Clustering"
# and "thematic_clustering" both land on thematic-clustering — so it must
# match the `slug` in src/lib/work/<slug>.js.

PDF_MIN_SIDE = 300        # px; below this it is furniture, not a figure
PDF_MIN_PIXELS = 200_000  # px; and it has to be worth a band slot
PDF_MIN_BYTES = 12_000    # a 2 kB "image" spanning a slide is a gradient strip
PDF_RENDER_DPI = 150      # when a PDF has no raster figures to give
PDF_RENDER_MAX = 12       # pages
PDF_MIN_SPREAD = 12       # grey-level std dev; below this it is a logo or a
                          # gradient strip, not a figure


def slugify(name):
    cleaned = "".join(c if c.isalnum() else "-" for c in name.lower())
    while "--" in cleaned:
        cleaned = cleaned.replace("--", "-")
    return cleaned.strip("-")


def informative(image):
    """Does the picture carry anything?

    A university logo on a transparent ground, a rule, or the gradient strip
    behind a slide title all survive a size filter — they are big — and all
    come out as a nearly uniform field once flattened. Spread in grey levels
    separates them from an actual figure."""
    from PIL import ImageStat
    grey = image.convert("RGBA")
    flat = PILImage.new("RGB", grey.size, (247, 247, 245))
    flat.paste(grey, mask=grey.split()[3])
    return ImageStat.Stat(flat.convert("L")).stddev[0] >= PDF_MIN_SPREAD


def content_key(image):
    """Identity by what the picture looks like, not by how it was stored.

    The same figure exported once as a PNG and once inside a PDF is byte-
    different and pixel-identical, and should only reach the site once."""
    return hashlib.sha1(image.convert("RGB").tobytes()).hexdigest()


def pdf_figures(folder, already):
    """Figures from every PDF in `folder`.

    First choice is the embedded raster images — that is what a report with
    plotted figures is made of. A poster or a slide deck is usually vector,
    so it holds no images worth having and yields only gradient strips and
    rules; when a PDF gives up nothing that way, its pages are rendered
    instead. `already` is the set of content keys seen so far, so nothing
    is written twice."""
    try:
        from pypdf import PdfReader
    except ImportError:
        print("  ! pypdf not installed — PDFs skipped (pip install pypdf)")
        return []

    found = []
    for pdf in sorted(folder.glob("*.pdf")):
        stem = slugify(pdf.stem)
        try:
            reader = PdfReader(pdf)
        except Exception as error:
            print(f"  ! {pdf.name}: {error}")
            continue

        embedded = []
        for number, page in enumerate(reader.pages, 1):
            try:
                items = list(page.images)
            except Exception:
                continue
            for item in items:
                if len(item.data) < PDF_MIN_BYTES:
                    continue
                try:
                    picture = PILImage.open(io.BytesIO(item.data))
                    picture.load()
                except Exception:
                    continue
                width, height = picture.size
                if min(width, height) < PDF_MIN_SIDE:
                    continue
                if width * height < PDF_MIN_PIXELS:
                    continue
                if not informative(picture):
                    continue
                key = content_key(picture)
                if key in already:
                    continue
                already.add(key)
                embedded.append((f"{stem}-p{number}-{len(embedded) + 1}", picture))

        found.extend(embedded)
        # Pages are rendered as well as mined, always. A report gives up its
        # plotted figures as raster images; a poster or a slide deck is
        # vector and gives up nothing worth having, and both cases want the
        # page itself available. Rendering everything costs a little disk
        # and means the project file can choose, rather than the heuristic
        # choosing for it. Duplicates are dropped by content either way.

        # Nothing raster in there: render the pages themselves.
        try:
            import pypdfium2
        except ImportError:
            print(f"  ! {pdf.name}: no raster figures, and pypdfium2 is not "
                  f"installed to render pages (pip install pypdfium2)")
            continue
        try:
            document = pypdfium2.PdfDocument(pdf)
        except Exception as error:
            print(f"  ! {pdf.name}: {error}")
            continue
        for number, page in enumerate(document, 1):
            if number > PDF_RENDER_MAX:
                break
            picture = page.render(scale=PDF_RENDER_DPI / 72).to_pil()
            key = content_key(picture)
            if key in already:
                continue
            already.add(key)
            found.append((f"{stem}-page{number}", picture))

    return found


project_root = src / "projects"
if project_root.exists():
    import hashlib
    import io
    from PIL import Image as PILImage

    def write_figure(destination, stem, image):
        image = image.convert("RGBA")
        flat = PILImage.new("RGB", image.size, (247, 247, 245))
        flat.paste(image, mask=image.split()[3])
        # The poster is the one figure people will zoom into to read
        # small print, so it gets more pixels and a gentler quality.
        poster = stem == "poster"
        limit = 2200 if poster else 1500
        flat.thumbnail((limit, limit), PILImage.LANCZOS)
        target = destination / f"{stem}.webp"
        flat.save(target, "WEBP", quality=92 if poster else 86, method=6)
        return target, flat

    for folder in sorted(project_root.iterdir()):
        if not folder.is_dir():
            continue
        slug = slugify(folder.name)
        destination = out / "projects" / slug
        destination.mkdir(parents=True, exist_ok=True)

        loose = sorted(folder.glob("*.png")) + sorted(folder.glob("*.jpg"))
        taken = {slugify(picture.stem) for picture in loose}
        # Loose files are written first and claim their content, so the same
        # figure sitting inside a PDF beside them is not written again.
        seen = set()

        for picture in loose:
            # A zero-byte or truncated file is a failed export, not a figure.
            # One of those should not take the whole build down with it.
            try:
                opened = PILImage.open(picture)
                opened.load()
            except (OSError, ValueError) as error:
                print(f"  ! projects/{slug}/{picture.name}: unreadable ({type(error).__name__})")
                continue
            seen.add(content_key(opened))
            target, flat = write_figure(destination, slugify(picture.stem), opened)
            print(f"  projects/{slug}/{target.name:28s} "
                  f"{target.stat().st_size // 1024:>4} kB  {flat.size[0]}x{flat.size[1]}")

        # The documents themselves are published alongside their figures, so
        # a panel can link straight to the report it was written from. They
        # are copied rather than processed — a PDF is already a web format.
        for document in sorted(folder.glob("*.pdf")):
            papers = out.parent / "doc" / "projects" / slug
            papers.mkdir(parents=True, exist_ok=True)
            copy = papers / f"{slugify(document.stem)}.pdf"
            if not copy.exists() or copy.stat().st_mtime < document.stat().st_mtime:
                shutil.copyfile(document, copy)
            print(f"  doc/projects/{slug}/{copy.name:24s} "
                  f"{copy.stat().st_size // 1024:>5} kB")

        # Video is published the same way: copied, not processed.
        for clip in sorted(folder.glob("*.mp4")) + sorted(folder.glob("*.webm")):
            films = out.parent / "media" / "projects" / slug
            films.mkdir(parents=True, exist_ok=True)
            copy = films / f"{slugify(clip.stem)}{clip.suffix.lower()}"
            if not copy.exists() or copy.stat().st_mtime < clip.stat().st_mtime:
                shutil.copyfile(clip, copy)
            print(f"  media/projects/{slug}/{copy.name:22s} "
                  f"{copy.stat().st_size // 1024:>5} kB")

        for stem, picture in pdf_figures(folder, seen):
            if stem in taken:
                continue
            target, flat = write_figure(destination, stem, picture)
            print(f"  projects/{slug}/{target.name:28s} "
                  f"{target.stat().st_size // 1024:>4} kB  {flat.size[0]}x{flat.size[1]}  (pdf)")

# The CV itself. Copied, not processed — a PDF is already a web format,
# and this is the one file on the site someone may want to keep rather
# than read. It is published under a stable, readable name so the link
# can be put on an application and not rot when the file is renamed.
cv_src = root / "cv"
if cv_src.exists():
    papers = out.parent / "doc"
    papers.mkdir(parents=True, exist_ok=True)
    for document in sorted(cv_src.glob("*.pdf")):
        copy = papers / "nabil-al-shanteer-cv.pdf"
        if not copy.exists() or copy.stat().st_mtime < document.stat().st_mtime:
            shutil.copyfile(document, copy)
        print(f"  doc/{copy.name:36s} {copy.stat().st_size // 1024:>5} kB")

        # A thumbnail of the first page, so the CV page can show what the
        # document looks like without making anyone open it. Rendered
        # small on purpose: it is a picture of a page, not the page.
        shot = papers / "cv-preview.jpg"
        if not shot.exists() or shot.stat().st_mtime < document.stat().st_mtime:
            try:
                import pypdfium2
            except ImportError:
                print("  ! cv-preview.jpg: pypdfium2 is not installed "
                      "(pip install pypdfium2)")
            else:
                sheet = pypdfium2.PdfDocument(str(document))[0]
                sheet.render(scale=0.78).to_pil().convert("RGB").save(
                    shot, quality=82, optimize=True, progressive=True
                )
        if shot.exists():
            print(f"  doc/{shot.name:36s} {shot.stat().st_size // 1024:>5} kB")
        break  # one CV; if there are several, the first by name wins

# The about sequence's music. Copied, not processed.
# about/web holds what `npm run audio` produced: cut to length and
# compressed. The masters beside it stay home.
about_src = root / "about" / "web"
if not about_src.exists():
    about_src = root / "about"
if about_src.exists():
    about_out = out.parent / "media" / "about"
    about_out.mkdir(parents=True, exist_ok=True)
    for track in sorted(about_src.iterdir()):
        if track.suffix.lower() not in (".wav", ".mp3", ".ogg", ".m4a"):
            continue
        # A master with a compressed twin stays home: shipping both would
        # put 29 MB of wav into the build for nothing.
        if track.suffix.lower() == ".wav" and track.with_suffix(".mp3").exists():
            continue
        copy = about_out / track.name
        if not copy.exists() or copy.stat().st_mtime < track.stat().st_mtime:
            shutil.copyfile(track, copy)
        print(f"  media/about/{copy.name:27s} {copy.stat().st_size // 1024:>6} kB")

# The about-sequence photographs. They drift behind the text at a small
# size, so they are published small — there is no point shipping a 4000px
# holiday photo to be shown 220px wide behind a paragraph. A manifest goes
# out beside them so the page knows what exists without guessing names.
pics_src = src.parent / "about" / "about_pics"
if pics_src.exists():
    from PIL import Image as PILImage

    pics_out = out / "about"
    pics_out.mkdir(parents=True, exist_ok=True)
    manifest = {}

    for group in sorted(pics_src.iterdir()):
        if not group.is_dir():
            continue
        slug = slugify(group.name)
        target = pics_out / slug
        target.mkdir(parents=True, exist_ok=True)
        listed = []
        for picture in sorted(group.iterdir()):
            if picture.suffix.lower() not in (".png", ".jpg", ".jpeg", ".webp"):
                continue
            try:
                shot = PILImage.open(picture)
                shot.load()
            except Exception as error:
                print(f"  ! about/{slug}/{picture.name}: {type(error).__name__}")
                continue
            shot = shot.convert("RGB")
            shot.thumbnail((640, 640), PILImage.LANCZOS)
            name = slugify(picture.stem) + ".webp"
            shot.save(target / name, "WEBP", quality=82, method=6)
            listed.append(name)
        if listed:
            manifest[slug] = listed
            total = sum((target / n).stat().st_size for n in listed)
            print(f"  about/{slug:16s} {len(listed):>2} pictures  "
                  f"{total // 1024:>4} kB")

    (pics_out / "pics.json").write_text(json.dumps(manifest), encoding="utf-8")

# The contact clip. Copied, not processed — a short h264 file is already
# a web format, and re-encoding it here would only lose quality.
clip_src = root / "contact"
if clip_src.exists():
    clip_out = out.parent / "media" / "contact"
    clip_out.mkdir(parents=True, exist_ok=True)
    for clip in sorted(clip_src.iterdir()):
        if clip.suffix.lower() not in (".mp4", ".webm", ".mov"):
            continue
        copy = clip_out / (slugify(clip.stem) + clip.suffix.lower())
        if not copy.exists() or copy.stat().st_mtime < clip.stat().st_mtime:
            shutil.copyfile(clip, copy)
        print(f"  media/contact/{copy.name:24s} {copy.stat().st_size // 1024:>6} kB")

# Organisation marks: images/logos/<name> becomes a small transparent PNG
# the project wheel can sit beside a project name.
#
# The background is removed by flooding inwards from the four corners
# rather than by making every light pixel transparent. These are logos
# with white INSIDE them — the lettering in the Citizens Advice bubble,
# the stag in the Southampton shield, the NHS wordmark — and a global
# white-to-alpha pass eats exactly the parts that make them readable.
logo_src = src / "logos"
if logo_src.exists():
    from PIL import Image as PILImage

    logo_out = out / "logos"
    logo_out.mkdir(parents=True, exist_ok=True)

    # Every local in here carries a prefix on purpose. This block runs
    # between the face detection and the silhouette tracing further down,
    # and names like `alpha`, `image` and `box` are module-level there.
    # Reusing them fed a logo's alpha channel to the contour tracer and
    # drew the outline of a logo around his body instead of his own edge.
    for mark in sorted(logo_src.iterdir()):
        if mark.suffix.lower() not in (".png", ".jpg", ".jpeg", ".webp"):
            continue
        logo_image = PILImage.open(mark).convert("RGBA")
        logo_rgb = np.array(logo_image.convert("RGB"))
        lh, lw = logo_rgb.shape[:2]

        # Flood from each corner, tolerant enough for JPEG mush and the
        # off-white grounds these are usually exported on.
        logo_flood = np.zeros((lh + 2, lw + 2), np.uint8)
        logo_canvas = logo_rgb.copy()
        for seed in ((0, 0), (lw - 1, 0), (0, lh - 1), (lw - 1, lh - 1)):
            cv2.floodFill(logo_canvas, logo_flood, seed, (0, 0, 0),
                          (12, 12, 12), (12, 12, 12),
                          4 | cv2.FLOODFILL_MASK_ONLY | (255 << 8))
        logo_background = logo_flood[1:-1, 1:-1].astype(bool)

        logo_alpha = np.array(logo_image)[:, :, 3]
        logo_alpha[logo_background] = 0
        logo_cut = np.dstack([logo_rgb, logo_alpha])
        logo_trimmed = PILImage.fromarray(logo_cut, "RGBA")

        logo_box = logo_trimmed.getbbox()
        if logo_box:
            logo_trimmed = logo_trimmed.crop(logo_box)
        # Twice the size it is drawn at, so it stays crisp on a dense screen.
        logo_trimmed.thumbnail((128, 128), PILImage.LANCZOS)

        logo_target = logo_out / f"{mark.stem}.png"
        logo_trimmed.save(logo_target, optimize=True)
        print(f"  logos/{logo_target.name:22s} "
              f"{logo_target.stat().st_size // 1024:>3} kB  "
              f"{logo_trimmed.size[0]}x{logo_trimmed.size[1]}  "
              f"{int((~logo_background).mean() * 100):>3}% kept")

# The backdrop photograph, if one has been dropped in.
backdrop_path = src / "background_layer.jpg"
if backdrop_path.exists():
    save("backdrop", cv2.imread(str(backdrop_path)), quality=84)



# ---------------------------------------------------------------- json ----
# Anchor points for the datasheet callouts, in 0–1 of the finished image.
# Derived from the detected face box rather than hard-coded, so a new
# photograph re-places every label without anyone touching the markup.
def point(ux, uy):
    return [float((fx + fw * ux) / PW), float((fy + fh * uy) / PH)]


anchors = {
    "crown": point(0.50, -0.14),   # above the hairline
    "eyeLeft": point(0.31, 0.42),
    "eyeRight": point(0.69, 0.42),
    "earLeft": point(0.01, 0.52),
    "earRight": point(0.99, 0.52),
    "nose": point(0.50, 0.63),
    "mouth": point(0.50, 0.80),
    "jaw": point(0.50, 1.02),
    "shoulderLeft": point(-0.52, 1.45),
    "shoulderRight": point(1.52, 1.45),
    "chest": point(0.46, 1.52),
}

# Eye detection refines the two eye anchors when it finds them; the
# proportional guess stands in when it does not.
eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_eye.xml")
face_grey = cv2.cvtColor(base, cv2.COLOR_BGR2GRAY)[fy:fy + int(fh * 0.65), fx:fx + fw]
found = eye_cascade.detectMultiScale(face_grey, 1.1, 8, minSize=(int(fw * 0.1), int(fw * 0.1)))
if len(found) >= 2:
    found = sorted(found, key=lambda e: e[2] * e[3], reverse=True)[:2]
    found = sorted(found, key=lambda e: e[0])
    for key, (ex, ey, ew, eh) in zip(("eyeLeft", "eyeRight"), found):
        anchors[key] = [float((fx + ex + ew / 2) / PW), float((fy + ey + eh / 2) / PH)]
    print(f"eyes detected at {anchors['eyeLeft']} and {anchors['eyeRight']}")
else:
    print("eyes not detected — using proportions of the face box")

# The silhouette, for the power-up effect to trace current around.
# Simplified hard — a few hundred points is plenty at this scale, and the
# run along the bottom of the frame is dropped so the path does not draw
# a line across the crop where his chest is cut off.
contours, _ = cv2.findContours((alpha > 110).astype(np.uint8),
                               cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
outline = []
if contours:
    biggest_contour = max(contours, key=cv2.contourArea)
    epsilon = 0.0006 * cv2.arcLength(biggest_contour, True)
    points = [tuple(pt[0]) for pt in cv2.approxPolyDP(biggest_contour, epsilon, True)]

    floor = PH * 0.965
    on_floor = [i for i, (_, y) in enumerate(points) if y >= floor]
    if on_floor:
        # Start just after the last floor point so the open path runs up one
        # side, over the head and back down the other.
        start = (on_floor[-1] + 1) % len(points)
        ordered = points[start:] + points[:start]
        points = [pt for pt in ordered if pt[1] < floor]

    outline = [[round(x / PW, 5), round(y / PH, 5)] for x, y in points]
print(f"outline: {len(outline)} points")

meta = {
    "size": [PW, PH],
    "outline": outline,
    "face": {"x": float(fx / PW), "y": float(fy / PH), "w": float(fw / PW), "h": float(fh / PH)},
    "anchors": anchors,
}
(out / "face.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
print(json.dumps(anchors, indent=2))
