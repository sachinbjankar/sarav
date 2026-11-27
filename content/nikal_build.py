# निकालापूर्वी निकाल — परीक्षा माहिती तयार करणे.
# नवीन परीक्षेसाठी: प्रश्नपत्रिका (pyq JSON) व प्रत्येक संचाची उत्तरतालिका येथे जोडा, मग `python3 content/nikal_build.py`.
import json, os
ROOT = os.path.join(os.path.dirname(__file__), '..', 'public')

def from_pyq(pyq_id, total, cancelled, marks, neg, status, exams, title, short, date, demo):
    p = json.load(open(f'{ROOT}/pyq/{pyq_id}.json'))
    by_n = {x['n']: x['a'] for x in p['q']}
    keyA = [None if n in cancelled else by_n[n] for n in range(1, total + 1)]
    assert sum(k is not None for k in keyA) == total - len(cancelled)
    return {
        'id': pyq_id, 'title': title, 'short': short, 'exams': exams, 'date': date, 'count': total,
        'marks': marks, 'neg': neg, 'status': status, 'demo': demo,
        'series': {'A': {'key': keyA}},   # संच B/C/D: प्रश्नांचा क्रम वेगळा — त्यांची उत्तरतालिका मिळाल्यावर जोडा
        'qfile': f'pyq/{pyq_id}.json',     # प्रश्न पाहण्यासाठी (संच A क्रमाने)
    }

exams = [
    from_pyq('rajya2023-gs1', 100, {38, 75}, 2, 0.25, 'final', ['mpsc'],
             'राज्यसेवा पूर्व परीक्षा 2023 — सामान्य अध्ययन पेपर 1', 'राज्यसेवा पूर्व 2023 • पेपर 1', '2023-06-04', True),
]
for e in exams:
    json.dump(e, open(f"{ROOT}/nikal/{e['id']}.json", 'w'), ensure_ascii=False)
idx = [{k: e[k] for k in ('id', 'title', 'short', 'exams', 'date', 'count', 'status', 'demo')} | {'file': f"nikal/{e['id']}.json", 'series': list(e['series'])} for e in exams]
json.dump(idx, open(f'{ROOT}/nikal/index.json', 'w'), ensure_ascii=False, indent=1)
print('ok', [e['id'] for e in exams])
