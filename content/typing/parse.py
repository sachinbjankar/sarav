import os, re, json, sys, hashlib, statistics, collections
RAW = '/home/claude/tp/raw'
DEV = str.maketrans('०१२३४५६७८९', '0123456789')
out = []
skipped = []

def clean_lines(lines):
    keep = []
    for l in lines:
        s = l.strip()
        if not s: keep.append(''); continue
        if re.search(r'P\.?T\.?O', s): continue
        if re.fullmatch(r'[\d२०-९\[\]\-/ ()_.्]{0,4}[\d२०-९]{1,3}[-/ ][\d२०-९]{3}[\]/ \d२०-९]*.*', s) and len(s) < 40: continue
        if re.fullmatch(r'[\d\[\] ]{1,6}', s): continue
        keep.append(l.rstrip())
    return keep

def paragraphs(lines, layout):
    paras, cur = [], []
    ne = [l for l in lines if l.strip()]
    if not ne: return []
    med = statistics.median(len(l.strip()) for l in ne)
    for i, l in enumerate(lines):
        s = l.strip()
        if not s:
            if cur: paras.append(cur); cur = []
            continue
        if layout and cur:
            ind = len(l) - len(l.lstrip())
            base = min(len(x) - len(x.lstrip()) for x in ne)
            if ind >= base + 3:
                paras.append(cur); cur = []
        cur.append(s)
        if not layout and len(s) < 0.6 * med:
            paras.append(cur); cur = []
    if cur: paras.append(cur)
    res = []
    for p in paras:
        t = ''
        for s in p:
            if t.endswith('-') and not t.endswith(' -') and re.match(r'[a-z]', s):
                t = t[:-1] + s
            elif t.endswith('/'):
                t += s
            else:
                t = (t + ' ' + s) if t else s
        res.append(re.sub(r'\s+', ' ', t).strip())
    return [r for r in res if r]

for fn in sorted(os.listdir(RAW)):
    txt = open(os.path.join(RAW, fn), encoding='utf-8').read()
    src = 'text' if '#SRC text' in txt else 'ocr'
    txt = txt.replace('#SRC text', '').replace('#SRC ocr-mar', '')
    lang = 'en' if fn.startswith('English') else 'mr'
    folder_speed = int(re.search(r'-(\d\d)_', fn).group(1))
    year = int(re.search(r'_(20\d\d)_', fn).group(1))
    m = re.search(r'\((\d\d) Words Per Minute\)', txt) or re.search(r'\(([०-९]{2}) शब्द प्रति', txt)
    speed = int(m.group(1).translate(DEV)) if m else folder_speed
    if not re.search(r'SECTION\s*-\s*II\b|विभाग\s*-\s*२|विभाग\s*-\s*2', txt):
        skipped.append((fn, 'not section II')); continue
    dm = re.search(r'\b(\d{1,2})\s+(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER),?\s+(20\d\d)', txt)
    date = f"{dm.group(1)} {dm.group(2).title()} {dm.group(3)}" if dm else None
    cm = re.search(r'(\d{2})[/-](\d{3})', txt.translate(DEV))
    code = f"{cm.group(1)}-{cm.group(2)}" if cm else fn
    lines = txt.split('\n')
    start = None
    for i, l in enumerate(lines[:30]):
        if re.search(r'Marks\s*:\s*40|on the left\.\s*$|\[\s*गुण|टंकलिखित करा|करू नका\.?\)?\s*$|करू नये\.?\)?\s*$', l): start = i + 1
    while start is not None and start < len(lines) and len(lines[start].strip()) < 12: start += 1
    if start is None:
        skipped.append((fn, 'no start')); continue
    body = clean_lines(lines[start:])
    # drop repeated headers on page 2 (if any)
    paras = paragraphs(body, layout=(src == 'text'))
    text = '\n'.join(paras)
    words = len(text.split())
    h = hashlib.md5(re.sub(r'\W', '', text)[:400].encode()).hexdigest()[:10]
    out.append(dict(file=fn, lang=lang, speed=speed, year=year, date=date, code=code, src=src, words=words, hash=h, text=text))

# dedupe
seen = {}; uniq = []
for o in out:
    if o['hash'] in seen: continue
    seen[o['hash']] = o; uniq.append(o)
json.dump(uniq, open('/home/claude/tp/passages_raw.json', 'w'), ensure_ascii=False, indent=1)
print('parsed', len(out), 'unique', len(uniq), 'skipped', skipped)
c = collections.Counter((o['lang'], o['speed'], o['year']) for o in uniq)
for k in sorted(c): print(k, c[k])
ws = collections.defaultdict(list)
for o in uniq: ws[(o['lang'], o['speed'])].append(o['words'])
for k, v in sorted(ws.items()): print(k, min(v), statistics.median(v), max(v))
