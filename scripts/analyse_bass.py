"""Find the bass in a track, and say when it moves.

The about sequence has a background that is supposed to react to the bass
and to nothing else. Doing that from a live analyser alone is unreliable:
the analyser only exists once audio is decoding, it is silent while the
file buffers, and it gives you the present moment with no idea what is
coming. So the track is analysed once, here, and the result is shipped
as a small JSON file the page reads.

What comes out:

    envelope  low-band energy per frame, 0..1, smoothed. The background
              is driven directly from this, so it is in sync with the
              music whether or not Web Audio ever starts.
    glides    stretches where a sustained bass note sweeps in pitch —
              energy held high while the low-band centroid travels.
    drops     sharp arrivals of low-end energy.

Run:  python -I scripts/analyse_bass.py about/song1.wav
"""

import json
import sys
import wave
from pathlib import Path

import numpy as np

FPS = 30            # envelope frames per second
LOW_HZ = (25, 130)  # what counts as bass
WORK_RATE = 11025   # analysed at this rate; nothing up here matters for bass
WINDOW = 2048

# A glide is a bass note MOVING IN PITCH. Energy alone will not do: on a
# track with bass under most of it, "the bass is loud" is true nearly
# everywhere and says nothing. What is distinctive is the note sweeping,
# so the dominant low frequency is tracked and its rate of travel is what
# gets thresholded.
GLIDE_SPEED = 25.0      # Hz per second the note has to be travelling
GLIDE_FLOOR = 0.25      # and there has to be some low end there at all
GLIDE_MIN_LEN = 0.40    # seconds
GLIDE_JOIN = 0.35       # gaps shorter than this are one glide

# How the background is actually driven. "Bass is present" is true almost
# everywhere on a track like this, so loudness alone would leave the
# equaliser permanently open. What is distinctive is the bass MOVING —
# sweeping in pitch, or arriving hard — so the reaction signal is built
# from those two things and sits near zero the rest of the time.
REACT_SPEED = 55.0   # Hz per second that counts as full movement
REACT_RISE = 1.6     # envelope units per second that counts as a full hit
REACT_HOLD = 0.90    # per-frame decay, so a hit rings on a little

# A drop is a fast arrival of low end.
DROP_RISE = 0.17        # jump in envelope within one hop
DROP_FLOOR = 0.45       # and it has to land somewhere loud
DROP_GAP = 0.35         # seconds before another can be called


def read_mono(path):
    """A wav file as mono float32, plus its sample rate."""
    with wave.open(str(path)) as f:
        channels = f.getnchannels()
        width = f.getsampwidth()
        rate = f.getframerate()
        raw = f.readframes(f.getnframes())

    dtype = {1: np.uint8, 2: np.int16, 4: np.int32}.get(width)
    if dtype is None:
        raise SystemExit(f"{path.name}: {width * 8}-bit wav is not supported")

    samples = np.frombuffer(raw, dtype=dtype).astype(np.float32)
    if width == 1:
        samples = (samples - 128) / 128.0
    else:
        samples /= float(np.iinfo(dtype).max)

    if channels > 1:
        samples = samples.reshape(-1, channels).mean(axis=1)
    return samples, rate


def resample(samples, rate, target):
    """Good enough for an envelope: linear, on a signal we then smooth."""
    if rate == target:
        return samples, rate
    n = int(round(len(samples) * target / rate))
    position = np.linspace(0, len(samples) - 1, n)
    return np.interp(position, np.arange(len(samples)), samples).astype(np.float32), target


def smooth(values, width):
    if width < 2:
        return values
    kernel = np.hanning(width)
    kernel /= kernel.sum()
    return np.convolve(values, kernel, mode="same")


def analyse(path):
    path = Path(path)
    samples, rate = read_mono(path)
    duration = len(samples) / rate
    samples, rate = resample(samples, rate, WORK_RATE)

    hop = max(1, rate // FPS)
    frames = max(1, (len(samples) - WINDOW) // hop + 1)
    window = np.hanning(WINDOW).astype(np.float32)
    freqs = np.fft.rfftfreq(WINDOW, 1 / rate)
    band = (freqs >= LOW_HZ[0]) & (freqs <= LOW_HZ[1])
    band_freqs = freqs[band]

    energy = np.zeros(frames, np.float32)
    pitch = np.zeros(frames, np.float32)

    for i in range(frames):
        chunk = samples[i * hop: i * hop + WINDOW]
        if len(chunk) < WINDOW:
            break
        spectrum = np.abs(np.fft.rfft(chunk * window))
        low = spectrum[band]
        energy[i] = low.sum()
        # The loudest low frequency present. A sweeping note moves this;
        # a held one does not, however loud it is.
        pitch[i] = float(band_freqs[int(np.argmax(low))])

    # Loudness is logarithmic, so the envelope is too, then stretched to 0..1.
    energy = np.log1p(energy * 40)
    energy = smooth(energy, 5)
    if energy.max() > energy.min():
        energy = (energy - energy.min()) / (energy.max() - energy.min())
    pitch = smooth(pitch, 9)

    # How fast the note is travelling, in Hz per second.
    speed = np.abs(np.diff(pitch, prepend=pitch[0])) * FPS
    speed = smooth(speed, 9)

    times = np.arange(frames) / FPS

    # --- glides: the note is moving ---------------------------------------
    moving = (speed >= GLIDE_SPEED) & (energy >= GLIDE_FLOOR)
    spans = []
    i = 0
    while i < frames:
        if not moving[i]:
            i += 1
            continue
        j = i
        while j + 1 < frames and moving[j + 1]:
            j += 1
        spans.append([i, j])
        i = j + 1

    # Join spans separated by a blink — one sweep, not three.
    joined = []
    for span in spans:
        if joined and (span[0] - joined[-1][1]) / FPS <= GLIDE_JOIN:
            joined[-1][1] = span[1]
        else:
            joined.append(span)

    glides = []
    for a, b in joined:
        if (b - a + 1) / FPS < GLIDE_MIN_LEN:
            continue
        note = pitch[a:b + 1]
        glides.append({
            "start": round(float(times[a]), 2),
            "end": round(float(times[b]), 2),
            "fromHz": round(float(note[0]), 1),
            "toHz": round(float(note[-1]), 1),
            "sweepHz": round(float(note.max() - note.min()), 1),
            "peak": round(float(energy[a:b + 1].max()), 3),
        })

    # --- drops: fast arrivals --------------------------------------------
    drops = []
    rise = np.diff(energy, prepend=energy[0])
    last = -DROP_GAP
    for i in range(frames):
        if rise[i] >= DROP_RISE and energy[i] >= DROP_FLOOR and times[i] - last >= DROP_GAP:
            drops.append({
                "t": round(float(times[i]), 2),
                "strength": round(float(min(1.0, rise[i] / DROP_RISE)), 3),
            })
            last = times[i]

    # --- the reaction signal ----------------------------------------------
    # Built from the events, not from the raw pitch tracker. The tracker
    # jitters between harmonics and would have the background twitching
    # through the whole track; the detected glides and drops are the
    # moments that actually read as "the bass moved", so those are what
    # the background is given.
    react = np.zeros(frames, np.float32)

    for g in glides:
        a = int(round(g["start"] * FPS))
        b = int(round(g["end"] * FPS))
        if b <= a:
            continue
        # Raised cosine across the glide: it opens, holds, and closes,
        # rather than switching on at the first frame.
        ramp = 0.5 - 0.5 * np.cos(np.linspace(0, 2 * np.pi, b - a + 1))
        weight = 0.55 + 0.45 * g["peak"]
        react[a:b + 1] = np.maximum(react[a:b + 1], ramp * weight)

    for d in drops:
        i = int(round(d["t"] * FPS))
        tail = np.arange(frames - i)
        hit = d["strength"] * np.power(REACT_HOLD, tail)
        react[i:] = np.maximum(react[i:], hit.astype(np.float32))

    react = smooth(react, 5)
    react = np.clip(react, 0, 1)

    return {
        "file": path.name,
        "duration": round(duration, 2),
        "fps": FPS,
        "band": list(LOW_HZ),
        "envelope": [round(float(v), 3) for v in energy],
        "reaction": [round(float(v), 3) for v in react],
        "glides": glides,
        "drops": drops,
    }


def main():
    source = Path(sys.argv[1] if len(sys.argv) > 1 else "about/song1.wav")
    if not source.exists():
        raise SystemExit(f"no such file: {source}")

    report = analyse(source)

    out = Path("public/media/about") / (source.stem + ".bass.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report), encoding="utf-8")

    print(f"{report['file']}  {report['duration']}s  "
          f"{len(report['envelope'])} frames at {report['fps']}fps")
    print(f"low band {report['band'][0]}-{report['band'][1]} Hz")
    print()
    print(f"glides ({len(report['glides'])}) — a held bass note that sweeps:")
    for g in report["glides"]:
        print(f"   {g['start']:6.2f}s - {g['end']:6.2f}s   "
              f"{g['fromHz']:5.1f} -> {g['toHz']:5.1f} Hz   "
              f"sweep {g['sweepHz']:5.1f} Hz   peak {g['peak']:.2f}")
    print()
    print(f"drops ({len(report['drops'])}) — low end arriving fast:")
    for d in report["drops"]:
        print(f"   {d['t']:6.2f}s   strength {d['strength']:.2f}")
    print()
    react = report["reaction"]
    print("reaction signal — what the background actually moves to:")
    print(f"   mean {sum(react) / len(react):.3f}   "
          f"above 0.5 for {sum(1 for v in react if v > 0.5) / FPS:.1f}s of "
          f"{report['duration']}s")
    print()
    print(f"written: {out}")


if __name__ == "__main__":
    main()
