# Original score + SFX for the Smart Pantry brag. 120 BPM, C major, one shared reverb.
import numpy as np, wave

SR = 44100
DUR = 23.5
N = int(SR * DUR)
rng = np.random.default_rng(7)
music = np.zeros((N, 2))
sfx = np.zeros((N, 2))

def hz(m): return 440 * 2 ** ((m - 69) / 12)
def env(n, a, r, curve=4.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-curve * t / max(r, 1e-4))
    fade = np.minimum(1, (n - np.arange(n)) / (0.01 * SR))
    return e * fade
def add(buf, t0, sig, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N: return
    sig = sig[: N - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[i:i + len(sig), 0] += sig * gain * l
    buf[i:i + len(sig), 1] += sig * gain * r
def tone(m, d, harm=(1, .3, .1), a=0.005, r=None, curve=4.0, detune=0.0):
    n = int(d * SR); t = np.arange(n) / SR; f = hz(m) * (1 + detune)
    s = sum(h * np.sin(2 * np.pi * f * (k + 1) * t) for k, h in enumerate(harm))
    return s * env(n, a, r or d, curve)
def lowpass(x, cut):
    a = np.exp(-2 * np.pi * cut / SR); y = np.empty_like(x); acc = 0.0
    for i in range(len(x)):  # short signals only
        acc = (1 - a) * x[i] + a * acc; y[i] = acc
    return y
def noise(d): return rng.standard_normal(int(d * SR))

BEAT = 0.5
# chords per 2s bar: C  Am  F  G
CHORDS = [[48, 55, 60, 64, 67], [45, 52, 57, 60, 64], [41, 48, 53, 57, 60], [43, 50, 55, 59, 62]]
bars = int(np.ceil(DUR / 2))
END = 21.2  # final resolve

# pad (all the way through, swells in)
for b in range(bars):
    t0 = b * 2.0
    if t0 >= END: break
    ch = CHORDS[b % 4]
    for m in ch[1:]:
        for dt, pan in ((-0.004, -0.5), (0.004, 0.5)):
            s = tone(m, 2.3, harm=(1, .25, .08, .03), a=0.35, curve=0.6, detune=dt)
            add(music, t0, s, 0.035 * (0.55 if t0 < 3 else 1), pan)

# pluck arp in 8ths (starts at reveal)
pattern = [0, 2, 3, 4, 3, 2, 1, 2]
for b in range(bars):
    ch = CHORDS[b % 4]
    for k in range(8):
        t0 = b * 2.0 + k * 0.25
        if t0 < 3.25 or t0 >= END: continue
        m = ch[1 + pattern[k] % 4] + 12
        add(music, t0, tone(m, 0.35, harm=(1, .5, .15), curve=9), 0.07, -0.35 if k % 2 else 0.35)

# bass on beats (from reveal), kick + hats from 6.3 (dashboard)
for i in range(int(DUR / BEAT)):
    t0 = i * BEAT
    if t0 >= END: break
    root = CHORDS[int(t0 // 2) % 4][0] - 12
    if t0 >= 3.0:
        add(music, t0, tone(root, 0.45, harm=(1, .15), a=0.01, curve=5), 0.16)
    if t0 >= 6.0:
        n = int(0.25 * SR); tt = np.arange(n) / SR
        kick = np.sin(2 * np.pi * (45 * tt + 60 * (1 - np.exp(-tt * 30)) / 30)) * np.exp(-tt * 14)
        add(music, t0, kick, 0.33)
        hat = np.diff(noise(0.06), prepend=0) * env(int(0.06 * SR), 0.001, 0.06, 6)
        add(music, t0 + 0.25, hat, 0.018, 0.3)
# hook: clock tick-tock (the spinach countdown)
for i, t0 in enumerate(np.arange(0.0, 3.0, 0.5)):
    n = int(0.03 * SR)
    tick = np.sin(2 * np.pi * (hz(84) if i % 2 == 0 else hz(79)) * np.arange(n) / SR) * env(n, 0.0005, 0.03, 8)
    add(music, t0, tick, 0.07, 0.2 if i % 2 else -0.2)

# final resolve: C major bloom at the lockup
for m, pan in zip([48, 55, 60, 64, 67, 72, 76], [-.6, -.3, 0, .3, .6, -.2, .2]):
    add(music, END, tone(m, 2.3, harm=(1, .35, .1, .05), a=0.02, curve=1.6), 0.05, pan)

# ---- SFX (in key, soft) ----
def whoosh(t_end, d=0.35, g=0.05):
    n = int(d * SR); x = noise(d) * (np.linspace(0, 1, n) ** 2) * np.minimum(1, (n - np.arange(n)) / (0.04 * SR))
    add(sfx, t_end - d, lowpass(x, 2500), g)
def pluck(t, m, g=0.06, pan=0.0): add(sfx, t, tone(m, 0.4, harm=(1, .4, .1), curve=10), g, pan)
def chime(t, ms, g=0.05, gap=0.08):
    for i, m in enumerate(ms): add(sfx, t + i * gap, tone(m, 0.9, harm=(1, .2, .12), curve=5), g, (-0.3, 0.3)[i % 2])

pluck(0.05, 67, 0.08)                   # card lands
chime(0.9, [84], 0.035); chime(1.9, [84], 0.03)  # badge pulses
whoosh(3.3); chime(3.3, [60, 67, 72], 0.05)       # reveal
whoosh(6.4, 0.4, 0.04)                   # window rises
for i, m in enumerate([72, 74, 76, 79]): pluck(6.8 + i * 0.08, m, 0.03, -0.4 + 0.27 * i)  # stat cards
for i, m in enumerate([72, 76, 79]): pluck(7.6 + i * 0.18, m + 12, 0.025)            # use-these-first rows
whoosh(10.9, 0.55, 0.045)               # camera zoom
n = int(1.1 * SR); tt = np.arange(n) / SR   # progress-bar rise
f = hz(60) * 2 ** (tt / 1.1 * 1.0); rise = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / 1.1) ** 2
add(sfx, 11.0, rise, 0.025)
add(sfx, 13.0, lowpass(noise(0.015), 5000) * env(int(0.015 * SR), 0.0005, 0.015, 6), 0.12)  # click
chime(13.15, [76, 79], 0.045)            # toast
for k in range(0, 41, 2):                # typing
    t = 15.1 + 0.7 * k / 41
    add(sfx, t, lowpass(noise(0.012), 3500) * env(int(0.012 * SR), 0.0005, 0.012, 6), 0.05, rng.uniform(-.3, .3))
pluck(15.88, 72, 0.05)                   # send
chime(16.45, [69, 72], 0.04, 0.06)       # reply lands
whoosh(19.5, 0.35, 0.04); chime(19.5, [72, 76, 79, 84], 0.04, 0.05)  # the spinach lives
whoosh(21.2, 0.3, 0.035)

# ---- shared reverb bus, mix, master ----
def reverb(x, d=1.4, wet=0.22):
    n = int(d * SR); ir = rng.standard_normal((n, 2)) * np.exp(-np.arange(n) / SR * 4.5)[:, None]
    ir[: int(0.012 * SR)] = 0; ir /= np.sqrt((ir ** 2).sum(0))
    L = 1 << int(np.ceil(np.log2(len(x) + n)))
    y = np.stack([np.fft.irfft(np.fft.rfft(x[:, c], L) * np.fft.rfft(ir[:, c], L), L)[: len(x)] for c in range(2)], 1)
    return x + wet * y
mix = reverb(music + sfx)
mix *= np.minimum(1, np.minimum(np.arange(N) / (0.03 * SR), (N - np.arange(N)) / (0.9 * SR)))[:, None]
mix = np.tanh(mix / np.abs(mix).max() * 1.2) ; mix *= 0.89 / np.abs(mix).max()
with wave.open('audio.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
print('ok', mix.shape)
