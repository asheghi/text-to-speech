# Test a candidate respelling rule on 4 voices before adding it to swedishRespell.ts.
#   python -I tools/sv-loop/ruletest.py 'pattern' 'replacement' word1,word2,...
# A word passes a voice when KB-Whisper hears the original word in a carrier sentence.
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))  # -I drops the script dir
from common import Server, tts_stt, heard

PORT = int(os.environ.get("RULETEST_PORT", "3197"))
VOICES = ["F1", "M1", "F3", "M3"]
pat, rep, words = sys.argv[1], sys.argv[2], sys.argv[3].split(",")
srv = Server(PORT, os.path.expanduser("~/.cache/tts-spike/ruletest-server.log")); srv.restart()
car = "Nu säger jag ordet {} en gång till."
try:
    for w in words:
        alt = re.sub(pat, rep, w)
        o = sum(heard(w, tts_stt(PORT, car.format(w), v)) for v in VOICES)
        a = sum(heard(w, tts_stt(PORT, car.format(alt), v)) for v in VOICES) if alt != w else o
        print(f"{w:14s} orig {o}/4   {alt:14s} {a}/4", flush=True)
finally:
    srv.stop()
