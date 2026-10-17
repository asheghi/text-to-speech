# Build an everyday-Swedish corpus from Swedish Wikipedia article extracts.
# Keeps 5-16 word sentences with no digits, brackets or capitalised words after
# the first (filters out names and species). Usage: python -I corpus.py out.txt
import json, re, random, urllib.request, urllib.parse, sys, time
T = """Sverige Stockholm Mat Skola Fotboll Midsommar Kaffe Sjukvård Musik Bil Väder Familj Internet Jul Hund Kök Arbete Semester Trädgård Sömn Bröd Cykel Sjuksköterska Restaurang Ekonomi
Katt Häst Fågel Skog Sjö Hav Berg Vinter Sommar Höst Vår Regn Snö Kläder Sko Hus Lägenhet Möbel Tåg Buss Flygplan Båt Sjukhus Läkare Tandläkare Apotek Bank Pengar Affär Marknad Fisk Kött Grönsak Frukt Äpple Potatis
Ost Mjölk Te Öl Vin Glass Choklad Godis Tårta Film Teater Bok Tidning Radio Television Dator Mobiltelefon Spel Sport Ishockey Skidåkning Simning Löpning Dans Konst Fotografi Kyrka Språk Svenska Historia
Demokrati Riksdag Kommun Polis Brandkår Universitet Förskola Lärare Student Kärlek Vänskap Bröllop Barn Hälsa Träning Kroppen Hjärta Hjärna Tand Öga Öra Hud Väg Gata Bro Stad By Bondgård Ko Gris Får Höna
Fjäril Bi Myra Blomma Träd Gräs Sol Måne Stjärna Klocka Kalender Vecka Månad År Födelsedag Present Leksak Docka Boll Cykelhjälm Ryggsäck Paraply Jacka Mössa Vante Strumpa Byxor Klänning Skjorta Tröja""".split()
out, seen = [], set()
for t in T:
    u = "https://sv.wikipedia.org/w/api.php?" + urllib.parse.urlencode(dict(action="query", format="json", prop="extracts", explaintext=1, titles=t, redirects=1))
    for _ in range(4):
        try:
            d = json.load(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "tts-research/1.0 (asheghi.bm@gmail.com)"}))); break
        except Exception:
            time.sleep(15)
    else:
        continue
    for p in d["query"]["pages"].values():
        for s in re.split(r"(?<=[.!?])\s+", p.get("extract", "").replace("\n", " ")):
            s = s.strip(); w = s.split()
            if 5 <= len(w) <= 16 and not re.search(r"[0-9()\[\]=:;/–—\"]", s) and s.endswith(".") and not re.search(r"\s[A-ZÅÄÖ]", s) and s not in seen:
                out.append(s); seen.add(s)
    time.sleep(3)
random.seed(2); random.shuffle(out)
open(sys.argv[1], "w", encoding="utf8").write("\n".join(out))
print(len(out))
