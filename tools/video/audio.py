# -*- coding: utf-8 -*-
# Tự tổng hợp âm thanh cho video (không dùng nhạc có bản quyền): nhạc nền marimba vui + hiệu ứng khớp với video.html.
import math, random, struct, wave

SR = 44100
DUR = 38.6
N = int(SR * DUR)
music = [0.0] * N
sfx = [0.0] * N
random.seed(7)

def add(buf, start, samples, gain=1.0):
    i0 = int(start * SR)
    for k, v in enumerate(samples):
        i = i0 + k
        if 0 <= i < N: buf[i] += v * gain

def env_exp(n, k):  # suy giảm mũ
    return [math.exp(-k * i / SR) for i in range(n)]

def tone(f0, f1, dur, vol=0.5, wave='sine', decay=8.0, attack=0.004):
    n = int(dur * SR); out = []; ph = 0.0
    for i in range(n):
        x = i / n; f = f0 * (f1 / f0) ** x; ph += 2 * math.pi * f / SR
        if wave == 'sine': s = math.sin(ph)
        elif wave == 'square': s = 1.0 if math.sin(ph) >= 0 else -1.0
        else: s = 2 / math.pi * math.asin(math.sin(ph))  # tam giác
        a = min(1.0, i / (attack * SR + 1)) * math.exp(-decay * i / SR)
        out.append(s * a * vol)
    return out

def noise(dur, vol=0.5, decay=10.0, lp=0.5, attack=0.003, sweep=None):
    n = int(dur * SR); out = []; y = 0.0
    for i in range(n):
        a_lp = lp if sweep is None else sweep[0] + (sweep[1] - sweep[0]) * (i / n)
        y += a_lp * (random.uniform(-1, 1) - y)
        a = min(1.0, i / (attack * SR + 1)) * math.exp(-decay * i / SR)
        out.append(y * a * vol)
    return out

def marimba(freq, dur=0.6, vol=0.25):
    n = int(dur * SR); out = []
    for i in range(n):
        t = i / SR
        s = math.sin(2 * math.pi * freq * t) * math.exp(-6 * t) + 0.25 * math.sin(2 * math.pi * freq * 3.93 * t) * math.exp(-22 * t)
        out.append(s * vol * min(1, i / 60))
    return out

# ---------------- NHẠC NỀN: 112 bpm, C – G – Am – F ----------------
BPM = 112; B = 60 / BPM
def midi(m): return 440 * 2 ** ((m - 69) / 12)
CHORDS = [[60, 64, 67, 72], [55, 59, 62, 67], [57, 60, 64, 69], [53, 57, 60, 65]]
ROOTS = [36, 31, 33, 29]
ARP = [0, 1, 2, 3, 2, 1, 2, 3]
MUSIC_END = 38.3
bar = 0; t = 0.0
while t < MUSIC_END:
    ch = CHORDS[bar % 4]
    for k in range(8):  # nốt móc đơn
        tt = t + k * B / 2
        if tt >= MUSIC_END: break
        add(music, tt, marimba(midi(ch[ARP[k]] + 12), 0.5, 0.16 if k % 2 == 0 else 0.11))
    for beat in range(4):
        tb = t + beat * B
        if tb >= MUSIC_END: break
        if beat in (0, 2):
            add(music, tb, tone(midi(ROOTS[bar % 4] + 12), midi(ROOTS[bar % 4] + 12), B * 1.6, 0.30, 'tri', 3.5))  # bass
            add(music, tb, tone(130, 45, 0.18, 0.55, 'sine', 14))                                                     # trống kick
        else:
            add(music, tb, noise(0.12, 0.30, 30, 0.85))                                                              # clap
        for h in (0, 0.5):
            add(music, tb + h * B, noise(0.05, 0.10 if h else 0.07, 70, 0.95))                                       # shaker
    t += 4 * B; bar += 1
# hợp âm kết ở màn cuối
for m in (60, 64, 67, 72, 76):
    add(music, 35.0, marimba(midi(m + 12), 1.6, 0.13))
# vào / ra nhạc
for i in range(N):
    tt = i / SR
    g = min(1.0, tt / 1.2) * (1.0 if tt < 37.5 else max(0.0, 1 - (tt - 37.5) / 1.0))
    music[i] *= g * 0.55

# ---------------- HIỆU ỨNG ----------------
def pop(at, vol=0.35, f=760):
    add(sfx, at, tone(f, f * 1.7, 0.09, vol, 'sine', 25))
def whoosh(at, vol=0.35, dur=0.45):
    add(sfx, at - dur * 0.5, noise(dur, vol, 5, sweep=(0.05, 0.6), attack=dur * 0.6))
def chime(at, vol=0.28, notes=(1046.5, 1318.5, 1568.0)):
    for k, f in enumerate(notes):
        add(sfx, at + k * 0.07, tone(f, f, 0.9, vol, 'sine', 5))
        add(sfx, at + k * 0.07, tone(f * 2, f * 2, 0.4, vol * 0.25, 'sine', 9))
def tick(at, vol=0.22):
    add(sfx, at, tone(2400, 1800, 0.018, vol, 'square', 120))
def wheel_ticks(t0, t1, total_deg, step=45):
    last = 0; tt = t0
    while tt <= t1:
        x = min(1, (tt - t0) / (t1 - t0)); r = total_deg * (1 - (1 - x) ** 4)
        if int(r // step) > last: last = int(r // step); tick(tt)
        tt += 0.001

# cảnh 1: đồng hồ, khung chat, tin nhắn, chữ to
pop(0.2, 0.18, 600); whoosh(0.45, 0.18, 0.35)
for a in (0.9, 1.7, 2.35, 3.0): pop(a)
pop(3.7, 0.15, 520)
add(sfx, 3.9, tone(180, 70, 0.35, 0.55, 'sine', 9)); add(sfx, 3.9, noise(0.25, 0.25, 18, 0.3))  # "bụp" chữ to
# chuyển cảnh
for a in (5.6, 10.2, 15.2, 20.8, 26.6, 31.6): whoosh(a)
whoosh(34.7, 0.45, 0.6)
# cảnh 2: điện thoại trượt vào
pop(5.95, 0.16, 500)
# cảnh 3: vòng quay
SPIN3 = 360 * 5 + (270 - 157.5); SPIN4 = 360 * 4 + (270 - 10.5)
wheel_ticks(11.0, 13.6, SPIN3); chime(13.85)
# cảnh 4: vòng quay nhóm
wheel_ticks(17.0, 19.4, SPIN4); chime(19.65, 0.26, (880, 1108.7, 1318.5))
# cảnh 5: hộp quà — mốc đo trực tiếp trong clip (clip bắt đầu 21.5 s): hộp phóng to 1,76; súng bắn 2,60; nổ 2,96; thẻ kết quả 3,24
K = 21.5
add(sfx, K + 1.70, tone(1400, 900, 0.05, 0.25, 'sine', 40))                       # chạm
add(sfx, K + 2.15, noise(0.22, 0.22, 12, 0.5, sweep=(0.2, 0.7)))                 # lên đạn sột soạt
add(sfx, K + 2.60, tone(1500, 260, 0.16, 0.30, 'square', 18))                     # "pằng" súng đồ chơi
add(sfx, K + 2.60, noise(0.08, 0.25, 40, 0.9))
add(sfx, K + 2.96, tone(110, 38, 0.7, 0.75, 'sine', 5))                           # "bùm"
add(sfx, K + 2.96, noise(0.8, 0.55, 5, 0.12))
chime(K + 3.28, 0.24)
# cảnh 6: 4 dấu tích
for i in range(4): pop(27.75 + i * 0.65, 0.2, 980)
# cảnh 7: tin nhắn chốt kèo
for a in (32.1, 32.7, 33.2, 33.7): pop(a)
# màn kết: logo + FoodBot
chime(35.05, 0.3, (1046.5, 1318.5, 1568.0, 2093.0))
add(sfx, 35.6, tone(300, 620, 0.25, 0.3, 'sine', 8))

# ---------------- GIỌNG ĐỌC CỦA NHÓM (voice/clean.wav, thu liền 1 file) ----------------
# (đoạn trong file ghi âm: từ, đến, đặt vào giây) — mốc lấy từ Whisper (voice/asr-small.json)
VOICE = [
    (0.85, 4.95, 0.60),    # Bảy giờ tối. Cả nhóm lại hỏi nhau: ăn gì bây giờ?  ("ăn gì bây giờ" trùng chữ to)
    (5.20, 9.95, 5.65),    # Mở Hôm Nay Ăn Gì. Vòng quay may mắn nằm ngay trang chủ.
    (10.40, 14.55, 10.79), # Lọc theo ngân sách, khẩu vị rồi quay. Phở bò Hà Nội!  ("Phở" trùng lúc ra kết quả)
    (15.10, 20.85, 15.20), # Đi cả nhóm? Mỗi người đề cử một món...
    (21.25, 21.95, 21.00), # Chán
    (22.45, 24.85, 21.70), # quay thì bắn hộp quà bí ẩn.  (bỏ bớt 0,5 s nghỉ)
    (25.08, 25.45, 24.02), # Pằng!  (trùng lúc súng bắn)
    (25.92, 27.62, 24.70), # Món trúng hiện ra ngay.  (trùng lúc thẻ kết quả hiện)
    (27.62, 32.85, 26.80), # Món nào cũng có nguyên liệu, cách nấu, dinh dưỡng và quán gợi ý.
    (32.95, 38.00, 33.00), # Chốt kèo trong vài giây. Hôm Nay Ăn Gì? ("Hôm Nay Ăn Gì" trùng logo) Đăng ký miễn phí ngay thôi nào!
]
with wave.open('voice/clean.wav') as w:
    assert w.getframerate() == SR and w.getnchannels() == 1
    raw = w.readframes(w.getnframes())
vsrc = [v / 32768 for v in struct.unpack('<%dh' % (len(raw) // 2), raw)]
voice = [0.0] * N
active = [0.0] * N
FADE = int(0.012 * SR)
for a, b, at in VOICE:
    seg = vsrc[int(a * SR):int(b * SR)]
    L = len(seg)
    for k in range(L):
        g = min(1.0, k / FADE, (L - 1 - k) / FADE)
        i = int(at * SR) + k
        if 0 <= i < N: voice[i] += seg[k] * g; active[i] = 1.0
# nhạc nhỏ lại khi có giọng (lên/xuống mượt 0,15 s)
duck = [1.0] * N; cur = 1.0; step = 1 / (0.15 * SR)
for i in range(N):
    target = 0.38 if active[i] else 1.0
    cur += max(-step, min(step, target - cur)); duck[i] = cur

# ---------------- TRỘN + GHI FILE ----------------
mix = [music[i] * duck[i] + sfx[i] * (0.8 if active[i] else 1.0) + voice[i] * 1.6 for i in range(N)]
peak = max(abs(v) for v in mix) or 1
scale = 0.89 / peak
with wave.open('soundtrack.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, v * scale)) * 32767)) for v in mix))
print('soundtrack.wav', DUR, 's, peak', round(peak, 2))
