// ---------- 📋 परीक्षा योजना व अभ्यासक्रम ----------
// स्रोत: MPSC — महाराष्ट्र अराजपत्रित सेवा मुख्य परीक्षा (गट क) योजना व अभ्यासक्रम, दिनांक ५ डिसेंबर २०२२
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const SYLLABI = {
  'grc-mains': {
    title: 'महाराष्ट्र अराजपत्रित सेवा मुख्य परीक्षा (गट क)',
    sub: 'सहायक मोटार वाहन निरीक्षक पद वगळून अन्य पदांकरिता',
    exams: ['mpscb', 'talathi', 'zp'],
    date: '५ डिसेंबर २०२२',
    scheme: [
      ['पेपर १ (संकेतांक १०६४)', 'मराठी — ५० प्रश्न, १०० गुण (दर्जा: बारावी, माध्यम: मराठी)\nइंग्रजी — ५० प्रश्न, १०० गुण (दर्जा: पदवी, माध्यम: इंग्रजी)', 'एक तास • वस्तुनिष्ठ बहुपर्यायी'],
      ['पेपर २ (संकेतांक १०६५)', 'सामान्य अध्ययन व बुद्धिमत्ता चाचणी — १०० प्रश्न, २०० गुण (दर्जा: पदवी, माध्यम: मराठी व इंग्रजी)', 'एक तास • वस्तुनिष्ठ बहुपर्यायी'],
    ],
    total: 'एकूण ४०० गुण (पेपर १ — २०० + पेपर २ — २००)',
    neg: [
      'प्रत्येक चुकीच्या उत्तराकरिता २५% किंवा १/४ एवढे गुण एकूण गुणांमधून वजा केले जातील.',
      'एकापेक्षा अधिक उत्तरे दिल्यास किंवा उत्तरपत्रिकेत पूर्ण वर्तुळ चिन्हांकित न केल्यास ते उत्तर चुकीचे समजून २५% गुण वजा होतील.',
      'एकूण अंतिम गुणांची बेरीज अपूर्णांकात आली तरी ती अपूर्णांकातच राहील.',
      'एखादा प्रश्न अनुत्तरित असेल तर नकारात्मक गुणदान लागू नाही.',
    ],
    papers: [
      { name: 'पेपर १ — मराठी व इंग्रजी', topics: [
        ['मराठी', 'सर्वसामान्य शब्दसंग्रह, वाक्यरचना, व्याकरण, म्हणी व वाक्प्रचार यांचा अर्थ आणि उपयोग तसेच उताऱ्यावरील प्रश्नांची उत्तरे'],
        ['इंग्रजी', 'Common Vocabulary, Sentence structure, Grammar, use of Idioms and phrases & their meaning and comprehension of passage.'],
      ] },
      { name: 'पेपर २ — सामान्य क्षमता चाचणी', topics: [
        ['सामान्य बुद्धिमापन व आकलन', 'उमेदवार किती लवकर व अचूकपणे विचार करू शकतो हे आजमावण्यासाठी प्रश्न'],
        ['चालू घडामोडी', 'जागतिक तसेच महाराष्ट्रासह भारतातील'],
        ['अंकगणित व सांख्यिकी', ''],
        ['माहितीचा अधिकार अधिनियम २००५ (as updated) व महाराष्ट्र लोकसेवा हक्क अधिनियम २०१५', ''],
        ['भारतीय संघ राज्यव्यवस्था, भारतीय राज्यघटना, स्थानिक स्वराज्य संस्था, कार्यकारी मंडळ, न्यायमंडळ व विधीमंडळ', 'घटना कशी तयार झाली आणि घटनेच्या प्रस्तावनेमागची भूमिका व तत्त्वे, घटनेची महत्त्वाची कलमे / ठळक वैशिष्ट्ये, केंद्र व राज्य संबंध, निधर्मी राज्य, मूलभूत हक्क व कर्तव्ये, राज्याच्या धोरणाची मार्गदर्शक तत्त्वे — शिक्षण, युनिफॉर्म सिव्हील कोड, स्वतंत्र न्यायपालिका, राज्यपाल, मुख्यमंत्री व मंत्रिमंडळ — कर्तव्ये, अधिकार व कार्य, राज्य विधिमंडळ — विधानसभा, विधानपरिषद व त्यांचे सदस्य, अधिकार, कार्य व कर्तव्ये, विधी समित्या इत्यादी'],
        ['आधुनिक भारताचा विशेषतः महाराष्ट्राचा इतिहास', 'सामाजिक व आर्थिक जागृती (१८८५–१९४७), महत्त्वाच्या व्यक्तींचे कार्य, समाज सुधारकांचे कार्य, स्वातंत्र्यपूर्व भारतातील सामाजिक जागृतीतील वर्तमानपत्रे, शिक्षणाचा परिणाम, स्वातंत्र्यपूर्व काळातील इतर समकालीन चळवळी, राष्ट्रीय चळवळ'],
        ['भारताचा व महाराष्ट्राचा भूगोल', 'महाराष्ट्राचा व भारताचा प्राकृतिक (Physical) भूगोल, मुख्य प्राकृतिक (Physiographic) विभाग, हवामान शास्त्र (Climate), पर्जन्यमान व तापमान, पर्जन्यातील विभागवार बदल, नद्या, पर्वत व पठार, विविध भूरूपे, राजकीय विभाग, प्रशासकीय विभाग, नैसर्गिक संपत्ती — वने व खनिजे, मानवी व सामाजिक भूगोल, लोकसंख्या, लोकसंख्येचे स्थानांतर (Migration of Population) व त्याचे उगम (Source) आणि इष्टस्थानावरील (Destination) परिणाम, ग्रामीण वस्त्या व तांडे, झोपडपट्ट्या व त्यांचे प्रश्न.'],
        ['पर्यावरण', 'मानवी विकास व पर्यावरण, पर्यावरणपूरक विकास, नैसर्गिक साधनसंपत्तीचे संधारण विशेषतः वनसंधारण, विविध प्रकारची प्रदूषणे व पर्यावरणीय आपत्ती, पर्यावरण संवर्धनात कार्यरत असलेल्या राज्य / राष्ट्र / जागतिक पातळीवरील संघटना / संस्था इत्यादी.'],
        ['सामान्य विज्ञान व तंत्रज्ञान', 'अ) भौतिकशास्त्र, ब) रसायनशास्त्र, क) प्राणीशास्त्र, ड) वनस्पतीशास्त्र, इ) दूर संवेदन, हवाई व ड्रोन छायाचित्रण, भौगोलिक माहिती प्रणाली (GIS) व त्याचे उपयोजन, फ) माहिती व संप्रेषण तंत्रज्ञान'],
        ['अर्थव्यवस्था व नियोजन, विकास विषयक अर्थशास्त्र', '१. समग्रलक्षी अर्थशास्त्र — समग्रलक्षी अर्थशास्त्र, वृद्धी आणि विकास, सार्वजनिक वित्त, आंतरराष्ट्रीय व्यापार आणि आंतरराष्ट्रीय भांडवल\n२. भारतीय अर्थव्यवस्था — भारतीय अर्थव्यवस्थेची आव्हाने व आर्थिक सुधारणा, भारतीय शेती व ग्रामीण विकास, सहकार, मौद्रिक व वित्तीय क्षेत्र, सार्वजनिक वित्त आणि वित्तीय संस्था, उद्योग व सेवा क्षेत्र, पायाभूत सुविधा विकास, आंतरराष्ट्रीय व्यापार आणि भांडवल, महाराष्ट्राची अर्थव्यवस्था'],
      ] },
    ],
    extra: { name: 'सहायक मोटार वाहन निरीक्षक — तांत्रिक विषय', topics: [
      ['Strength of Materials', 'Simple stress, strain energy, shearing force and bending moment, moment of inertia, principal planes and stresses, slope and deflection, direct and bending stresses, theory of torsion.'],
      ['Manufacturing Processes', 'Engineering materials, metal cutting (turning, drilling, milling, boring, broaching, finishing), plastics, metal joining, NC-CNC, non-conventional machining.'],
      ['Theory of Machines', 'Kinematics and dynamics, friction, fly wheel, clutch, belt drive, governors, gyroscopes, cams.'],
      ['Hydraulics & Hydraulic Machinery', 'Fluid properties, laminar and turbulent flow, Bernoulli’s equation, Pascal’s law, surface tension, flow measurement, turbines, pumps.'],
      ['Thermal Engineering & Refrigeration', 'Energy sources, laws of thermodynamics, heat engines, air compressors, air standard / vapour / gas power cycles, refrigerator and heat pump, vapour compression and absorption refrigeration.'],
      ['Industrial Engineering & Management', 'Types of management and organisation, industrial acts, types of production, plant layout, process planning, work study, SQC, metrology.'],
      ['Power Developing Systems & Construction', 'Chassis and layout types, SI/CI two- and four-stroke engines, frames, CRDI, MPFI, fuel pumps and injectors, ECU for CI engine, ignition systems.'],
      ['Cooling & Lubrication Systems', 'Types of cooling systems, troubles and remedies; lubricants, multi-viscosity oils, chassis and engine lubrication, crankcase ventilation.'],
      ['Transmission Systems', 'Single plate, multi-plate, cone and centrifugal clutches; sliding mesh, constant mesh, synchromesh gearboxes, torque converter; faults and remedies.'],
      ['Steering Systems & Starting Drives', 'Front axle, stub axles, steering geometry, Ackerman’s mechanism, under/over steer, steering gears, power steering, wheel alignment and balancing, Bendix drive, dynamo and alternator, cut-outs, relay, regulator.'],
      ['Differential, Rear Axle & Brakes', 'Differential, transfer case, semi/full/three-quarter floating axles, drum and disc brakes, parking brake, hydraulic and air brakes, ABS.'],
      ['Vehicle Maintenance & Transport Management', 'Vehicle performance, engine electricals and electronics, workshop layout, servicing, emission measurement and control, transport operations.'],
      ['Automobile Electrical & Electronic Systems', 'Battery, starting system, alternators, charging, inspection and maintenance.'],
      ['Introduction to Electric Vehicles', 'Energy storage in hybrid and electric vehicles, battery specifications, battery management system.'],
      ['Motor Vehicle Act & Road Safety', 'Licensing, registration, Motor Vehicle Act, taxation, insurance, RTO organisation structure, passenger comfort and safety.'],
    ] },
  },
};

export const syllabusFor = (examId) => Object.entries(SYLLABI).filter(([, s]) => s.exams.includes(examId)).map(([id, s]) => ({ id, ...s }));

export function syllabusCard(examId) {
  return syllabusFor(examId).map((s) => `<button class="syl-card" data-act="syl-open" data-id="${s.id}">
    <span class="syl-ico">📋</span><span class="grow"><b>परीक्षा योजना व अभ्यासक्रम</b><small>${esc(s.title)}</small></span><span class="arrow">›</span></button>`).join('');
}

export function syllabusView(id, tabbar) {
  const s = SYLLABI[id]; if (!s) return '';
  const topics = (t) => t.map((x, i) => `<li><b>${i + 1}. ${esc(x[0])}</b>${x[1] ? `<p>${esc(x[1]).replace(/\n/g, '<br>')}</p>` : ''}</li>`).join('');
  return `
  <header class="top slim"><button class="icon-btn" data-act="back">‹</button><h1>📋 अभ्यासक्रम</h1></header>
  <main class="wrap syl">
    <section class="syl-head"><b>${esc(s.title)}</b><small>${esc(s.sub)}</small></section>
    <h3 class="sec">📝 परीक्षा योजना</h3>
    <div class="syl-scheme">${s.scheme.map((r) => `<div><b>${esc(r[0])}</b><p>${esc(r[1]).replace(/\n/g, '<br>')}</p><small>⏱ ${esc(r[2])}</small></div>`).join('')}
      <p class="syl-total">${esc(s.total)}</p></div>
    <h3 class="sec">➖ नकारात्मक गुणदान</h3>
    <ul class="syl-neg">${s.neg.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    ${s.papers.map((p) => `<h3 class="sec">📚 ${esc(p.name)}</h3><ol class="syl-list">${topics(p.topics)}</ol>`).join('')}
    ${s.extra ? `<details class="syl-extra"><summary>🚗 ${esc(s.extra.name)}</summary><ol class="syl-list">${topics(s.extra.topics)}</ol></details>` : ''}
    <p class="muted small n-disc">स्रोत: महाराष्ट्र लोकसेवा आयोग, दिनांक ${esc(s.date)}. नवीन जाहिरातीत बदल असू शकतात — अंतिम माहितीसाठी mpsc.gov.in पाहा.</p>
  </main>
  ${tabbar()}`;
}
