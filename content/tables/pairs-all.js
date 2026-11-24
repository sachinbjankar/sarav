// सर्व तक्त्यांतून ‘योग्य/चुकीची जोडी’ प्रश्न
import { pairs, mr } from '../engine.js';
import { ITIHAS_TABLES as I } from './itihas.js';
import { ITIHAS2_TABLES as I2 } from './itihas2.js';
import { BHUGOL_TABLES as B } from './bhugol.js';
import { BHUGOL2_TABLES as B2 } from './bhugol2.js';
import { GKX_TABLES as G } from './gk-extra.js';
import { RAJYA_TABLES as R } from './rajyaghatana.js';
import { ARTHA_TABLES as A } from './arthashastra.js';
import { VIDNYAN_TABLES as V } from './vidnyan.js';

export function genPairs() {
  const it = 'itihas'; const bh = 'bhugol';
  return [
    ...pairs(it, I.ORG, 'org', 'who', 'संस्था — संस्थापक'),
    ...pairs(it, I.PAPER, 'paper', 'who', 'वृत्तपत्र — संस्थापक'),
    ...pairs(it, I.BOOK, 'book', 'who', 'ग्रंथ — लेखक'),
    ...pairs(it, I.EVENT, 'ev', 'year', 'घटना — वर्ष', { fmtB: mr }),
    ...pairs(it, I.RULER, 'ev', 'who', 'घटना — गव्हर्नर जनरल/व्हाइसरॉय'),
    ...pairs(it, I.TITLE, 'title', 'who', 'उपाधी — व्यक्ती'),
    ...pairs(it, I.DYN, 'dyn', 'founder', 'राजवंश — संस्थापक'),
    ...pairs(it, I.PLACE, 'ev', 'place', 'घटना — ठिकाण'),
    ...pairs(it, I2.REFORM, 'who', 'work', 'समाजसुधारक — कार्य'),
    ...pairs(it, I2.SESSION, 'sess', 'pres', 'काँग्रेस अधिवेशन — अध्यक्ष'),
    ...pairs(it, I2.ACT, 'act', 'year', 'कायदा — वर्ष', { fmtB: mr }),
    ...pairs(it, I2.REVO, 'ev', 'who', 'क्रांतिकारी घटना — व्यक्ती'),
    ...pairs(it, I2.WOMEN, 'who', 'known', 'व्यक्ती — कार्य'),
    ...pairs(it, I2.SULTAN, 'who', 'known', 'शासक — वैशिष्ट्य'),
    ...pairs(it, I2.MARATHA, 'who', 'known', 'मराठा वीर — पराक्रम'),
    ...pairs(it, I2.SAINTW, 'who', 'work', 'संत — कार्य'),
    ...pairs(it, G.DAYS, 'day', 'date', 'दिनविशेष — तारीख'),
    ...pairs(it, G.SAINT, 'saint', 'place', 'संत — ठिकाण'),
    ...pairs(bh, B.DIV, 'dist', 'div', 'जिल्हा — प्रशासकीय विभाग'),
    ...pairs(bh, B.ORIGIN, 'river', 'origin', 'नदी — उगम'),
    ...pairs(bh, B.TRIB, 'trib', 'main', 'उपनदी — मुख्य नदी'),
    ...pairs(bh, B.DAM, 'dam', 'river', 'धरण — नदी'),
    ...pairs(bh, B.PARK, 'park', 'dist', 'अभयारण्य/उद्यान — जिल्हा'),
    ...pairs(bh, B.HILL, 'place', 'dist', 'थंड हवेचे ठिकाण — जिल्हा'),
    ...pairs(bh, B.FORT, 'fort', 'dist', 'किल्ला — जिल्हा'),
    ...pairs(bh, B.HOLY, 'place', 'dist', 'तीर्थक्षेत्र — जिल्हा'),
    ...pairs(bh, B.CAVE, 'cave', 'dist', 'लेणी — जिल्हा'),
    ...pairs(bh, B.STATE, 'state', 'cap', 'राज्य — राजधानी'),
    ...pairs(bh, B.NP, 'park', 'state', 'राष्ट्रीय उद्यान — राज्य'),
    ...pairs(bh, B.COUNTRY, 'country', 'cap', 'देश — राजधानी'),
    ...pairs(bh, B.COUNTRY, 'country', 'cur', 'देश — चलन'),
    ...pairs(bh, B2.POWER, 'p', 'dist', 'वीज प्रकल्प — जिल्हा'),
    ...pairs(bh, B2.PORT, 'port', 'st', 'बंदर — राज्य'),
    ...pairs(bh, B2.CITYRIVER, 'city', 'river', 'शहर — नदी'),
    ...pairs(bh, B2.MINE, 'place', 'what', 'ठिकाण — खनिज/उद्योग'),
    ...pairs(bh, B2.STRAIT, 'st', 'joins', 'सामुद्रधुनी — जोडते'),
    ...pairs(bh, B2.DESERT, 'd', 'where', 'वाळवंट — प्रदेश'),
    ...pairs(bh, B2.TRIBE, 't', 'where', 'जमात — प्रदेश'),
    ...pairs(bh, B2.AIRPORT, 'a', 'city', 'विमानतळ — शहर'),
    ...pairs(bh, B2.FEST, 'f', 'st', 'सण — राज्य'),
    ...pairs(bh, B2.MHCROP, 'c', 'dist', 'पीक — जिल्हा'),
    ...pairs(bh, G.DANCE, 'dance', 'st', 'नृत्य — राज्य'),
    ...pairs(bh, G.NEWDIST, 'd', 'from', 'नवा जिल्हा — मूळ जिल्हा'),
    ...pairs('rajyaghatana', R.ART, 'art', 'sub', 'कलम — विषय', { fmtA: (v) => `कलम ${mr(v)}` }),
    ...pairs('rajyaghatana', R.SCHED, 'n', 'sub', 'अनुसूची — विषय', { fmtA: (v) => `${v} अनुसूची` }),
    ...pairs('rajyaghatana', R.AMEND, 'n', 'sub', 'घटनादुरुस्ती — विषय', { fmtA: (v) => `${mr(v)} वी दुरुस्ती` }),
    ...pairs('rajyaghatana', R.SRC, 'feat', 'country', 'वैशिष्ट्य — स्रोत देश'),
    ...pairs('arthashastra', A.INST, 'inst', 'hq', 'संस्था — मुख्यालय'),
    ...pairs('arthashastra', A.SCHEME, 'sch', 'aim', 'योजना — उद्देश'),
    ...pairs('arthashastra', A.SCHEME, 'sch', 'year', 'योजना — वर्ष', { fmtB: mr }),
    ...pairs('arthashastra', A.TERM, 'term', 'mean', 'संज्ञा — अर्थ'),
    ...pairs('vidnyan', V.VIT, 'vit', 'dis', 'जीवनसत्त्व — अभावजन्य विकार'),
    ...pairs('vidnyan', V.UNIT, 'qty', 'unit', 'राशी — SI एकक'),
    ...pairs('vidnyan', V.INSTR, 'inst', 'meas', 'उपकरण — मोजमाप'),
    ...pairs('vidnyan', V.FORMULA, 'name', 'f', 'पदार्थ — सूत्र'),
    ...pairs('vidnyan', V.ELEM, 'el', 'sym', 'मूलद्रव्य — संज्ञा'),
    ...pairs('vidnyan', V.ACID, 'src', 'acid', 'पदार्थ — आम्ल'),
    ...pairs('vidnyan', V.DISCOVER, 'what', 'who', 'शोध — शास्त्रज्ञ'),
  ];
}
