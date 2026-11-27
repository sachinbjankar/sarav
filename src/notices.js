// परीक्षा व सूचना: अ‍ॅपसोबत आलेली प्रत + GitHub वरून ताजी प्रत (नवीन APK शिवाय अपडेट)
const REMOTE = 'https://raw.githubusercontent.com/sachinbjankar/sarav/main/public/notices.json';
const KEY = 'sarav.notices';

let data = null;
try { data = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) { data = null; }

const newer = (a, b) => !b || (a && a.updated >= b.updated);

export async function loadNotices(onChange) {
  const apply = (d) => {
    if (d && Array.isArray(d.items) && newer(d, data)) {
      const changed = !data || d.updated !== data.updated || JSON.stringify(d) !== JSON.stringify(data);
      data = d;
      try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (_) { /* ignore */ }
      if (changed && onChange) onChange();
    }
  };
  try { apply(await (await fetch('notices.json', { cache: 'no-cache' })).json()); } catch (_) { /* ignore */ }
  try {
    const ctl = new AbortController();
    setTimeout(() => ctl.abort(), 8000);
    apply(await (await fetch(`${REMOTE}?t=${Math.floor(Date.now() / 3600000)}`, { signal: ctl.signal })).json());
  } catch (_) { /* ऑफलाइन */ }
}

export const noticesUpdated = () => data?.updated || null;

const dayMs = 86400000;
function daysLeft(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d);
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((t - today) / dayMs);
}

// निवडलेल्या परीक्षेसाठी: तारखेनुसार (आगामी आधी, मग अनिश्चित)
export function noticesFor(examId) {
  const items = (data?.items || []).filter((x) => !examId || x.exams.includes(examId));
  const withD = items.map((x) => ({ ...x, left: x.date ? daysLeft(x.date) : null }));
  const upcoming = withD.filter((x) => x.left !== null && x.left >= 0).sort((a, b) => a.left - b.left);
  const tba = withD.filter((x) => x.left === null);
  const past = withD.filter((x) => x.left !== null && x.left < 0).sort((a, b) => b.left - a.left);
  return { upcoming, tba, past };
}

export function nextFor(examId) {
  const up = noticesFor(examId).upcoming;
  const urgent = up.find((x) => x.left <= 7);
  return urgent || up.find((x) => x.kind === 'exam') || up[0] || null;
}

export const noticeById = (id) => (data?.items || []).find((x) => x.id === id) || null;
