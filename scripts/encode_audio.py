"""Compress the about-sequence audio for the web.

The WAVs in about/ are the masters and stay that way — the bass analysis
reads them, and they are what you would go back to. What ships is an MP3
beside each one, which is roughly a twentieth of the size and audibly the
same at this bitrate.

This matters more than it sounds: the sequence is timed to the music, and
a 29 MB file that is still buffering is a sequence that starts late.

ffmpeg comes from imageio-ffmpeg, so there is nothing to install
separately and nothing to put on PATH.

Run:  python -I scripts/encode_audio.py        (or: npm run audio)
"""

import subprocess
import sys
from pathlib import Path

BITRATE = "192k"  # transparent enough for music, ~1.4 MB per minute

# Where each track starts and stops, in seconds. Anything not listed is
# used whole. These are the marks Nabil gave for each piece; keeping them
# here rather than cutting the files by hand means the originals stay
# untouched and the cut can be changed by editing one number.
CUTS = {
    "in love with a chore": (15, 62),     # 0:15 to 1:02
    "problem": (0, 51),                   # cut at 0:51
    "how it turned out": (25, 117),       # 0:25 to 1:57
    "want": (72, None),                   # from 1:12 to the end
}


def ffmpeg():
    try:
        import imageio_ffmpeg
    except ImportError:
        raise SystemExit(
            "imageio-ffmpeg is not installed:  pip install imageio-ffmpeg"
        )
    return imageio_ffmpeg.get_ffmpeg_exe()


def web_name(stem):
    """The published filename. Spaces only — underscores are left alone so
    song_loop keeps the name the page already asks for."""
    return stem.lower().replace(" ", "-")


def main():
    source = Path("about")
    if not source.exists():
        raise SystemExit("no about/ directory")

    exe = ffmpeg()
    out = source / "web"
    out.mkdir(exist_ok=True)

    masters = sorted(
        [p for p in source.iterdir()
         if p.suffix.lower() in (".wav", ".mp3", ".m4a", ".flac", ".ogg")]
    )
    # A wav master and an mp3 of the same name are the same track; prefer
    # the wav, since it is the one that has not been through an encoder.
    best = {}
    for master in masters:
        current = best.get(master.stem)
        if current is None or (current.suffix.lower() != ".wav" and master.suffix.lower() == ".wav"):
            best[master.stem] = master

    if not best:
        print("nothing to encode")
        return

    for stem, master in sorted(best.items()):
        target = out / (web_name(stem) + ".mp3")
        if target.exists() and target.stat().st_mtime >= master.stat().st_mtime:
            print(f"  {target.name:28s} up to date")
            continue

        start, stop = CUTS.get(stem, (0, None))
        trim = []
        if start:
            trim += ["-ss", str(start)]
        if stop is not None:
            trim += ["-to", str(stop)]

        subprocess.run(
            [exe, "-y", "-loglevel", "error", *trim,
             "-i", str(master),
             "-codec:a", "libmp3lame", "-b:a", BITRATE,
             str(target)],
            check=True,
        )
        before = master.stat().st_size / 1e6
        after = target.stat().st_size / 1e6
        cut = "whole" if (start, stop) == (0, None) else f"{start}s to {stop if stop is not None else 'end'}"
        print(f"  {target.name:28s} {before:6.1f} MB -> {after:5.2f} MB   {cut}")

    print()
    print("Masters stay in about/. The pipeline publishes about/web/.")


if __name__ == "__main__":
    main()
