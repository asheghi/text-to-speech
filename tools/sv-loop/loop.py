# Closed TTS -> STT loop for Supertonic Swedish (see docs/swedish-tts-quality.md).
#
# Synthesises corpus sentences through a local copy of the real server, transcribes
# them with KB-Whisper, confirms consistent word errors on two voices, searches
# rule-based respellings and writes accepted ones to
# server/lib/swedishRespell.auto.json. State is kept in WORK so a run resumes.
#
#   python -I tools/sv-loop/loop.py <work-dir> <corpus.txt> [batch=60]
#   RETRY="word1 word2" ... re-tests specific words before continuing.
# Needs: torch (CUDA recommended), transformers, librosa, soundfile, num2words, requests.
import io, json, os, re, subprocess, sys, time
import requests, soundfile as sf, librosa, torch
from transformers import pipeline
from num2words import num2words

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
LEX = f"{REPO}/server/lib/swedishRespell.auto.json"
WORK, CORPUS = sys.argv[1], sys.argv[2]
BATCH = int(sys.argv[3]) if len(sys.argv) > 3 else 60
PORT = int(os.environ.get("LOOP_PORT", "3199"))
MODEL = "supertonic-3-sv-int8"
VOICES = ["F1", "M1"]
MIN_FREQ = 2  # only chase words that recur; one-off compounds are not worth an entry
os.makedirs(WORK, exist_ok=True)
LOG = open(f"{WORK}/log.jsonl", "a", encoding="utf8")
STATE_F = f"{WORK}/state.json"
state = json.load(open(STATE_F)) if os.path.exists(STATE_F) else {"done": 0, "rejected": {}, "rounds": []}


def log(**kw):
    kw["t"] = time.strftime("%H:%M:%S")
    LOG.write(json.dumps(kw, ensure_ascii=False) + "\n"); LOG.flush()
    print(json.dumps(kw, ensure_ascii=False), flush=True)


server = None
def start_server():
    global server
    if server:
        server.terminate(); server.wait()
    env = dict(os.environ, PORT=str(PORT), RATE_LIMIT_MAX="100000000", NO_AUDIO_CACHE="true",
               LD_LIBRARY_PATH=f"{REPO}/node_modules/sherpa-onnx-linux-x64")
    server = subprocess.Popen(["bun", "server/index.ts"], cwd=REPO, env=env,
                              stdout=open(f"{WORK}/server.log", "a"), stderr=subprocess.STDOUT)
    for _ in range(120):
        try:
            requests.get(f"http://localhost:{PORT}/api/tts.wav", timeout=2); return
        except Exception:
            time.sleep(1)
    raise RuntimeError("server did not start")


device = "cuda" if torch.cuda.is_available() else "cpu"
asr = pipeline("automatic-speech-recognition", model="KBLab/kb-whisper-medium", device=device,
               torch_dtype=torch.float16 if device == "cuda" else torch.float32,
               generate_kwargs={"language": "sv", "task": "transcribe"})

# Mirror normalizeSwedish's abbreviation expansion so references match what is spoken.
ABBR = [(r"\bt\.\s?ex\.", "till exempel"), (r"\bbl\.\s?a\.", "bland annat"), (r"\bosv\.", "och så vidare"),
        (r"\bd\.?\s?v\.?\s?s\.?", "det vill säga"), (r"\bfr\.\s?o\.\s?m\.", "från och med"),
        (r"\bt\.\s?o\.\s?m\.", "till och med"), (r"\bca\b\.?", "cirka"), (r"\bp\.\s?g\.\s?a\.", "på grund av"),
        (r"\bm\.\s?fl\.", "med flera"), (r"\bnr\b\.?", "nummer")]


def norm(s):
    for pat, rep in ABBR:
        s = re.sub(pat, rep, s, flags=re.I)
    s = re.sub(r"\d+", lambda m: " " + num2words(int(m.group()), lang="sv") + " ", s.lower())
    return re.sub(r"[^\wåäöéü ]", " ", s).split()


def tts_stt(text, voice):
    r = requests.get(f"http://localhost:{PORT}/api/tts.wav", timeout=300,
                     params={"text": text, "model": MODEL, "voiceStyle": voice, "steps": 8})
    r.raise_for_status()
    a, sr = sf.read(io.BytesIO(r.content), dtype="float32")
    return asr(librosa.resample(a, orig_sr=sr, target_sr=16000))["text"].strip()


def heard(word, hyp):
    h = norm(hyp)
    return word in h or word in "".join(h)


def carrier(w):
    return f"Nu säger jag ordet {w} en gång till."


FRONT = "eiyäö"
RULES = [
    (rf"k(?=[{FRONT}])", "kk"), (rf"k(?=[{FRONT}])", "tj"), (rf"g(?=[{FRONT}])", "gg"),
    (r"stj", "sj"), (r"skj", "sj"), (r"(?<=[aeiouyåäö])g$", "j"), (r"(?<=[aeiouyåäö])gn", "ngn"),
    (r"(?<=[ei])g(?=[^aeiouyåäö])", "j"), (r"rr", "r"),
    (rf"g(?=[{FRONT}])", "j"), (r"g(?=[ei])", "sj"), (r"(?<!s)j", "sj"), (r"ch", "sj"),
    (r"sch", "sj"), (r"sh", "sj"), (rf"sk(?=[{FRONT}])", "ssk"), (rf"sk(?=[{FRONT}])", "sj"),
    (r"tion", "sjon"), (r"ssion", "sjon"), (r"c(?=[eiy])", "s"), (r"c(?![eiyhk])", "k"),
    (r"ph", "f"), (r"th", "t"), (r"w", "v"), (r"z", "s"), (r"qu", "kv"), (r"é", "e"),
    (r"x", "ks"), (r"eu", "ev"), (r"ou", "o"), (r"y(?=[aeiouåäö])", "j"),
    (r"([bdfglmnprst])(?=[aeiouyåäö]$)", r"\1\1"), (r"([bdfgklmnprst])\1", r"\1"),
]


def candidates(w):
    out = []
    for pat, rep in RULES:
        c = re.sub(pat, rep, w, count=1)
        if c != w and c not in out:
            out.append(c)
    return out[:14]


def try_fix(w, sent):
    orig = [heard(w, tts_stt(carrier(w), v)) for v in VOICES]
    if any(orig):
        log(event="not_consistent", word=w, orig=orig); return None
    for c in candidates(w):
        if all(heard(w, tts_stt(carrier(c), v)) for v in VOICES):
            in_ctx = re.sub(rf"(?i)\b{re.escape(w)}\b", c, sent, count=1)
            if heard(w, tts_stt(in_ctx, "F1")):
                return c
    return None


def load_lex(): return json.load(open(LEX, encoding="utf8"))
def save_lex(d): json.dump(dict(sorted(d.items())), open(LEX, "w", encoding="utf8"), ensure_ascii=False, indent=2)


sentences = [s for s in open(CORPUS, encoding="utf8").read().split("\n") if s.strip()]
FREQ = {}
for s in sentences:
    for w in norm(s):
        FREQ[w] = FREQ.get(w, 0) + 1

start_server()
for w in os.environ.get("RETRY", "").split():
    sent = next((s for s in sentences if re.search(rf"(?i)\b{re.escape(w)}\b", s)), carrier(w))
    c = try_fix(w, sent)
    if c:
        lex = load_lex(); lex[w] = c; save_lex(lex); log(event="accepted", word=w, respell=c)
    else:
        log(event="no_fix", word=w)

while state["done"] < len(sentences):
    batch = sentences[state["done"]: state["done"] + BATCH]
    n_words = n_miss = 0; missed = {}
    for s in batch:
        h = norm(tts_stt(s, "F1")); hj = "".join(h); ref = norm(s)
        miss = [w for w in ref if w not in h and w not in hj]
        n_words += len(ref); n_miss += len(miss)
        for w in miss:
            if len(w) >= 3:
                missed.setdefault(w, s)
    rate = n_miss / max(1, n_words)
    log(event="round", start=state["done"], sentences=len(batch), miss_rate=round(rate, 4), missed=list(missed))
    lex = load_lex(); added = []
    for w, sent in sorted(missed.items(), key=lambda kv: -FREQ.get(kv[0], 0)):
        if w in lex or w in state["rejected"]:
            continue
        if FREQ.get(w, 0) < MIN_FREQ:
            log(event="rare_skip", word=w); continue
        c = try_fix(w, sent)
        if c:
            lex[w] = c; added.append([w, c]); save_lex(lex); log(event="accepted", word=w, respell=c)
        else:
            state["rejected"][w] = sent; log(event="no_fix", word=w)
    state["done"] += len(batch)
    state["rounds"].append({"start": state["done"] - len(batch), "miss_rate": rate, "added": added})
    json.dump(state, open(STATE_F, "w"), ensure_ascii=False, indent=1)
    if added:
        start_server()
log(event="finished", rounds=len(state["rounds"]))
server.terminate()
