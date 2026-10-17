# Word-miss rate of Supertonic Swedish on regression.txt, through the real
# server pipeline, on 4 voices. Run after changing respelling rules.
#   python -I tools/sv-loop/regress.py
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))  # -I drops the script dir
from common import Server, tts_stt, missed_words, norm

PORT = int(os.environ.get("REGRESS_PORT", "3198"))
VOICES = ["F1", "M1", "F3", "M3"]
here = os.path.dirname(os.path.abspath(__file__))
sentences = [s for s in open(os.path.join(here, "regression.txt"), encoding="utf8").read().split("\n") if s.strip()]
srv = Server(PORT, os.path.expanduser("~/.cache/tts-spike/regress-server.log")); srv.restart()
total = miss = 0; per_word = {}
try:
    for v in VOICES:
        for s in sentences:
            m = missed_words(s, tts_stt(PORT, s, v))
            total += len(norm(s)); miss += len(m)
            for w in m: per_word[w] = per_word.get(w, 0) + 1
finally:
    srv.stop()
print(f"word-miss rate {miss / total:.2%} ({miss}/{total}) over {len(sentences)} sentences x {len(VOICES)} voices")
print("missed:", json.dumps(sorted(per_word.items(), key=lambda kv: -kv[1]), ensure_ascii=False))
