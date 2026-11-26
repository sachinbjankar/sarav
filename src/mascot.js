// सरावचा शुभंकर: ‘गुरु’ घुबड (मूळ रचना)
export const OWL_SVG = `
<svg class="owl" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <ellipse cx="100" cy="210" rx="58" ry="7" fill="#1B2140" opacity=".12"/>
  <g class="owl-body">
    <!-- कान -->
    <path d="M52 52 L44 18 L78 40 Z" fill="#1E2A5A"/>
    <path d="M148 52 L156 18 L122 40 Z" fill="#1E2A5A"/>
    <!-- शरीर -->
    <path d="M100 30 C150 30 170 70 170 118 C170 172 138 200 100 200 C62 200 30 172 30 118 C30 70 50 30 100 30 Z" fill="#2E3F80"/>
    <!-- पोट -->
    <path d="M100 96 C132 96 146 124 146 150 C146 180 126 196 100 196 C74 196 54 180 54 150 C54 124 68 96 100 96 Z" fill="#F7E3C8"/>
    <path d="M84 138 q8 7 16 0 q8 7 16 0 M78 158 q8 7 16 0 q8 7 16 0 q8 7 16 0" fill="none" stroke="#E9C9A0" stroke-width="3" stroke-linecap="round"/>
    <!-- डोळ्यांभोवती -->
    <circle cx="72" cy="78" r="30" fill="#FFFFFF"/>
    <circle cx="128" cy="78" r="30" fill="#FFFFFF"/>
    <circle cx="72" cy="78" r="30" fill="none" stroke="#F28C28" stroke-width="5"/>
    <circle cx="128" cy="78" r="30" fill="none" stroke="#F28C28" stroke-width="5"/>
    <!-- डोळे -->
    <g class="owl-eyes">
      <circle cx="75" cy="80" r="13" fill="#1B2140"/>
      <circle cx="125" cy="80" r="13" fill="#1B2140"/>
      <circle cx="79" cy="75" r="4.5" fill="#FFFFFF"/>
      <circle cx="129" cy="75" r="4.5" fill="#FFFFFF"/>
    </g>
    <!-- आनंदी डोळे (मिटलेले, हसरे) -->
    <g class="owl-happy" fill="none" stroke="#1B2140" stroke-width="6" stroke-linecap="round">
      <path d="M60 84 Q75 66 90 84"/>
      <path d="M110 84 Q125 66 140 84"/>
    </g>
    <!-- काळजीच्या भुवया -->
    <g class="owl-brows" stroke="#1E2A5A" stroke-width="5" stroke-linecap="round" fill="none">
      <path d="M58 56 Q72 50 86 44"/>
      <path d="M142 56 Q128 50 114 44"/>
    </g>
    <g class="owl-lids">
      <rect x="40" y="46" width="64" height="64" rx="32" fill="#2E3F80"/>
      <rect x="96" y="46" width="64" height="64" rx="32" fill="#2E3F80"/>
    </g>
    <!-- चोच -->
    <path d="M92 100 L108 100 L100 116 Z" fill="#F28C28"/>
    <!-- गाल -->
    <ellipse cx="50" cy="110" rx="8" ry="5" fill="#F28C28" opacity=".35"/>
    <ellipse cx="150" cy="110" rx="8" ry="5" fill="#F28C28" opacity=".35"/>
    <!-- डावा पंख -->
    <path class="owl-wing-l" d="M34 112 C14 128 16 160 36 172 C44 150 46 132 40 112 Z" fill="#1E2A5A"/>
    <!-- पाय -->
    <path d="M80 198 l-6 10 M86 198 l0 11 M92 198 l6 10" stroke="#F28C28" stroke-width="5" stroke-linecap="round"/>
    <path d="M108 198 l-6 10 M114 198 l0 11 M120 198 l6 10" stroke="#F28C28" stroke-width="5" stroke-linecap="round"/>
    <!-- पुस्तक -->
    <g transform="translate(70 150)">
      <path d="M0 4 L30 0 L30 40 L0 44 Z" fill="#F28C28"/>
      <path d="M60 4 L30 0 L30 40 L60 44 Z" fill="#E07A16"/>
      <path d="M4 8 L28 5 L28 37 L4 40 Z" fill="#FFF7EC"/>
      <path d="M56 8 L32 5 L32 37 L56 40 Z" fill="#FFF7EC"/>
      <text x="16" y="29" font-size="18" font-weight="800" fill="#1E2A5A" text-anchor="middle" font-family="Mukta, sans-serif">स</text>
      <path d="M36 16 h16 M36 23 h16 M36 30 h12" stroke="#D9CBB5" stroke-width="2.5" stroke-linecap="round"/>
    </g>
  </g>
  <!-- हलणारा उजवा पंख -->
  <path class="owl-wing" d="M166 112 C190 102 200 76 192 58 C176 70 164 92 160 112 Z" fill="#1E2A5A"/>
  <!-- चमक -->
  <g class="owl-spark" fill="#F28C28">
    <path d="M182 30 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 Z"/>
    <path d="M22 40 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z"/>
  </g>
</svg>`;

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'शुभ प्रभात!';
  if (h < 17) return 'नमस्कार!';
  return 'शुभ संध्या!';
}

const LINES = [
  'आजचा सराव, उद्याचे यश!',
  'रोज थोडा सराव, मोठा फरक.',
  'चला, आजची प्रश्नमंजुषा सोडवू!',
  'सातत्य हेच यशाचे गमक.',
  'एक प्रश्न, एक पाऊल पुढे.',
];
export const motto = () => LINES[Math.floor(Date.now() / 86400000) % LINES.length];

// भावनांसह घुबड: mood = cheer | happy | excited | correct | wrong
export function owl(mood = 'happy', extra = '') {
  return `<div class="mascot m-${mood} ${extra}">${OWL_SVG}${mood === 'excited' ? confetti() : ''}</div>`;
}

const CONF_COLORS = ['#F28C28', '#2E3F80', '#3BA55C', '#F2C94C', '#E5533D'];
function confetti() {
  let h = '<div class="confetti" aria-hidden="true">';
  for (let i = 0; i < 18; i++) {
    const x = Math.round(Math.cos((i / 18) * Math.PI * 2) * (70 + (i % 3) * 25));
    const y = Math.round(Math.sin((i / 18) * Math.PI * 2) * (55 + (i % 4) * 18)) - 40;
    h += `<i style="--x:${x}px;--y:${y}px;--r:${(i * 47) % 360}deg;--d:${(i % 5) * 40}ms;background:${CONF_COLORS[i % 5]}"></i>`;
  }
  return h + '</div>';
}

// निकालासाठी घुबडाचे बोल
export function owlLine(pct, passed, lvl = passed !== undefined) {
  if (passed === false) return { mood: 'cheer', line: 'हरकत नाही! थोडा अजून सराव, पुढच्या वेळी नक्की जमेल 💪' };
  if (pct >= 80) return { mood: 'excited', line: lvl ? 'शाब्बास! जबरदस्त कामगिरी! चला, पुढचा टप्पा! 🚀' : 'शाब्बास! जबरदस्त कामगिरी! असेच पुढे चला 🚀' };
  if (pct >= 50) return { mood: 'happy', line: lvl ? 'छान! तुम्ही प्रगती करताय. पुढचा टप्पा वाट पाहतोय!' : 'छान! तुम्ही प्रगती करताय. रोज असाच सराव करा!' };
  return { mood: 'cheer', line: 'हरकत नाही! चुकांमधूनच शिकतो. पुन्हा प्रयत्न करू 💪' };
}
