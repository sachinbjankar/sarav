"""गट-क मुख्य पेपर 2 (2018–2023) — स्वच्छ प्रश्न + आयोगाची अंतिम उत्तरतालिका → public/pyq/<id>.json
usage: python3 content/pyq/build_gc.py <paper-id> [<paper-id> ...]
प्रश्न: content/pyq/<id>.py (Q = [(n, विषय, प्रश्न, [४ पर्याय], img?)])
उत्तरे: content/pyq/gc_keys.json (संच A–D; '#' = रद्द) • आकृत्या: content/pyq/img/<id>/q<n>.png
"""
import json, sys, os, importlib.util, shutil
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.abspath(__file__))
PUB = os.path.join(ROOT, '..', '..', 'public', 'pyq')
KEYS = json.load(open(os.path.join(ROOT, 'gc_keys.json'), encoding='utf-8'))

PAPERS = {
  'grc2023m2': dict(key='667', set='A', title='गट-क मुख्य परीक्षा 2023 — पेपर 2 (सामान्य अध्ययन व बुद्धिमत्ता चाचणी)', short='गट-क मुख्य 2023 (पेपर 2)', date='2023-12-17', post=None),
}
SETCOL = {'A': 0, 'B': 1, 'C': 2, 'D': 3}

def load_q(pid):
    spec = importlib.util.spec_from_file_location(pid, os.path.join(ROOT, pid + '.py'))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m.Q

def fit_img(src, dst):
    im = Image.open(src).convert('L')
    im = ImageOps.crop(im, 0)
    # पांढरी किनार कापा
    bbox = ImageOps.invert(im).point(lambda v: 255 if v > 40 else 0).getbbox()
    if bbox: im = im.crop((max(0, bbox[0] - 12), max(0, bbox[1] - 12), min(im.width, bbox[2] + 12), min(im.height, bbox[3] + 12)))
    if im.width > 1000: im = im.resize((1000, round(im.height * 1000 / im.width)), Image.LANCZOS)
    im = im.quantize(16)
    im.save(dst, optimize=True)

def build(pid):
    meta = PAPERS[pid]; Q = load_q(pid); key = KEYS[meta['key']]; col = SETCOL[meta['set']]
    out, cancelled = [], []
    for row in Q:
        n, s, q, o = row[:4]; img = row[4] if len(row) > 4 else None
        a = key[str(n)][col]
        assert len(o) == 4 and all(x.strip() for x in o), (pid, n, 'options')
        if a == '#': cancelled.append(n); continue
        item = {'n': n, 's': s, 'q': q, 'o': o, 'a': int(a) - 1}
        if img:
            os.makedirs(PUB, exist_ok=True)
            name = f'{pid}-{img}.png'
            fit_img(os.path.join(ROOT, 'img', pid, img + '.png'), os.path.join(PUB, name))
            item['img'] = f'pyq/{name}'
        out.append(item)
    assert [r[0] for r in Q] == list(range(1, len(Q) + 1)), (pid, 'numbering')
    note = f"स्रोत: MPSC प्रश्नपत्रिका (संच {meta['set']}) व आयोगाची अंतिम उत्तरतालिका." + (f" आयोगाने रद्द केलेले प्रश्न {', '.join(map(str, cancelled))} वगळले." if cancelled else '')
    paper = {'id': pid, 'title': meta['title'], 'short': meta['short'], 'exams': ['mpscb', 'talathi', 'zp'],
             'date': meta['date'], 'mins': 60, 'neg': 0.25, 'note': note, 'q': out}
    json.dump(paper, open(os.path.join(PUB, pid + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    # index
    ip = os.path.join(PUB, 'index.json'); idx = json.load(open(ip, encoding='utf-8'))
    entry = {k: paper[k] for k in ('id', 'title', 'short', 'exams', 'date', 'mins', 'neg', 'note')}
    entry['count'] = len(out); entry['file'] = f'pyq/{pid}.json'
    idx = [x for x in idx if x['id'] != pid] + [entry]
    idx.sort(key=lambda x: x['date'], reverse=True)
    json.dump(idx, open(ip, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(pid, 'questions', len(out), 'cancelled', cancelled, 'images', sum(1 for x in out if 'img' in x))

if __name__ == '__main__':
    for pid in sys.argv[1:]: build(pid)
