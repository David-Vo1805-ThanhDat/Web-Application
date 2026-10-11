import json, sys, wave
import numpy as np
from faster_whisper import WhisperModel
m = WhisperModel(sys.argv[2], device="cpu", compute_type="int8")
w = wave.open(sys.argv[1]); audio = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
segs, info = m.transcribe(audio, language="vi", word_timestamps=True, vad_filter=False, beam_size=5)
out = []
for s in segs:
    out.append({"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip(),
                "words": [[round(w.start, 2), round(w.end, 2), w.word] for w in s.words]})
json.dump(out, open(sys.argv[3], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for s in out: print("%6.2f-%6.2f  %s" % (s["start"], s["end"], s["text"]))
