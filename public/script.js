// ─── State ───────────────────────────────────────────────────────────────────
let lastResult = null;
let lastForm   = null;

const $ = id => document.getElementById(id);

// ─── Nutrition Parser ─────────────────────────────────────────────────────────
// Per 100g: { kcal, p (protein), c (carbs), f (fats) }
const NUTR_DB = {
  // Meso & riba
  'pileć':          { kcal:165, p:31, c:0,   f:3.6 },
  'piletina':       { kcal:165, p:31, c:0,   f:3.6 },
  'dimljena piletina':{ kcal:170, p:28, c:1, f:6   },
  'dimljen':        { kcal:170, p:28, c:1,   f:6   },
  'batak':          { kcal:190, p:25, c:0,   f:9.5 },
  'puretina':       { kcal:189, p:29, c:0,   f:7.4 },
  'govedina':       { kcal:215, p:26, c:0,   f:11  },
  'ćuft':           { kcal:215, p:24, c:2,   f:12  },
  'ćevap':          { kcal:250, p:22, c:2,   f:17  },
  'svinjetin':      { kcal:143, p:22, c:0,   f:5   },
  'janjetin':       { kcal:258, p:25, c:0,   f:17  },
  'losos':          { kcal:208, p:20, c:0,   f:13  },
  'tuna':           { kcal:116, p:26, c:0,   f:1   },
  'oslić':          { kcal:82,  p:18, c:0,   f:1   },
  'brancin':        { kcal:82,  p:18, c:0,   f:1   },
  'sardina':        { kcal:185, p:21, c:0,   f:11  },
  'skuša':          { kcal:205, p:19, c:0,   f:13  },
  'lignje':         { kcal:92,  p:16, c:3,   f:1   },
  'tempeh':         { kcal:193, p:19, c:9,   f:11  },
  'tofu':           { kcal:76,  p:8,  c:1.9, f:4.8 },
  'edamame':        { kcal:121, p:11, c:8.9, f:5.2 },
  'slanina':        { kcal:541, p:37, c:1.4, f:42  },

  // Jaja & mliječni
  'jaje':           { kcal:143, p:13, c:0.7, f:10  },
  'jaja':           { kcal:143, p:13, c:0.7, f:10  },
  'bjelance':       { kcal:52,  p:11, c:0.7, f:0.2 },
  'grčki jogurt':   { kcal:59,  p:10, c:4,   f:0.4 },
  'jogurt':         { kcal:59,  p:4,  c:4.7, f:1.5 },
  'skyr':           { kcal:63,  p:11, c:4,   f:0.2 },
  'cottage':        { kcal:98,  p:11, c:3,   f:4   },
  'domaći sir':     { kcal:105, p:12, c:3,   f:5   },
  'svježi sir':     { kcal:105, p:12, c:3,   f:5   },
  'mozarela':       { kcal:242, p:17, c:2,   f:18  },
  'feta':           { kcal:264, p:14, c:4,   f:21  },
  'parmezan':       { kcal:431, p:38, c:4,   f:29  },
  'cheddar':        { kcal:403, p:25, c:1.3, f:33  },
  'kefir':          { kcal:61,  p:3.4,c:4.8, f:3.3 },
  'mlijeko':        { kcal:47,  p:3.4,c:5,   f:1.5 },
  'sojino mlijeko': { kcal:33,  p:2.9,c:1.8, f:1.6 },
  'zobeno mlijeko': { kcal:46,  p:1,  c:7,   f:1.5 },
  'whey':           { kcal:375, p:75, c:7,   f:5   },
  'protein prah':   { kcal:370, p:72, c:8,   f:5   },
  'biljni protein': { kcal:365, p:70, c:8,   f:5   },

  // Žitarice (suhe)
  'zobene':         { kcal:389, p:13, c:66,  f:7   },
  'zobi':           { kcal:389, p:13, c:66,  f:7   },
  'riža':           { kcal:370, p:7,  c:80,  f:3   },
  'heljda':         { kcal:343, p:13, c:71,  f:3.4 },
  'kinoa':          { kcal:368, p:14, c:64,  f:6   },
  'bulgur':         { kcal:342, p:12, c:76,  f:1.3 },
  'tjestenina':     { kcal:371, p:13, c:74,  f:1.5 },
  'krompir':        { kcal:87,  p:2,  c:20,  f:0.1 },
  'slatki krompir': { kcal:86,  p:1.6,c:20,  f:0.1 },
  'hljeb':          { kcal:247, p:9,  c:41,  f:3.2 },
  'integralni hljeb':{ kcal:247, p:9, c:41,  f:3.2 },
  'tortilja':       { kcal:305, p:8,  c:54,  f:6.5 },
  'lepinjica':      { kcal:270, p:9,  c:50,  f:4   },

  // Voće
  'banana':         { kcal:89,  p:1.1,c:23,  f:0.3 },
  'jabuka':         { kcal:52,  p:0.3,c:14,  f:0.2 },
  'kruška':         { kcal:57,  p:0.4,c:15,  f:0.1 },
  'borovnic':       { kcal:57,  p:0.7,c:14,  f:0.3 },
  'bobice':         { kcal:50,  p:0.7,c:12,  f:0.3 },
  'jagode':         { kcal:32,  p:0.7,c:8,   f:0.3 },

  // Povrće (kuhano/sirovo)
  'brokula':        { kcal:34,  p:2.8,c:7,   f:0.4 },
  'špinat':         { kcal:23,  p:2.9,c:3.6, f:0.4 },
  'salat':          { kcal:15,  p:1.3,c:2.9, f:0.2 }, // salata, miješana
  'kelj':           { kcal:49,  p:4.3,c:9,   f:0.9 },
  'tikvice':        { kcal:17,  p:1.2,c:3.1, f:0.3 },
  'paprika':        { kcal:31,  p:1,  c:6,   f:0.3 },
  'paradajz':       { kcal:18,  p:0.9,c:3.9, f:0.2 },
  'rajčica':        { kcal:18,  p:0.9,c:3.9, f:0.2 },
  'krastavac':      { kcal:15,  p:0.7,c:3.6, f:0.1 },
  'šargarepa':      { kcal:41,  p:0.9,c:10,  f:0.2 },
  'mahune':         { kcal:31,  p:1.8,c:7,   f:0.1 },
  'kupus':          { kcal:25,  p:1.3,c:6,   f:0.1 },
  'rukola':         { kcal:25,  p:2.6,c:3.7, f:0.7 },
  'luk':            { kcal:40,  p:1.1,c:9,   f:0.1 },
  'češnjak':        { kcal:149, p:6.4,c:33,  f:0.5 },
  'šampinjon':      { kcal:22,  p:3.1,c:3.3, f:0.3 },
  'pečurke':        { kcal:22,  p:3.1,c:3.3, f:0.3 },
  'avokado':        { kcal:160, p:2,  c:9,   f:15  },

  // Mahunarke (kuhane)
  'leća':           { kcal:116, p:9,  c:20,  f:0.4 },
  'slanutak':       { kcal:164, p:9,  c:27,  f:2.6 },
  'pasulj':         { kcal:132, p:9,  c:24,  f:0.5 },
  'grah':           { kcal:132, p:9,  c:24,  f:0.5 },
  'hummus':         { kcal:166, p:8,  c:14,  f:10  },

  // Masti & orasi
  'maslinovo ulje': { kcal:884, p:0,  c:0,   f:100 },
  'maslinov':       { kcal:884, p:0,  c:0,   f:100 },
  'orasi':          { kcal:654, p:15, c:14,  f:65  },
  'bademi':         { kcal:579, p:21, c:22,  f:50  },
  'chia':           { kcal:486, p:17, c:42,  f:31  },
  'lanene':         { kcal:534, p:18, c:29,  f:42  },
  'bundeva':        { kcal:559, p:30, c:11,  f:49  },
  'suncokret':      { kcal:584, p:21, c:20,  f:51  },
  'tahini':         { kcal:595, p:17, c:21,  f:54  },
  'kikiriki maslac':{ kcal:588, p:25, c:20,  f:50  },
  'kikiriki':       { kcal:588, p:25, c:20,  f:50  },
  'kokos':          { kcal:354, p:3.3,c:15,  f:33  },
  'pesto':          { kcal:430, p:6,  c:5,   f:43  },

  // Ostalo
  'med':            { kcal:304, p:0.3,c:82,  f:0   },
};

// Defaultne gramaze za namirnice bez broja
const DEFAULT_WEIGHTS = {
  'banana':     120,
  'jabuka':     150,
  'kruška':     160,
  'avokado':    100,
  'tortilja':   45,
  'lepinjica':  60,
  'salata':     80,
  'paradajz':   100,
  'rajčica':    100,
  'krastavac':  100,
  'paprika':    100,
  'špinat':     80,
  'brokula':    150,
  'šargarepa':  80,
  'tikvice':    120,
  'kupus':      100,
  'rukola':     50,
  'luk':        50,
};

// Posebne jedinice → grami
const UNIT_WEIGHTS = {
  'kriška':     30,   // 1 kriška hljeba
  'kriške':     30,
  'kašika':     15,   // tekućine/prah
  'kašike':     15,
  'mjerica':    30,   // protein prah
  'šaka':       30,
  'konzerva':   185,
};

function parseMeal(mealStr) {
  if (!mealStr || mealStr === '—') return null;
  // Normalize: lowercase, remove "Wrap:", "Shake:" etc prefixes
  const str = mealStr.toLowerCase().replace(/^[a-z]+:\s*/i, '');
  const ingredients = [];

  // Pattern 1: "Xg ingredient" — npr. "250g pilećih prsa"
  const gramRx = /(\d+(?:[.,]\d+)?)\s*ml\s+([a-zčćšđž\s\/\-]+?)(?=\s*[+,\(]|\s*$)/gi;
  const gramRx2 = /(\d+)\s*g\s+([a-zčćšđž\s\/\-]+?)(?=\s*[+,\(]|\s*$)/gi;

  // ml → assume density 1 (mlijeko, jogurt)
  let m;
  while ((m = gramRx.exec(str)) !== null) {
    ingredients.push({ grams: parseFloat(m[1].replace(',','.')), name: m[2].trim() });
  }
  while ((m = gramRx2.exec(str)) !== null) {
    ingredients.push({ grams: parseInt(m[1]), name: m[2].trim() });
  }

  // Pattern 2: "X kriška/kašika/mjerica ingredient"
  const unitRx = /(\d+(?:[.,]\d+)?)\s+(kriška|kriške|kašika|kašike|mjerica|šaka|konzerva)\s+([a-zčćšđž\s\/\-]+?)(?=\s*[+,\(]|\s*$)/gi;
  while ((m = unitRx.exec(str)) !== null) {
    const count = parseFloat(m[1].replace(',','.'));
    const unit  = m[2].toLowerCase();
    const name  = m[3].trim();
    ingredients.push({ grams: Math.round(count * (UNIT_WEIGHTS[unit] || 15)), name });
  }

  // Pattern 3: "kriška/kašika ingredient" bez broja (pretpostavi 1)
  const unitNoNumRx = /\b(kriška|kriške|kašika|kašike|mjerica|šaka)\s+([a-zčćšđž\s\/\-]{3,30}?)(?=\s*[+,\(]|\s*$)/gi;
  while ((m = unitNoNumRx.exec(str)) !== null) {
    const unit = m[1].toLowerCase();
    const name = m[2].trim();
    if (!ingredients.find(i => i.name.includes(name.split(' ')[0]))) {
      ingredients.push({ grams: UNIT_WEIGHTS[unit] || 15, name });
    }
  }

  // Pattern 4: standalone namirnice bez gramaze (banana, jabuka, tortilja, salata...)
  for (const [food, grams] of Object.entries(DEFAULT_WEIGHTS)) {
    // Match word boundary
    const rx = new RegExp(`\\b${food}\\b`, 'i');
    if (rx.test(str) && !ingredients.find(i => i.name.includes(food))) {
      ingredients.push({ grams, name: food });
    }
  }

  return ingredients.length ? ingredients : null;
}

function lookupNutrition(name) {
  const n = name.toLowerCase();
  // Longest key first
  const keys = Object.keys(NUTR_DB).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (n.includes(key)) return NUTR_DB[key];
  }
  return null;
}

function calcMealNutrition(mealStr) {
  const ingredients = parseMeal(mealStr);
  if (!ingredients) return null;

  let kcal=0, p=0, c=0, f=0, matched=0;
  for (const ing of ingredients) {
    const nutr = lookupNutrition(ing.name);
    if (!nutr) continue;
    const x = ing.grams / 100;
    kcal += nutr.kcal * x;
    p    += nutr.p    * x;
    c    += nutr.c    * x;
    f    += nutr.f    * x;
    matched++;
  }
  if (matched === 0) return null;

  return {
    kcal: Math.round(kcal),
    p:    Math.round(p),
    c:    Math.round(c),
    f:    Math.round(f),
    approx: matched < ingredients.length
  };
}

function mealNutrBadge(mealStr, nutrData) {
  // Preferiramo server podatke (tačni) nad parserom
  const n = nutrData || calcMealNutrition(mealStr);
  if (!n) return '<div class="meal-nutr meal-nutr-na">Nutritivni podaci nisu dostupni</div>';
  const approx = !nutrData; // ako nema server podataka, označi kao procjenu
  const t = approx ? '~' : '';
  return `
    <div class="meal-nutr">
      <span class="mn-kcal"><strong>${t}${n.kcal || n.k}</strong> kcal</span>
      <span class="mn-sep">·</span>
      <span class="mn-p">P: <strong>${t}${n.p}g</strong></span>
      <span class="mn-sep">·</span>
      <span class="mn-c">UH: <strong>${t}${n.c}g</strong></span>
      <span class="mn-sep">·</span>
      <span class="mn-f">M: <strong>${t}${n.f}g</strong></span>
      ${approx ? '<span class="mn-approx" title="Procjena — neke namirnice nisu u bazi">~procjena</span>' : ''}
    </div>`;
}

// ─── Restriction Detection Engine ────────────────────────────────────────────
const RESTRICTION_RULES = [
  {
    id: 'lactose',
    keywords: ['laktoz', 'mlijeko', 'mliječn', 'jogurt', 'sir', 'surutk', 'dairy', 'lactose'],
    label: '🥛 Intolerancija na laktozu',
    action: 'Isključeni: obično mlijeko, jogurt, skyr, svježi sir → zamijenjeni bezlaktoznim verzijama',
    excludeIngredients: ['mlijeko', 'jogurt', 'skyr', 'svježi sir', 'domaći sir', 'feta', 'mozarela', 'parmezan'],
    dietOverride: 'lactose_free'
  },
  {
    id: 'gluten',
    keywords: ['gluten', 'celijak', 'pšenic', 'hljeb', 'tjestenin', 'brašno', 'zobene', 'ovsene', 'ječam', 'raž'],
    label: '🌾 Intolerancija na gluten / Celijakija',
    action: 'Isključeni: pšenica, hljeb, tjestenina, zobene pahuljice → zamijenjeni rižom, heljdom, kinoama',
    excludeIngredients: ['hljeb', 'tjestenin', 'zobene', 'pšenič', 'bulgur', 'tortilja', 'lepinjica', 'palačink'],
    dietOverride: 'gluten_free'
  },
  {
    id: 'nuts',
    keywords: ['oraš', 'badem', 'orah', 'lješnjak', 'kešu', 'pistaći', 'nut', 'alerg'],
    label: '🥜 Alergija na orašaste plodove',
    action: 'Isključeni: bademi, orasi, lješnjaci → zamijenjeni sjemenkama (bundeva, suncokret, chia)',
    excludeIngredients: ['orah', 'badem', 'lješnj', 'kešu', 'pistaći', 'kikiriki maslac', 'peanut']
  },
  {
    id: 'peanut',
    keywords: ['kikiriki', 'peanut'],
    label: '🥜 Alergija na kikiriki',
    action: 'Isključen: kikiriki i kikiriki maslac → zamijenjeni tahinijem ili sjemenkama',
    excludeIngredients: ['kikiriki']
  },
  {
    id: 'seafood',
    keywords: ['plodovi mora', 'školjk', 'riba', 'rib', 'seafood', 'morsk'],
    label: '🐟 Alergija na ribu / plodove mora',
    action: 'Isključeni: sva riba i plodovi mora → zamijenjeni piletinom i mahunarkama',
    excludeIngredients: ['losos', 'tuna', 'oslić', 'brancin', 'sardine', 'skuša', 'riba', 'lignje', 'škampi']
  },
  {
    id: 'egg',
    keywords: ['jaj', 'egg'],
    label: '🥚 Alergija na jaja',
    action: 'Isključena: jaja → zamijenjeni tofu scramble ili leguminozama',
    excludeIngredients: ['jaje', 'jaja', 'bjelance', 'kajgana', 'omlet']
  },
  {
    id: 'cholesterol',
    keywords: ['holesterol', 'cholesterol', 'srce', 'kardio', 'triglicerid'],
    label: '❤️ Povišen holesterol',
    action: 'Plan prilagođen: fokus na masnu ribu (omega-3), maslinovo ulje, mahunarke, vlakna — manje crvenog mesa i zasićenih masti',
    warning: 'Za medicinski savjet konsultuj ljekara ili nutricionistu'
  },
  {
    id: 'diabetes',
    keywords: ['dijabet', 'šećer', 'inzulin', 'glikemij', 'diabetes'],
    label: '💉 Dijabetes / regulacija šećera',
    action: 'Plan prilagođen: kompleksni ugljikohidrati s niskim GI, manji obroci, izbjegavaju se rafinirani šećeri',
    warning: 'Obavezno konsultuj ljekara — insulinska terapija zahtijeva individualni pristup'
  },
  {
    id: 'hypertension',
    keywords: ['pritisak', 'hipertenzij', 'hypertens', 'so', 'natrij', 'sodium'],
    label: '🩺 Visoki krvni pritisak',
    action: 'Plan prilagođen: smanjen unos soli, nema prerađenih mesnih proizvoda, fokus na svježe namirnice',
    warning: 'Konsultuj ljekara za prilagodbu lijekova prehrani'
  },
  {
    id: 'migraine',
    keywords: ['migren', 'glavobol', 'migrain'],
    label: '🧠 Migrene',
    action: 'Isključeni okidači: zreli sirevi (tiramin), prerađene kobasice (nitriti), alkohol — plan baziran na redovnim obrocima i hidrataciji',
    excludeIngredients: ['feta', 'parmezan', 'gorgonzol', 'camembert', 'salama', 'hrenovk', 'slanina']
  },
  {
    id: 'ibs',
    keywords: ['ibs', 'sindrom iritabilnog', 'nadimanj', 'crijeva', 'probav'],
    label: '🫶 IBS / osjetljiva probava',
    action: 'Plan prilagođen: lakše probavljivi obroci, izbjegavaju se masna i pržena jela, manji obroci',
    warning: 'Preporučujemo low-FODMAP pristup uz savjet gastroenterologa'
  },
  {
    id: 'vegan_restriction',
    keywords: ['bez mesa', 'bez animal', 'biljn', 'vegan', 'biljojed'],
    label: '🌱 Biljna ishrana',
    action: 'Sva jela su biljnog porijekla — tofu, tempeh, mahunarke, žitarice',
    dietOverride: 'vegan'
  }
];

function detectRestrictions() {
  const text = (($('restrictions')?.value || '') + ' ' + ($('healthNotes')?.value || '')).toLowerCase();
  const fb = $('restrictionFeedback');
  if (!fb) return;

  if (!text.trim()) { fb.classList.add('hidden'); return; }

  const detected = RESTRICTION_RULES.filter(r => r.keywords.some(kw => text.includes(kw)));

  if (!detected.length) {
    fb.classList.add('hidden');
    return;
  }

  fb.classList.remove('hidden');
  fb.innerHTML = `
    <div class="rf-header">
      <span class="rf-icon">✅</span>
      <span><strong>Detektovano ${detected.length} ${detected.length === 1 ? 'ograničenje' : detected.length < 5 ? 'ograničenja' : 'ograničenja'}</strong> — plan će biti prilagođen</span>
    </div>
    <div class="rf-items">
      ${detected.map(r => `
        <div class="rf-item">
          <div class="rf-item-label">${r.label}</div>
          <div class="rf-item-action">→ ${r.action}</div>
          ${r.warning ? `<div class="rf-item-warning">⚠️ ${r.warning}</div>` : ''}
        </div>
      `).join('')}
    </div>
    <div class="rf-footer">
      Uključi <strong>🤖 AI personalizaciju</strong> za potpuno prilagođen jelovnik koji poštuje ova ograničenja u svakom obroku.
    </div>
  `;
}

// Returns detected restriction IDs based on current form input
function getDetectedRestrictions() {
  const text = (($('restrictions')?.value || '') + ' ' + ($('healthNotes')?.value || '')).toLowerCase();
  return RESTRICTION_RULES.filter(r => r.keywords.some(kw => text.includes(kw)));
}

// Filter a meal string — return true if meal should be excluded
function mealContainsExcluded(mealText, excludeIngredients) {
  const lower = mealText.toLowerCase();
  return excludeIngredients.some(excl => lower.includes(excl.toLowerCase()));
}

// Smart fallback plan that respects detected restrictions
// ─── Daily Calorie Tracker ────────────────────────────────────────────────────
const TRACKER_KEY  = 'fm_tracker';
const DAY_NAMES_BS = ['Nedjelja','Ponedjeljak','Utorak','Srijeda','Četvrtak','Petak','Subota'];
const DAY_SHORT    = ['Ned','Pon','Uto','Sri','Čet','Pet','Sub'];

let trackerOpen = false;

function toggleTracker() {
  trackerOpen = !trackerOpen;
  $('trackerBody').classList.toggle('open', trackerOpen);
  $('trackerArrow').textContent = trackerOpen ? '▲' : '▼';
  if (trackerOpen) renderTracker();
}

function getWeekDates() {
  const today  = new Date();
  const day    = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function dateKey(date) { return date.toISOString().split('T')[0]; }
function isToday(date) { return dateKey(date) === dateKey(new Date()); }

function loadTrackerData() {
  try { return JSON.parse(localStorage.getItem(TRACKER_KEY) || '{}'); } catch(e) { return {}; }
}
function saveTrackerData(data) {
  try { localStorage.setItem(TRACKER_KEY, JSON.stringify(data)); } catch(e) {}
}
function getTrackerGoal() {
  const stored   = parseInt(localStorage.getItem('fm_tracker_goal') || '0');
  const inputVal = parseInt($('trackerGoalKcal')?.value || '0');
  return inputVal || stored || 0;
}
function updateTrackerGoal() {
  const val = parseInt($('trackerGoalKcal').value || '0');
  if (val > 0) { localStorage.setItem('fm_tracker_goal', val); renderTracker(); }
}
function logDay(key, value) {
  const data = loadTrackerData();
  if (value === '' || value === null) { delete data[key]; }
  else {
    const kcal = parseInt(value);
    if (!isNaN(kcal) && kcal > 0) data[key] = { kcal, logged: new Date().toISOString() };
  }
  saveTrackerData(data);
  renderTracker();
}
function getStatusColor(pct) {
  if (pct < 80)  return { color:'#3b82f6', bg:'#eff6ff', label:'Ispod cilja' };
  if (pct < 95)  return { color:'#16a34a', bg:'#f0fdf4', label:'Odlično' };
  if (pct < 110) return { color:'#16a34a', bg:'#f0fdf4', label:'Na cilju ✓' };
  if (pct < 125) return { color:'#d97706', bg:'#fffbeb', label:'Malo iznad' };
  return             { color:'#dc2626', bg:'#fef2f2', label:'Iznad cilja' };
}

function renderTracker() {
  const goal     = getTrackerGoal();
  const data     = loadTrackerData();
  const dates    = getWeekDates();
  const todayKey = dateKey(new Date());

  // Header badge
  const todayEntry = data[todayKey];
  const badge = $('trackerTodayBadge');
  if (badge) {
    if (todayEntry && goal) {
      const pct = Math.round(todayEntry.kcal / goal * 100);
      const st  = getStatusColor(pct);
      badge.textContent = `Danas: ${todayEntry.kcal} kcal (${pct}%)`;
      badge.style.cssText = `background:${st.bg};color:${st.color};border-color:${st.color}40`;
    } else if (todayEntry) {
      badge.textContent = `Danas: ${todayEntry.kcal} kcal`;
      badge.style.cssText = 'background:#f0f2f6;color:#374151;border-color:#e3e6ed';
    } else {
      badge.textContent = 'Danas nije uneseno';
      badge.style.cssText = 'background:#f7f8fa;color:#9ca3af;border-color:#e3e6ed';
    }
  }

  // Weekly summary
  const loggedDays  = dates.filter(d => data[dateKey(d)]);
  const totalLogged = loggedDays.reduce((s, d) => s + (data[dateKey(d)]?.kcal || 0), 0);
  const avgKcal     = loggedDays.length ? Math.round(totalLogged / loggedDays.length) : 0;
  const sumEl = $('trackerWeekSummary');
  if (sumEl) {
    sumEl.innerHTML = loggedDays.length ? `
      <div class="tracker-sum-item"><span class="tracker-sum-val">${loggedDays.length}/7</span><span class="tracker-sum-label">dana uneseno</span></div>
      <div class="tracker-sum-item"><span class="tracker-sum-val">${avgKcal.toLocaleString('bs')}</span><span class="tracker-sum-label">kcal prosjek</span></div>
      <div class="tracker-sum-item"><span class="tracker-sum-val">${totalLogged.toLocaleString('bs')}</span><span class="tracker-sum-label">kcal sedmično</span></div>
    ` : '<span class="tracker-sum-empty">Unesite unose da vidite sedmični pregled</span>';
  }

  // Day cards
  const daysEl = $('trackerDays');
  if (daysEl) {
    daysEl.innerHTML = dates.map(date => {
      const key    = dateKey(date);
      const entry  = data[key];
      const today  = isToday(date);
      const future = date > new Date() && !today;
      const kcal   = entry?.kcal || '';
      const pct    = (goal && kcal) ? Math.round(kcal / goal * 100) : 0;
      const st     = pct > 0 ? getStatusColor(pct) : null;
      return `
        <div class="tracker-day${today?' tracker-day-today':''}${future?' tracker-day-future':''}">
          <div class="tracker-day-head">
            <span class="tracker-day-name">${DAY_NAMES_BS[date.getDay()]}</span>
            <span class="tracker-day-date">${date.getDate()}.${date.getMonth()+1}.</span>
            ${today ? '<span class="tracker-today-dot">DANAS</span>' : ''}
          </div>
          <div class="tracker-input-row">
            <input type="number" class="tracker-input" placeholder="${future?'—':'unesi kcal'}"
              value="${kcal}" min="0" max="9999" ${future?'disabled':''}
              onchange="logDay('${key}', this.value)"
              oninput="this.style.borderColor=this.value?'var(--green)':''">
            <span class="tracker-input-unit">kcal</span>
          </div>
          ${goal && kcal ? `
            <div class="tracker-bar-wrap">
              <div class="tracker-bar" style="width:${Math.min(100,pct)}%;background:${st.color}"></div>
            </div>
            <div class="tracker-pct" style="color:${st.color}">${pct}% · ${st.label}</div>
          ` : goal && !future ? `
            <div class="tracker-bar-wrap"><div class="tracker-bar" style="width:0"></div></div>
            <div class="tracker-pct" style="color:var(--text-4)">cilj: ${goal.toLocaleString('bs')} kcal</div>
          ` : ''}
        </div>`;
    }).join('');
  }

  // Bar chart
  const chartEl = $('trackerChart');
  if (chartEl) {
    const maxKcal = Math.max(goal||0, ...dates.map(d => data[dateKey(d)]?.kcal||0), 100);
    chartEl.innerHTML = dates.map(date => {
      const key    = dateKey(date);
      const kcal   = data[key]?.kcal || 0;
      const today  = isToday(date);
      const future = date > new Date() && !today;
      const hPct   = kcal ? Math.round(kcal/maxKcal*100) : 0;
      const gPct   = goal  ? Math.round(goal/maxKcal*100) : 0;
      const st     = (kcal && goal) ? getStatusColor(Math.round(kcal/goal*100)) : null;
      return `
        <div class="chart-col">
          <div class="chart-bar-wrap">
            ${goal ? `<div class="chart-goal-line" style="bottom:${gPct}%" title="Cilj: ${goal} kcal"></div>` : ''}
            <div class="chart-bar" style="height:${hPct}%;background:${st?st.color:future?'var(--border)':'var(--text-4)'}"
              title="${kcal?kcal+' kcal':'Nije uneseno'}"></div>
          </div>
          <div class="chart-label${today?' chart-label-today':''}">${DAY_SHORT[date.getDay()]}</div>
          ${kcal ? `<div class="chart-val">${kcal}</div>` : '<div class="chart-val">—</div>'}
        </div>`;
    }).join('');
  }
}

function resetTracker() {
  if (!confirm('Obrisati sve kalorijske unose za ovu sedmicu?')) return;
  const data = loadTrackerData();
  getWeekDates().forEach(d => delete data[dateKey(d)]);
  saveTrackerData(data);
  renderTracker();
}

function initTracker() {
  const savedGoal = localStorage.getItem('fm_tracker_goal');
  if (savedGoal) { const i = $('trackerGoalKcal'); if (i && !i.value) i.value = savedGoal; }
  const inp = $('trackerGoalKcal');
  if (inp) { inp.addEventListener('input', updateTrackerGoal); inp.addEventListener('change', updateTrackerGoal); }
  renderTracker(); // always render badge
}

function syncTrackerWithPlan(targetKcal) {
  if (!targetKcal) return;
  const inp = $('trackerGoalKcal');
  if (inp) { inp.value = targetKcal; }
  localStorage.setItem('fm_tracker_goal', targetKcal);
  renderTracker();
}

// ─── Theme ────────────────────────────────────────────────────────────────────
function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  $('themeIcon').textContent = next === 'dark' ? '☀️' : '🌙';
  try { localStorage.setItem('fm_theme', next); } catch(e) {}
}
function initTheme() {
  const t = localStorage.getItem('fm_theme') || 'light';
  document.documentElement.setAttribute('data-theme', t);
  const i = $('themeIcon'); if (i) i.textContent = t === 'dark' ? '☀️' : '🌙';
}

// ─── Protein Cheat Sheet ──────────────────────────────────────────────────────
const proteinData = [
  { category:'🥩 Meso & Perad', items:[
    { name:'Pileća prsa',       per100:31, kcal:165, icon:'🍗', note:'pečena/kuhana, bez kože' },
    { name:'Pileći batak',      per100:25, kcal:190, icon:'🍗', note:'bez kože, kuhan' },
    { name:'Puretina',          per100:29, kcal:189, icon:'🦃', note:'prsa, pečena' },
    { name:'Govedina 10% m.m.', per100:26, kcal:215, icon:'🥩', note:'mljevena, kuhana' },
    { name:'Svinjetina file',   per100:22, kcal:143, icon:'🥩', note:'pečena' },
    { name:'Janjetina',         per100:25, kcal:258, icon:'🥩', note:'pečena, bez masnoće' }
  ]},
  { category:'🐟 Riba & Plodovi mora', items:[
    { name:'Losos',             per100:20, kcal:208, icon:'🐟', note:'atlantski, sirovi' },
    { name:'Tuna (konzerva)',    per100:26, kcal:116, icon:'🐠', note:'u vodi, ocijeđena' },
    { name:'Oslić/Brancin',     per100:18, kcal: 82, icon:'🐟', note:'kuhan, bez ulja' },
    { name:'Sardine',           per100:21, kcal:185, icon:'🐠', note:'konzerva u ulju, ocijeđene' },
    { name:'Skuša',             per100:19, kcal:205, icon:'🐟', note:'kuhana' },
    { name:'Lignje',            per100:16, kcal: 92, icon:'🦑', note:'kuhane' }
  ]},
  { category:'🥚 Jaja & Mliječni', items:[
    { name:'Jaje (cijelo)',      per100:13, kcal:143, icon:'🥚', note:'~8g proteina / 1 jaje (60g)' },
    { name:'Grčki jogurt 2%',   per100:10, kcal: 59, icon:'🥛', note:'cijeđeni, 2% mast' },
    { name:'Skyr',              per100:11, kcal: 63, icon:'🥛', note:'islandski, 0% mast' },
    { name:'Cottage cheese',    per100:11, kcal: 98, icon:'🧀', note:'grudasti svježi sir' },
    { name:'Domaći svježi sir', per100:12, kcal:105, icon:'🧀', note:'polumasni (~8% masti)' },
    { name:'Mozarela (svježa)', per100:17, kcal:242, icon:'🧀', note:'fior di latte, ~20% masti' }
  ]},
  { category:'🌱 Biljni proteini', items:[
    { name:'Tofu (čvrsti)',      per100:8,  kcal: 76, icon:'🟫', note:'firm tofu; ekstra čvrsti = 10-12g/100g' },
    { name:'Tempeh',             per100:19, kcal:193, icon:'🟫', note:'fermentirana soja' },
    { name:'Leća (kuhana)',      per100: 9, kcal:116, icon:'🫘', note:'crvena ili zelena' },
    { name:'Slanutak (kuhan)',   per100: 9, kcal:164, icon:'🫘', note:'iz konzerve ili kuhan' },
    { name:'Crni pasulj (kuhan)',per100: 9, kcal:132, icon:'🫘', note:'kuhan' },
    { name:'Edamame',            per100:11, kcal:121, icon:'💚', note:'kuhano, bez mahune' }
  ]},
  { category:'💪 Proteinski dodaci', items:[
    { name:'Whey protein',       per100:75, kcal:375, icon:'🥤', note:'po mjerici (30g): ~22g proteina, ~115 kcal' },
    { name:'Whey izolat',        per100:90, kcal:360, icon:'🥤', note:'po mjerici (28g): ~25g proteina, ~100 kcal' },
    { name:'Biljni protein',     per100:70, kcal:365, icon:'🥤', note:'po mjerici (28g): ~20g proteina, ~105 kcal' },
    { name:'Kikiriki maslac',    per100:25, kcal:588, icon:'🥜', note:'po 2 kašike (32g): ~8g proteina, ~188 kcal' },
    { name:'Bademi',             per100:21, kcal:579, icon:'🌰', note:'šaka (30g): ~6g proteina, ~174 kcal' },
    { name:'Zobene pahuljice',   per100:13, kcal:389, icon:'🌾', note:'suhe; po porciji (80g): ~10g P, ~60g ugljikohidrata' }
  ]}
];

let cheatOpen = false;
function toggleCheatSheet() {
  cheatOpen = !cheatOpen;
  const body  = $('cheatBody');
  const arrow = $('cheatArrow');
  body.classList.toggle('open', cheatOpen);
  arrow.textContent = cheatOpen ? '▲' : '▼';
}

function renderCheatSheet() {
  const body = $('cheatBody');
  if (!body) return;
  body.innerHTML = `
    <div class="cheat-legend">
      <span>Vrijednosti su na <strong>100g</strong> namirnice</span>
      <div class="cheat-legend-pills">
        <span class="cheat-pill cheat-pill-p">● Proteini</span>
        <span class="cheat-pill cheat-pill-k">● kcal</span>
      </div>
    </div>
    ${proteinData.map(cat => `
    <div class="cheat-cat">
      <div class="cheat-cat-title">${cat.category}</div>
      <div class="cheat-items">
        ${cat.items.map(item => `
          <div class="cheat-item">
            <span class="cheat-item-icon">${item.icon}</span>
            <div class="cheat-item-info">
              <span class="cheat-item-name">${item.name}</span>
              ${item.note ? `<span class="cheat-item-note">${item.note}</span>` : ''}
            </div>
            <div class="cheat-item-stats">
              <div class="cheat-stat">
                <div class="cheat-stat-bar-wrap">
                  <div class="cheat-stat-bar cheat-bar-p" style="width:${Math.min(100, item.per100 * 1.1)}%"></div>
                </div>
                <span class="cheat-stat-val cheat-val-p">${item.per100}g</span>
                <span class="cheat-stat-label">proteina</span>
              </div>
              <div class="cheat-stat">
                <div class="cheat-stat-bar-wrap">
                  <div class="cheat-stat-bar cheat-bar-k" style="width:${Math.min(100, item.kcal / 7)}%"></div>
                </div>
                <span class="cheat-stat-val cheat-val-k">${item.kcal}</span>
                <span class="cheat-stat-label">kcal</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('')}`;
}

// ─── Goal Duration Calculator ─────────────────────────────────────────────────
function calcGoalDuration() {
  const weight = parseFloat($('weight').value);
  const target = parseFloat($('targetWeight').value);
  const goal   = $('goal').value;
  const resultEl = $('goalCalcResult');
  const textEl   = $('goalCalcText');

  if (!weight || !target || isNaN(weight) || isNaN(target)) {
    resultEl.classList.add('hidden');
    return;
  }
  if (goal === 'maintain') {
    resultEl.classList.remove('hidden');
    textEl.innerHTML = `<span class="gcr-icon">⚖️</span><span>Cilj <strong>Održavanje</strong> — zadržavaš trenutnu težinu od ${weight}kg.</span>`;
    return;
  }

  const diff = target - weight;
  // Tempo baziran na stvarnom deficitu/surplusu (7700 kcal = 1kg masti)
  const rates = { loss: 400/7700*7, gain: 300/7700*7, recomp: 200/7700*7 };
  // loss: -400kcal/dan * 7 / 7700kcal/kg = ~0.36kg/sedmično
  // gain: +300kcal/dan * 7 / 7700kcal/kg = ~0.27kg/sedmično
  // recomp: sporije jer jedeš na tdee ali preraspoređuješ
  const rate = rates[goal] || rates.loss;

  if ((goal==='loss' && diff>=0) || (goal==='gain' && diff<=0)) {
    resultEl.classList.add('hidden');
    return;
  }

  const weeks   = Math.abs(Math.ceil(diff / rate));
  const months  = Math.floor(weeks / 4.33);
  const remWeeks = weeks % Math.round(4.33);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + weeks * 7);
  const dateStr = endDate.toLocaleDateString('bs', { day:'numeric', month:'long', year:'numeric' });

  const timeStr = months > 0
    ? `${months} ${months===1?'mjesec':months<5?'mjeseca':'mjeseci'}${remWeeks>0?` i ${remWeeks} ${remWeeks===1?'sedmica':remWeeks<5?'sedmice':'sedmica'}`:''}` 
    : `${weeks} ${weeks===1?'sedmica':weeks<5?'sedmice':'sedmica'}`;

  const icons = { loss:'📉', gain:'📈', recomp:'♻️' };
  const msgs  = { loss:`Gubiš ${Math.abs(diff).toFixed(1)}kg`, gain:`Dobijavaš ${diff.toFixed(1)}kg`, recomp:`Rekompozicija ${Math.abs(diff).toFixed(1)}kg` };
  const rates_text = { loss:'~0,36kg/sedmično', gain:'~0,27kg/sedmično', recomp:'~0,18kg/sedmično' };

  resultEl.classList.remove('hidden');
  textEl.innerHTML = `
    <span class="gcr-icon">${icons[goal]}</span>
    <div class="gcr-details">
      <strong>${msgs[goal]} za ~${timeStr}</strong>
      <span>Procijenjeni datum: ${dateStr} · Tempo: ${rates_text[goal]}</span>
    </div>
  `;
}

// ─── Water Calculator ─────────────────────────────────────────────────────────
const WATER_KEY = 'fm_water';

function calcWaterNeeds(weight, trainingHours) {
  const base = weight * 0.033;
  const extra = (trainingHours || 0) * 0.5;
  return Math.round((base + extra) * 10) / 10; // litara
}

function loadWaterToday() {
  try {
    const d = JSON.parse(localStorage.getItem(WATER_KEY) || '{}');
    const todayKey = new Date().toISOString().split('T')[0];
    return d[todayKey] || 0;
  } catch(e) { return 0; }
}
function saveWaterToday(glasses) {
  try {
    const d = JSON.parse(localStorage.getItem(WATER_KEY) || '{}');
    const todayKey = new Date().toISOString().split('T')[0];
    d[todayKey] = glasses;
    localStorage.setItem(WATER_KEY, JSON.stringify(d));
  } catch(e) {}
}

function addWater(delta) {
  const current = loadWaterToday();
  const newVal = Math.max(0, current + delta);
  saveWaterToday(newVal);
  renderWaterTracker();
}

function renderWaterSection(weight, trainingHours) {
  const el = $('waterSection');
  if (!el) return;
  const needed = calcWaterNeeds(weight, trainingHours);
  const glassML = 250;
  const totalGlasses = Math.ceil((needed * 1000) / glassML);
  renderWaterTracker(needed, totalGlasses);
}

function renderWaterTracker(needed, totalGlasses) {
  const el = $('waterContent');
  if (!el) return;
  const glasses = loadWaterToday();
  if (!needed || needed <= 0) {
    const w = parseFloat($('weight')?.value || 0);
    const t = parseFloat($('trainingHours')?.value || 0);
    needed = w > 0 ? calcWaterNeeds(w, t) : 2.5; // default 2.5L ako nema unosa
    totalGlasses = Math.ceil((needed * 1000) / 250);
  }
  if (!totalGlasses || totalGlasses <= 0) totalGlasses = 10; // safety fallback
  const pct = Math.min(100, Math.round(glasses / totalGlasses * 100));
  const liters = (glasses * 0.25).toFixed(2);
  const color = pct < 40 ? '#3b82f6' : pct < 75 ? '#16a34a' : '#d97706';

  const glassIcons = Array.from({length: totalGlasses}, (_, i) => `
    <button class="water-glass ${i < glasses ? 'water-glass-filled' : ''}" 
      onclick="addWater(${i < glasses ? -1 : 1})" title="${i < glasses ? 'Ukloni čašu' : 'Dodaj čašu'}">
      ${i < glasses ? '🥤' : '🫙'}
    </button>`).join('');

  el.innerHTML = `
    <div class="water-target">
      <span class="water-target-val">${needed}L</span>
      <span class="water-target-label">dnevna potreba</span>
      <span class="water-sep">·</span>
      <span>${totalGlasses} čaša po 250ml</span>
    </div>
    <div class="water-progress-wrap">
      <div class="water-progress-bar" style="width:${pct}%;background:${color}"></div>
    </div>
    <div class="water-stats">
      <strong style="color:${color}">${liters}L / ${needed}L</strong>
      <span>(${glasses} čaša · ${pct}%)</span>
    </div>
    <div class="water-glasses">${glassIcons}</div>
    <div class="water-actions">
      <button class="btn-sm" onclick="addWater(1)">+ Čaša</button>
      <button class="btn-sm" onclick="addWater(-1)">- Čaša</button>
      <button class="btn-sm" onclick="saveWaterToday(0);renderWaterTracker()">↺ Reset</button>
    </div>
    ${glasses >= totalGlasses ? '<div class="water-done">🎉 Cilj postignut! Odlično hidriran/a si danas.</div>' : ''}
  `;
}

// ─── BMI + Body Fat Calculator ────────────────────────────────────────────────
function calcBMILive() {
  const weight = parseFloat($('weight')?.value);
  const height = parseFloat($('height')?.value);
  const waist  = parseFloat($('waist')?.value);
  const neck   = parseFloat($('neck')?.value);
  const hip    = parseFloat($('hip')?.value);
  const gender = $('gender')?.value;

  const el = $('bmiLiveResult');
  if (!el) return;
  if (!weight || !height) { el.classList.add('hidden'); return; }

  const bmi = weight / ((height/100) ** 2);
  const bmiRound = Math.round(bmi * 10) / 10;

  const bmiCat =
    bmi < 18.5 ? 'Pothranjenost'       :
    bmi < 25   ? 'Normalna težina'      :
    bmi < 30   ? 'Prekomjerna težina'   :
    bmi < 35   ? 'Gojaznost I stupnja'  :
    bmi < 40   ? 'Gojaznost II stupnja' :
                 'Gojaznost III stupnja';
  const bmiColor =
    bmi < 18.5 ? '#3b82f6' :
    bmi < 25   ? '#16a34a' :
    bmi < 30   ? '#d97706' :
                 '#dc2626';

  let fatHTML = '';
  if (waist && neck && height) {
    let bodyFat;
    if (gender === 'male') {
      bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
    } else if (hip) {
      bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
    }
    if (bodyFat && bodyFat > 0 && bodyFat < 60) {
      const bf = Math.round(bodyFat * 10) / 10;
      let bfCat, bfColor;
      // ACE standardi za % tjelesne masti
      if (gender === 'male') {
        bfCat  = bf<3?'Esencijalne masti':bf<6?'Atletski':bf<14?'Fit':bf<18?'Prihvatljivo':bf<25?'Prosječno':'Prekomjerno';
        bfColor = bf<6?'#3b82f6':bf<18?'#16a34a':bf<25?'#d97706':'#dc2626';
      } else {
        bfCat  = bf<10?'Esencijalne masti':bf<14?'Atletski':bf<21?'Fit':bf<25?'Prihvatljivo':bf<32?'Prosječno':'Prekomjerno';
        bfColor = bf<14?'#3b82f6':bf<25?'#16a34a':bf<32?'#d97706':'#dc2626';
      }
      const fatMass = Math.round(weight * bf / 100 * 10) / 10;
      const leanMass = Math.round((weight - fatMass) * 10) / 10;
      fatHTML = `
        <div class="bmi-stat">
          <span class="bmi-stat-label">% tjelesne masti</span>
          <span class="bmi-stat-val" style="color:${bfColor}">${bf}%</span>
          <span class="bmi-stat-cat">${bfCat}</span>
        </div>
        <div class="bmi-stat">
          <span class="bmi-stat-label">Masno tkivo</span>
          <span class="bmi-stat-val">${fatMass}kg</span>
        </div>
        <div class="bmi-stat">
          <span class="bmi-stat-label">Mišićna masa</span>
          <span class="bmi-stat-val">${leanMass}kg</span>
        </div>`;
    }
  }

  el.classList.remove('hidden');
  el.innerHTML = `
    <div class="bmi-live-inner">
      <div class="bmi-stat">
        <span class="bmi-stat-label">BMI</span>
        <span class="bmi-stat-val" style="color:${bmiColor}">${bmiRound}</span>
        <span class="bmi-stat-cat">${bmiCat}</span>
      </div>
      ${fatHTML}
      ${!waist || !neck ? '<span class="bmi-hint">Unesi obim struka i vrata za izračun % tjelesne masti</span>' : ''}
    </div>`;

  // Also update results BMI section if visible
  renderBMISection(weight, height, waist, neck, hip, gender);
}

function renderBMISection(weight, height, waist, neck, hip, gender) {
  const el = $('bmiContent');
  if (!el) return;
  const bmi = weight / ((height/100)**2);
  const bmiR = Math.round(bmi*10)/10;
  let bmiCat, bmiColor;
  if (bmi < 18.5)    { bmiCat='Pothranjenost';           bmiColor='#3b82f6'; }
  else if (bmi < 25) { bmiCat='Normalna težina';          bmiColor='#16a34a'; }
  else if (bmi < 30) { bmiCat='Prekomjerna težina';       bmiColor='#d97706'; }
  else if (bmi < 35) { bmiCat='Gojaznost I stupnja';      bmiColor='#dc2626'; }
  else if (bmi < 40) { bmiCat='Gojaznost II stupnja';     bmiColor='#dc2626'; }
  else               { bmiCat='Gojaznost III stupnja';    bmiColor='#7f1d1d'; }

  const idealLow = Math.round(18.5 * (height/100)**2);
  const idealHigh = Math.round(24.9 * (height/100)**2);

  let bfSection = '';
  if (waist && neck && height) {
    let bf;
    if (gender === 'male') bf = 495 / (1.0324 - 0.19077*Math.log10(waist-neck) + 0.15456*Math.log10(height)) - 450;
    else if (hip) bf = 495 / (1.29579 - 0.35004*Math.log10(waist+hip-neck) + 0.22100*Math.log10(height)) - 450;
    if (bf && bf > 0 && bf < 60) {
      const bfR = Math.round(bf*10)/10;
      const fatMass = Math.round(weight*bfR/100*10)/10;
      const leanMass = Math.round((weight-fatMass)*10)/10;
      let bfCat, bfColor;
      if (gender === 'male') {
        bfCat  = bfR<3?'Esencijalne masti':bfR<6?'Atletski':bfR<14?'Fit':bfR<18?'Prihvatljivo':bfR<25?'Prosječno':'Prekomjerno';
        bfColor= bfR<6?'#3b82f6':bfR<18?'#16a34a':bfR<25?'#d97706':'#dc2626';
      } else {
        bfCat  = bfR<10?'Esencijalne masti':bfR<14?'Atletski':bfR<21?'Fit':bfR<25?'Prihvatljivo':bfR<32?'Prosječno':'Prekomjerno';
        bfColor= bfR<14?'#3b82f6':bfR<25?'#16a34a':bfR<32?'#d97706':'#dc2626';
      }
      bfSection = `
        <div class="bmi-result-row">
          <div class="bmi-big-val" style="color:${bfColor}">${bfR}%<span>tjelesne masti</span></div>
          <div class="bmi-detail-grid">
            <div><span>Kategorija</span><strong style="color:${bfColor}">${bfCat}</strong></div>
            <div><span>Masno tkivo</span><strong>${fatMass}kg</strong></div>
            <div><span>Mišićna masa</span><strong>${leanMass}kg</strong></div>
          </div>
        </div>`;
    }
  } else {
    bfSection = '<p class="bmi-note">Za % tjelesne masti unesi obim struka i vrata u formi iznad.</p>';
  }

  el.innerHTML = `
    <div class="bmi-result-row">
      <div class="bmi-big-val" style="color:${bmiColor}">${bmiR}<span>BMI</span></div>
      <div class="bmi-detail-grid">
        <div><span>Kategorija</span><strong style="color:${bmiColor}">${bmiCat}</strong></div>
        <div><span>Idealna težina</span><strong>${idealLow}–${idealHigh}kg</strong></div>
        <div><span>Trenutna</span><strong>${weight}kg</strong></div>
      </div>
    </div>
    ${bfSection}`;
}

// ─── RDA Procjena ─────────────────────────────────────────────────────────────
// RDA prema NIH/WHO, rodno-specifični
function getRDA(gender) {
  const isMale = gender === 'male';
  return {
    'Vitamin C':   { unit:'mg', rda: isMale ? 90 : 75,   emoji:'🍊' },
    'Vitamin D':   { unit:'μg', rda: 15,                  emoji:'☀️' },
    'Vitamin B12': { unit:'μg', rda: 2.4,                 emoji:'🥩' },
    'Kalcij':      { unit:'mg', rda: 1000,                emoji:'🥛' },
    'Gvožđe':      { unit:'mg', rda: isMale ? 8 : 18,    emoji:'🫘' },
    'Magnezij':    { unit:'mg', rda: isMale ? 420 : 320,  emoji:'🥬' },
    'Cink':        { unit:'mg', rda: isMale ? 11 : 8,     emoji:'🌰' },
    'Omega-3':     { unit:'g',  rda: isMale ? 1.6 : 1.1,  emoji:'🐟' },
  };
}

// Per 100g namirnica — mikrogram/mg
const NUTR_MICRODB = {
  'piletina':    { 'Vitamin B12':0.31, 'Gvožđe':0.9,  'Cink':1.0,  'Magnezij':25 },
  'pileć':       { 'Vitamin B12':0.31, 'Gvožđe':0.9,  'Cink':1.0,  'Magnezij':25 },
  'govedina':    { 'Vitamin B12':2.5,  'Gvožđe':2.6,  'Cink':4.8,  'Magnezij':21 },
  'losos':       { 'Vitamin D':11,  'Vitamin B12':3.2, 'Omega-3':2.3, 'Magnezij':29 },
  'sardine':     { 'Vitamin D':4.8, 'Vitamin B12':8.9, 'Kalcij':382, 'Omega-3':1.5, 'Magnezij':39 },
  'tuna':        { 'Vitamin D':5.7, 'Vitamin B12':2.5, 'Omega-3':0.6, 'Magnezij':35 },
  'jaje':        { 'Vitamin D':2.0, 'Vitamin B12':0.89,'Gvožđe':1.8, 'Cink':1.3 },
  'jogurt':      { 'Kalcij':121,  'Vitamin B12':0.37, 'Cink':0.6 },
  'mlijeko':     { 'Kalcij':113,  'Vitamin D':0.5,  'Vitamin B12':0.4 },
  'brokula':     { 'Vitamin C':89, 'Kalcij':47, 'Magnezij':21, 'Gvožđe':0.7 },
  'špinat':      { 'Vitamin C':28, 'Kalcij':99, 'Magnezij':79, 'Gvožđe':2.7 },
  'paprika':     { 'Vitamin C':128,'Magnezij':12 },
  'leća':        { 'Gvožđe':3.3,  'Magnezij':36, 'Cink':1.3 },
  'slanutak':    { 'Gvožđe':2.9,  'Magnezij':48, 'Cink':1.5 },
  'bademi':      { 'Magnezij':270, 'Kalcij':264, 'Cink':3.1 },
  'chia':        { 'Kalcij':631,  'Magnezij':335,'Omega-3':17.5,'Gvožđe':7.7 },
  'lanene':      { 'Omega-3':22.8,'Magnezij':392,'Kalcij':255 },
  'avokado':     { 'Magnezij':29, 'Vitamin C':10 },
  'jabuka':      { 'Vitamin C':4.6 },
  'banana':      { 'Vitamin C':8.7,'Magnezij':27 },
  'paradajz':    { 'Vitamin C':14, 'Magnezij':11 },
};

function estimateRDA(week) {
  // Inicijalizuj sve poznate nutrijente na 0
  const NUTR_KEYS = ['Vitamin C','Vitamin D','Vitamin B12','Kalcij','Gvožđe','Magnezij','Cink','Omega-3'];
  const totals = {};
  NUTR_KEYS.forEach(k => { totals[k] = 0; });

  week.forEach(dayObj => {
    Object.values(dayObj.meals).forEach(mealData => {
      const mealStr = typeof mealData === 'object' ? mealData.t : (mealData || '');
      const gramMatches = [...mealStr.matchAll(/(\d+)g\s+([a-zčćšđž\s]+?)(?=\+|$|\()/gi)];
      for (const [,grams, name] of gramMatches) {
        const n = name.toLowerCase().trim();
        const factor = parseInt(grams) / 100;
        for (const [food, micros] of Object.entries(NUTR_MICRODB)) {
          if (n.includes(food)) {
            for (const [nutr, val] of Object.entries(micros)) {
              totals[nutr] = (totals[nutr] || 0) + val * factor;
            }
            break;
          }
        }
      }
    });
  });

  // Prosjek po danu
  return Object.fromEntries(Object.entries(totals).map(([k,v]) => [k, Math.round(v/7*10)/10]));
}

function renderRDA(week) {
  const el = $('rdaContent');
  if (!el) return;
  const gender = lastForm?.gender || 'male';
  const RDA = getRDA(gender);
  const daily = estimateRDA(week);

  el.innerHTML = `
    <p class="rda-note">Gruba procjena bazirana na prepoznatim namirnicama u jelovniku. Vrijednosti su prosjek po danu.</p>
    <div class="rda-grid">
      ${Object.entries(RDA).map(([name, info]) => {
        const val = daily[name] || 0;
        const pct = Math.min(150, Math.round(val / info.rda * 100));
        const color = pct < 30 ? '#dc2626' : pct < 60 ? '#d97706' : pct < 90 ? '#3b82f6' : '#16a34a';
        const label = pct < 30 ? 'Manjak' : pct < 60 ? 'Nizak' : pct < 90 ? 'Dobar' : pct <= 100 ? 'Odličan' : 'Iznad RDA';
        return `
          <div class="rda-item">
            <div class="rda-item-head">
              <span class="rda-emoji">${info.emoji}</span>
              <span class="rda-name">${name}</span>
              <span class="rda-pct" style="color:${color}">${pct}%</span>
            </div>
            <div class="rda-bar-wrap">
              <div class="rda-bar" style="width:${Math.min(100,pct)}%;background:${color}"></div>
            </div>
            <div class="rda-detail">
              <span>${val}${info.unit} / ${info.rda}${info.unit}</span>
              <span style="color:${color}">${label}</span>
            </div>
          </div>`;
      }).join('')}
    </div>
    <p class="rda-disclaimer">⚠️ Ovo je procjena — stvarni unos ovisi o pripremi i kvaliteti namirnica. Za medicinski savjet konsultuj nutricionistu.</p>`;
}

// ─── Plan History ─────────────────────────────────────────────────────────────
const HISTORY_KEY = 'fm_history';
const MAX_HISTORY = 5;

function savePlanToHistory(result, formData) {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleDateString('bs', { day:'numeric', month:'long', year:'numeric' }),
      time: new Date().toLocaleTimeString('bs', { hour:'2-digit', minute:'2-digit' }),
      goal: formData.goal,
      diet: formData.diet,
      target: result.nutrition.target,
      aiGenerated: result.aiGenerated,
      result,
      formData
    };
    history.unshift(entry);
    if (history.length > MAX_HISTORY) history.pop();
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    renderHistoryBadge();
    if (historyOpen) renderHistoryList();
  } catch(e) { console.error('History save error:', e); }
}

let historyOpen = false;
function toggleHistory() {
  historyOpen = !historyOpen;
  $('historyBody').classList.toggle('open', historyOpen);
  $('historyArrow').textContent = historyOpen ? '▲' : '▼';
  if (historyOpen) renderHistoryList();
}

function renderHistoryBadge() {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const badge = $('historyCountBadge');
    if (badge) {
      badge.textContent = history.length ? `${history.length} plan${history.length === 1 ? '' : 'a'}` : '';
      badge.style.cssText = history.length ? 'background:#f0fdf4;color:#16a34a;border-color:#86efac' : '';
    }
  } catch(e) {}
}

const GOAL_LABELS = { loss:'Mršavljenje', maintain:'Održavanje', gain:'Izgradnja mišića', recomp:'Rekompozicija' };
const DIET_LABELS = { none:'Omnivor', vegetarian:'Vegetarijanac', vegan:'Vegan', lactose_free:'Bez laktoze', gluten_free:'Bez glutena', keto:'Keto', mediterranean:'Mediteranski' };

function renderHistoryList() {
  const el = $('historyList');
  if (!el) return;
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    if (!history.length) {
      el.innerHTML = '<p class="history-empty">Još nema sačuvanih planova. Generiraj plan pa će se automatski sačuvati ovdje.</p>';
      return;
    }
    el.innerHTML = history.map((entry, i) => `
      <div class="history-entry ${i === 0 ? 'history-entry-latest' : ''}">
        <div class="history-entry-info">
          <div class="history-entry-date">${entry.date} u ${entry.time} ${i===0?'<span class="history-latest-badge">Najnoviji</span>':''}</div>
          <div class="history-entry-meta">
            <span>${GOAL_LABELS[entry.goal]||entry.goal}</span>
            <span>·</span>
            <span>${DIET_LABELS[entry.diet]||entry.diet}</span>
            <span>·</span>
            <span>${entry.target} kcal/dan</span>
            ${entry.aiGenerated ? '<span class="history-ai-badge">🤖 AI</span>' : ''}
          </div>
        </div>
        <div class="history-entry-actions">
          <button class="btn-sm" onclick="loadHistoryPlan(${entry.id})">📋 Učitaj plan</button>
          <button class="btn-sm" onclick="deleteHistoryPlan(${entry.id})">🗑️</button>
        </div>
      </div>`).join('');
  } catch(e) {
    el.innerHTML = '<p class="history-empty">Greška pri učitavanju historije.</p>';
  }
}

function loadHistoryPlan(id) {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const entry = history.find(e => e.id === id);
    if (!entry) return;
    lastResult = entry.result;
    lastForm   = entry.formData;
    renderResults(entry.result);
    $('results').scrollIntoView({ behavior:'smooth' });
  } catch(e) { console.error('Load history error:', e); }
}

function deleteHistoryPlan(id) {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]').filter(e => e.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    renderHistoryBadge();
    renderHistoryList();
  } catch(e) {}
}

// ─── QR Code ──────────────────────────────────────────────────────────────────
function showQR() {
  if (!lastResult) return;
  const modal = $('qrModal');
  const container = $('qrContainer');
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  container.innerHTML = '';

  const { nutrition, week } = lastResult;
  const goal  = lastForm?.goal || 'maintain';
  const diet  = lastForm?.diet || 'none';
  const gL    = { loss:'Mršavljenje', maintain:'Održavanje', gain:'Izgradnja mišića', recomp:'Rekompozicija' };
  const dL    = { none:'Omnivor', vegetarian:'Vegetarijanac', vegan:'Vegan', lactose_free:'Bez laktoze', gluten_free:'Bez glutena', keto:'Keto', mediterranean:'Mediteranski' };

  // Build compact plain text that fits in QR (max ~500 chars)
  const lines = [
    `FOODMANAGER — PLAN ISHRANE`,
    `Cilj: ${gL[goal]} | Ishrana: ${dL[diet]}`,
    `Kalorije: ${nutrition.target} kcal/dan`,
    `P: ${nutrition.macro.protein}g | UH: ${nutrition.macro.carbs}g | M: ${nutrition.macro.fats}g`,
    ``,
  ];

  // Add first 3 days meals
  const getMT = (m) => typeof m === 'object' && m ? m.t : (m || '');

  week.slice(0, 3).forEach(d => {
    lines.push(`${d.day}:`);
    lines.push(`  D: ${getMT(d.meals.dorucak).substring(0,45)}`);
    lines.push(`  R: ${getMT(d.meals.rucak).substring(0,45)}`);
    lines.push(`  V: ${getMT(d.meals.vecera).substring(0,45)}`);
  });

  lines.push(``, `Generirano: FoodManager`);
  const qrText = lines.join('\n').substring(0, 900); // QR limit

  try {
    if (typeof QRCode === 'function' && QRCode.prototype && QRCode.prototype.makeCode) {
      // qrcodejs API
      new QRCode(container, {
        text: qrText,
        width: 220, height: 220,
        colorDark: '#0f1117', colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.L
      });
    } else if (typeof QRCode !== 'undefined' && QRCode.toCanvas) {
      // qrcode npm API
      const canvas = document.createElement('canvas');
      container.appendChild(canvas);
      QRCode.toCanvas(canvas, qrText, {
        width: 220,
        color: { dark: '#0f1117', light: '#ffffff' },
        errorCorrectionLevel: 'L'
      });
    } else {
      throw new Error('QR library not loaded');
    }
  } catch(e) {
    container.innerHTML = `
      <div style="padding:16px;text-align:center;color:var(--text-3)">
        <p style="font-size:.85rem;margin-bottom:12px">QR knjižnica nije dostupna.</p>
        <p style="font-size:.78rem">Preuzmi HTML plan i podijeli direktno.</p>
      </div>`;
  }
}

function closeQRModal(e) {
  if (e && e.target !== $('qrModal')) return;
  $('qrModal').classList.add('hidden');
  document.body.style.overflow = '';
}

// ─── Enhanced Meal Swap with nutrition comparison ─────────────────────────────
const substitutionDB = {
  // Kljucne rijeci -> lista zamjena
  piletina: ['250g puretine + isti prilog','200g oslića + isti prilog','250g lososa + isti prilog','200g tune (konzerva) + isti prilog'],
  losos:    ['250g oslića ili brancina','200g skuše (pečena, s limunom)','200g tune (konzerva)','250g pilećih prsa — isti način pripreme'],
  tuna:     ['200g sardina (konzerva u ulju)','250g oslića','200g dimljenog lososa','3 tvrdo kuhana jaja + 100g domaćeg sira'],
  govedina: ['250g pilećih prsa','200g puretine mljevene','200g oslića ili tune','150g (suhe) leće — biljni protein'],
  jaja:     ['200g domaćeg sira + 30g whey','250g grčkog jogurta + orasi','200g cottage cheese','150g tofu scramble + povrće'],
  zobi:     ['80g heljdinih pahuljica + isto','80g prosa pahuljica + isto','80g riže pahuljica + isto','50g chia pudding + zobeno mlijeko'],
  riza:     ['80g (suhe) heljde','80g (suhe) kinoe','80g (suhe) bulgura','150g slatkog krompira'],
  krompir:  ['150g slatkog krompira','80g (suhe) riže','80g (suhe) heljde','80g (suhe) kinoe'],
  tjestenina:['80g (suhe) heljde','80g (suhe) integralne riže','80g (suhe) kinoe','150g slatkog krompira'],
  tofu:     ['200g tempeha (grilovani)','200g slanutka (kuhanog)','150g (suhe) leće','3 jaja + 100g sira (za vegetarijance)'],
  leća:     ['200g slanutka','200g crvenog pasulja','200g crnog pasulja','200g edamame'],
  slanutak: ['200g crvene leće','200g crnog pasulja','150g tempeha','200g tofu'],
  jogurt:   ['200g skyra','200g cottage cheese','200g kefira','200g domaćeg sira'],
  skyr:     ['200g grčkog jogurta 2%','200g cottage cheese','30g whey + 150ml mlijeka','200g kefira'],
};

function findSubstitutions(mealText) {
  const text = mealText.toLowerCase();
  const found = [];
  const keywords = Object.keys(substitutionDB);
  for (const kw of keywords) {
    if (text.includes(kw)) {
      found.push({ keyword: kw, subs: substitutionDB[kw] });
      if (found.length >= 2) break; // max 2 kategorije
    }
  }
  return found;
}

let currentSwapCallback = null;

function openSubModal(mealText, dayNum, mealKey, currentText) {
  const found = findSubstitutions(mealText);
  const modal = $('subModal');
  const title = $('subModalTitle');
  const desc  = $('subModalDesc');
  const opts  = $('subOptions');

  const mealLabels2 = { dorucak:'Doručak', uzina:'Užina', rucak:'Ručak', predtrening:'Pred-trening', vecera:'Večera' };
  title.textContent = `Zamjene za ${mealLabels2[mealKey] || mealKey} — Dan ${dayNum}`;

  // Current meal nutrition
  const currentNutr = calcMealNutrition(currentText);
  const currentNutrHTML = currentNutr ? 
    `<span class="swap-nutr-pill">Trenutno: <strong>${currentNutr.kcal} kcal</strong> · P:${currentNutr.p}g · UH:${currentNutr.c}g · M:${currentNutr.f}g</span>` : '';
  desc.innerHTML = `<div class="swap-current"><strong>${currentText}</strong>${currentNutrHTML}</div>`;

  const allSubs = [];
  found.forEach(f => f.subs.forEach(s => { if (!allSubs.includes(s)) allSubs.push(s); }));

  if (!allSubs.length) {
    opts.innerHTML = '<p class="sub-no-match">Nema predloženih zamjena za ovaj obrok u bazi.</p>';
  } else {
    const subsToShow = allSubs.slice(0, 5);
    window._subOptions = subsToShow;
    window._subContext = { dayNum, mealKey };

    opts.innerHTML = subsToShow.map((sub, i) => {
      const n = calcMealNutrition(sub);
      const diff = (currentNutr && n) ? n.kcal - currentNutr.kcal : null;
      const diffHTML = diff !== null ? `<span class="swap-diff ${diff > 50 ? 'diff-more' : diff < -50 ? 'diff-less' : 'diff-same'}">${diff > 0 ? '+' : ''}${diff} kcal</span>` : '';
      const nutrHTML = n ? `
        <div class="sub-nutr-compare">
          <span><strong>${n.kcal}</strong> kcal</span>
          <span>P: <strong>${n.p}g</strong></span>
          <span>UH: <strong>${n.c}g</strong></span>
          <span>M: <strong>${n.f}g</strong></span>
          ${diffHTML}
        </div>` : '';
      return `
        <div class="sub-option" onclick="swapMeal(${dayNum}, '${mealKey}', ${i})">
          <span class="sub-option-num">${i+1}</span>
          <div class="sub-option-main">
            <span class="sub-option-text">${sub}</span>
            ${nutrHTML}
          </div>
          <span class="sub-option-pick">Odaberi →</span>
        </div>`;
    }).join('');
  }

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function swapMeal(dayNum, mealKey, optIndex) {
  if (!lastResult) return;
  const newMeal = window._subOptions?.[optIndex];
  if (!newMeal) return;

  const dayObj = lastResult.week.find(d => d.dayNum === dayNum);
  if (dayObj) {
    dayObj.meals[mealKey] = newMeal;
    // Update DOM directly
    const mealEl = document.querySelector(`[data-day="${dayNum}"][data-meal="${mealKey}"] .meal-name`);
    const nutrEl = document.querySelector(`[data-day="${dayNum}"][data-meal="${mealKey}"] .meal-nutr`);
    if (mealEl) {
      mealEl.textContent = newMeal;
      mealEl.classList.add('meal-swapped');
      setTimeout(() => mealEl.classList.remove('meal-swapped'), 1500);
    }
    // Update nutrition badge
    if (nutrEl) {
      const n = calcMealNutrition(newMeal);
      if (n) nutrEl.outerHTML = mealNutrBadge(newMeal);
    }
  }
  closeSubModal();
}

function closeSubModal(e) {
  if (e && e.target !== $('subModal')) return;
  $('subModal').classList.add('hidden');
  document.body.style.overflow = '';
}

// ─── Utils ────────────────────────────────────────────────────────────────────
function showError(msg) {
  const el = $('formError');
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 6000);
}
function setLoading(on, msg = 'Računam nutritivne vrijednosti...') {
  $('loading').classList.toggle('hidden', !on);
  $('loadingText').textContent = msg;
  if (on) $('results').classList.add('hidden');
  $('generateBtn').disabled = on;
}
function validateForm() {
  const age    = parseInt($('age').value);
  const height = parseInt($('height').value);
  const weight = parseFloat($('weight').value);
  if (!age    || age < 10    || age > 120)     return 'Dob mora biti između 10 i 120 godina.';
  if (!height || height < 100 || height > 250) return 'Visina mora biti između 100 i 250 cm.';
  if (!weight || weight < 30  || weight > 300) return 'Težina mora biti između 30 i 300 kg.';
  return null;
}
function saveForm() {
  const d = {
    age:$('age').value, height:$('height').value, weight:$('weight').value,
    gender:$('gender').value, activity:$('activity').value, goal:$('goal').value,
    diet:$('diet').value, restrictions:$('restrictions').value,
    healthNotes:$('healthNotes').value, useAI:$('useAI').checked,
    targetWeight:$('targetWeight').value
  };
  try { localStorage.setItem('fm_form', JSON.stringify(d)); } catch(e) {}
}
function loadForm() {
  try {
    const saved = localStorage.getItem('fm_form');
    if (!saved) return;
    const d = JSON.parse(saved);
    ['age','height','weight','restrictions','healthNotes','targetWeight'].forEach(k => { if (d[k]) $(k).value = d[k]; });
    ['gender','activity','goal','diet'].forEach(k => { if (d[k]) $(k).value = d[k]; });
    if (d.useAI !== undefined) $('useAI').checked = d.useAI;
    calcGoalDuration();
  } catch(e) {}
}

// ─── Exercise Data ────────────────────────────────────────────────────────────
const exerciseData = {
  loss: {
    subtitle: 'Kombinacija kardija i snage maksimizira gubitak masti uz očuvanje mišića.',
    weekSchedule: 'Preporučena sedmica: Snaga → Kardio → Snaga → Odmor → Kardio → Snaga → Odmor',
    blocks: [
      { icon:'🏋️', title:'Trening snage', freq:'3× sedmično', duration:'40–50 min', color:'purple',
        items:['Full-body trening ili gornji/donji split','Složene vježbe: čučanj, mrtvo dizanje, bench press, veslanje','Reps: 10–15, odmor 60 sek između serija','Progresivno povećavaj težinu svake sedmice'] },
      { icon:'🏃', title:'Kardio', freq:'3× sedmično', duration:'30–45 min', color:'blue',
        items:['Brza šetnja, trčanje, bicikl ili plivanje','Umjereni intenzitet — možeš razgovarati tokom treninga','Alternativno: HIIT 20 min (30 sek sprint / 90 sek hod)','Kardio radi odvojeno od snage'] },
      { icon:'🚶', title:'Svakodnevna aktivnost', freq:'Svaki dan', duration:'—', color:'green',
        items:['7.000–10.000 koraka dnevno — najvažniji faktor','15 min šetnje poslije svakog većeg obroka','Stepenice umjesto lifta, pješačenje umjesto auta','NEAT aktivnost gori više kalorija od treninga!'] }
    ],
    tip: 'Greška br.1: previše kardija, premalo snage. Bez snage, uz deficit gubiš i mišiće — metabolizam se usporava i težina se vraća.'
  },
  gain: {
    subtitle: 'Primarni fokus na trening snage s progresivnim preopterećenjem. Kardio minimalan.',
    weekSchedule: 'Preporučena sedmica: Grudi/Triceps → Leđa/Biceps → Noge → Odmor → Ramena/Core → Odmor → Opciono',
    blocks: [
      { icon:'🏋️', title:'Trening snage — glavni fokus', freq:'4–5× sedmično', duration:'60–75 min', color:'purple',
        items:['Push/Pull/Legs split ili Upper/Lower split','Složene vježbe: bench press, čučanj, mrtvo dizanje, OHP','Reps: 6–12, odmor 90–120 sek, 3–5 serija po vježbi','Progresivno preopterećenje — svake sedmice +1–2kg ili +1 rep'] },
      { icon:'🚴', title:'Kardio — minimalan', freq:'1–2× sedmično', duration:'20–30 min', color:'blue',
        items:['Lagani kardio samo za zdravlje srca — ne za kalorije','Šetnja, bicikl niskim intenzitetom, plivanje','Previše kardija ruši kalorijski surplus i usporava rast','Na danima odmora — ne direktno pred ili posle treninga snage'] },
      { icon:'😴', title:'Oporavak — jednako važan', freq:'Svaki dan', duration:'8h sna', color:'green',
        items:['70% mišićnog rasta dešava se tokom sna — 8h je minimum','Protein unutar 30–60 min poslije treninga (anabolički prozor)','Istezanje 10 min poslije svakog treninga','Dva dana odmora sedmično — mišići rastu u odmoru, ne treningu'] }
    ],
    tip: 'Greška br.1: premalo jede. Bez kalorijskog surplusa nema rasta mišića, bez obzira koliko se trenira.'
  },
  maintain: {
    subtitle: 'Balansirana rutina snage i kardija za dugotrajno zdravlje i formu.',
    weekSchedule: 'Preporučena sedmica: Snaga → Kardio → Snaga → Odmor/Šetnja → Snaga → Kardio → Odmor',
    blocks: [
      { icon:'🏋️', title:'Trening snage', freq:'3× sedmično', duration:'45–55 min', color:'purple',
        items:['Full-body ili push/pull/legs — po preferenciji','Složene vježbe: čučanj, mrtvo dizanje, bench, veslanje','Reps: 8–12, odmor 90 sek, 3–4 serije','Fokus na formu vježbe — nije potrebno povećavati težinu svake sedmice'] },
      { icon:'🏃', title:'Kardio', freq:'2–3× sedmično', duration:'30–40 min', color:'blue',
        items:['Trčanje, brza šetnja, bicikl, plivanje, ples','Umjereni intenzitet — zona 2 kardio (nos-disanje)','Odaberi aktivnost koja ti je ugodna — dosljednost je ključ','Može biti i sport: tenis, košarka, fudbal'] },
      { icon:'🧘', title:'Mobilnost i odmor', freq:'2× sedmično', duration:'20–30 min', color:'green',
        items:['Joga, istezanje, foam rolling','Poboljšava pokretljivost, smanjuje rizik od ozljede','8.000 koraka dnevno — osnova aktivnog načina života','Aktivan odmor: šetnja u prirodi, bicikl s porodicom'] }
    ],
    tip: 'Ključ održavanja: konzistentnost kroz dugi period. 80% discipline + 20% fleksibilnosti > 100% koja puca.'
  },
  recomp: {
    subtitle: 'Trening snage je OBAVEZAN — bez njega nema rekompozicije. Kardio je pomoćni alat.',
    weekSchedule: 'Preporučena sedmica: Snaga → Odmor/Šetnja → Snaga → Lagani kardio → Snaga → Odmor → Opciono',
    blocks: [
      { icon:'🏋️', title:'Trening snage — PRIORITET', freq:'3–4× sedmično', duration:'50–65 min', color:'purple',
        items:['Trening snage je primarni stimulus za rekompoziciju — ne preskači!','Upper/Lower split ili Push/Pull/Legs — 3-4 dana','Reps: 8–12, progresivno povećavaj težinu svake sedmice','Složene vježbe: čučanj, deadlift, bench press, red rowing'] },
      { icon:'🚴', title:'Kardio — umjeren', freq:'2× sedmično', duration:'25–35 min', color:'blue',
        items:['Lagani do umjereni intenzitet — ne HIIT, ne maratoni','Previše kardija sabotira mišićni rast kod rekompozicije','Bicikl, plivanje, brza šetnja — nisko opterećenje zglobova','Opciono: 1× HIIT 20 min umjesto jednog od kardio dana'] },
      { icon:'📏', title:'Mjerenje napretka', freq:'Sedmično', duration:'—', color:'green',
        items:['Vaga se možda neće micati — to je normalno kod rekompozicije','Mjeri obim: struk, bedra, nadlaktica — jednom sedmično','Fotke u isto doba, isti ugao — jednom u 2-3 sedmice','Snaga na treningu raste? Plan radi — ne panikuj zbog vage!'] }
    ],
    tip: 'Rekompozicija je sporija od čistog mršavljenja ili bulka, ali rezultati su trajni. Očekuj vidljive promjene za 8–12 sedmica, ne 3.'
  }
};

function renderExercise(goal) {
  const data = exerciseData[goal] || exerciseData.maintain;
  const c = { purple:{ bg:'#f5f3ff', border:'#c4b5fd', text:'#5b21b6' }, blue:{ bg:'#eff6ff', border:'#93c5fd', text:'#1d4ed8' }, green:{ bg:'#f0fdf4', border:'#86efac', text:'#15803d' } };
  $('exerciseContent').innerHTML = `
    <div class="ex-subtitle">${data.subtitle}</div>
    <div class="ex-schedule">${data.weekSchedule}</div>
    <div class="ex-grid">
      ${data.blocks.map(b => `
        <div class="ex-block" style="background:${c[b.color].bg};border-color:${c[b.color].border}">
          <div class="ex-block-head">
            <span class="ex-icon">${b.icon}</span>
            <div><div class="ex-title" style="color:${c[b.color].text}">${b.title}</div><div class="ex-meta"><strong>${b.freq}</strong>${b.duration!=='—'?` · ${b.duration}`:''}</div></div>
          </div>
          <ul class="ex-list">${b.items.map(i=>`<li>${i}</li>`).join('')}</ul>
        </div>`).join('')}
    </div>
    <div class="ex-tip">⚠️ ${data.tip}</div>`;
}

// ─── Terminology ──────────────────────────────────────────────────────────────
const terminology = [
  { term:'kcal',            full:'Kilokalorija',              def:'Mjerna jedinica za energiju u hrani. 1 kcal = 1000 cal. Popularna upotreba: "kalorija" = zapravo kilokalorija.' },
  { term:'BMR',             full:'Bazalni metabolički tempo', def:'Količina kalorija koju tijelo troši u potpunom mirovanju — samo za disanje, rad srca i organa. FoodManager koristi Mifflin-St Jeor formulu.' },
  { term:'TDEE',            full:'Ukupna dnevna potrošnja energije', def:'BMR × faktor aktivnosti (PAL). Koliko kalorija stvarno trošiš tokom dana uzimajući u obzir vježbanje i kretanje. Ovo je tvoja bazna linija.' },
  { term:'PAL',             full:'Faktor fizičke aktivnosti', def:'Koeficijent kojim se množi BMR da dobijemo TDEE. Sjedilački=1,2; Laka=1,375; Umjerena=1,55; Visoka=1,725; Jako visoka=1,9.' },
  { term:'Deficit',         full:'Kalorijski deficit',        def:'Jedeš MANJE kalorija nego što trošiš. Tijelo koristi uskladištenu mast kao gorivo. FoodManager za mršavljenje postavlja deficit od 400 kcal.' },
  { term:'Surplus',         full:'Kalorijski surplus',        def:'Jedeš VIŠE kalorija nego što trošiš. Tijelo ima materijal za izgradnju mišića. FoodManager za izgradnju mišića postavlja surplus od 300 kcal.' },
  { term:'Proteini',        full:'Makronutrijent',            def:'Gradivni materijal mišića. 1g = 4 kcal. Esencijalni za očuvanje i izgradnju mišića. Cilj: 1,5–2,2g po kg tjelesne težine dnevno.' },
  { term:'Ugljikohidrati',  full:'Makronutrijent',            def:'Primarno gorivo tijela i mozga. 1g = 4 kcal. Pune glikogenske rezerve u mišićima = energija za trening. Nisu loši — vrsta i količina su ono što je važno.' },
  { term:'Masti',           full:'Makronutrijent',            def:'Ključne za hormone, apsorpciju vitamina i zdravlje mozga. 1g = 9 kcal. Zdrave masti: maslinovo ulje, avokado, orasi, masna riba.' },
  { term:'Makroi',          full:'Makronutrijenti',           def:'Skupni naziv za proteini + ugljikohidrati + masti. Balans makroa određuje sastav tijela, ne samo ukupne kalorije.' },
  { term:'Rekompozicija',   full:'Rekompozicija tijela',      def:'Istovremeni gubitak masti i rast mišića. Moguće jedenjem na TDEE uz visok protein i redovan trening snage. Sporije ali trajno.' },
  { term:'NEAT',            full:'Termogeneza bez tjelovježbe',def:'Kalorije sagorjele svakodnevnim kretanjem koje nije trening — hodanje, stajanje, kućanski poslovi. Može iznositi 200–800 kcal/dan.' },
  { term:'Whey',            full:'Whey protein (surutka)',    def:'Proteinski prah dobijen iz surutke. Brzo se apsorbuje — idealan za unos odmah nakon treninga. Dopuna kad je teško dostići proteinski cilj iz hrane.' },
  { term:'Anabolički prozor',full:'Post-workout window',      def:'Period od 30–60 minuta nakon treninga u kojem tijelo efikasno koristi proteine za oporavak. Protein shake ili obrok s proteinima u ovom periodu.' },
];

function renderTerminology() {
  const g = $('termsGrid');
  if (!g) return;
  g.innerHTML = terminology.map(t => `
    <div class="term-card">
      <div class="term-abbr">${t.term}</div>
      <div class="term-full">${t.full}</div>
      <div class="term-def">${t.def}</div>
    </div>`).join('');
}

// ─── Render Results ───────────────────────────────────────────────────────────
const mealLabels = {
  dorucak:    { icon:'🌅', label:'Doručak' },
  uzina:      { icon:'☀️',  label:'Užina' },
  rucak:      { icon:'🍽️', label:'Ručak' },
  predtrening:{ icon:'⚡',  label:'Pred-trening' },
  vecera:     { icon:'🌙',  label:'Večera' }
};
const shoppingIcons  = { proteini:'🥩', ugljikohidrati:'🍞', masti:'🥑', voce:'🍎', povrce:'🥦', ostalo:'🧂' };
const shoppingLabels = { proteini:'Proteini', ugljikohidrati:'Ugljikohidrati', masti:'Masti i sjemenke', voce:'Voće', povrce:'Povrće', ostalo:'Ostalo' };

function renderResults(result) {
  lastResult = result;
  const { nutrition, week, shoppingList, keyRules, mealPrepTip, personalAnalysis, aiGenerated } = result;

  renderExercise(lastForm?.goal || 'maintain');
  syncTrackerWithPlan(nutrition?.target);

  // New features
  const weight = lastForm?.weight || 70;
  const height = lastForm?.height || 175;
  const trainingHours = parseFloat($('trainingHours')?.value || 0);
  const waist  = parseFloat($('waist')?.value || 0);
  const neck   = parseFloat($('neck')?.value || 0);
  const hip    = parseFloat($('hip')?.value || 0);
  const gender = lastForm?.gender || 'male';
  renderWaterSection(weight, trainingHours);
  if (height && weight) renderBMISection(weight, height, waist||null, neck||null, hip||null, gender);
  renderRDA(week);
  savePlanToHistory(result, lastForm || {});
  $('aiBadge').classList.toggle('hidden', !aiGenerated);
  $('recompBadge').classList.toggle('hidden', lastForm?.goal !== 'recomp');

  // Personalizirana analiza
  const paBox  = $('personalAnalysisBox');
  const paText = $('personalAnalysisText');
  if (paBox && paText && personalAnalysis) {
    paText.textContent = personalAnalysis;
    paBox.classList.remove('hidden');
  } else if (paBox) {
    paBox.classList.add('hidden');
  }

  // Restriction summary u rezultatima
  const detected = getDetectedRestrictions();
  let rSummary = $('resultRestrictionSummary');
  if (!rSummary) {
    rSummary = document.createElement('div');
    rSummary.id = 'resultRestrictionSummary';
    // Insert after aiBadge
    const aiBadge = $('aiBadge');
    aiBadge?.parentNode?.insertBefore(rSummary, aiBadge.nextSibling);
  }
  if (detected.length && (lastForm?.restrictions || lastForm?.healthNotes)) {
    rSummary.className = 'result-restriction-summary';
    rSummary.innerHTML = `
      <div class="rrs-header">
        <span class="rrs-check">✅</span>
        <strong>Plan prilagođen tvojim ograničenjima</strong>
      </div>
      <div class="rrs-list">
        ${detected.map(r => `
          <div class="rrs-item">
            <span class="rrs-label">${r.label}</span>
            <span class="rrs-action">${r.action}</span>
            ${r.warning ? `<span class="rrs-warn">⚠️ ${r.warning}</span>` : ''}
          </div>
        `).join('')}
      </div>
      ${!aiGenerated ? `<div class="rrs-ai-hint">🤖 Uključi <strong>AI personalizaciju</strong> za još preciznije prilagođavanje svakog obroka.</div>` : ''}
    `;
  } else {
    rSummary.innerHTML = '';
  }

  // Kalorije
  $('bmrVal').textContent    = nutrition.bmr.toLocaleString('bs');
  $('tdeeVal').textContent   = nutrition.tdee.toLocaleString('bs');
  $('targetVal').textContent = nutrition.target.toLocaleString('bs');
  const defLabel = nutrition.deficit < 0 ? `kcal (deficit ${Math.abs(nutrition.deficit)} kcal)` : nutrition.deficit > 0 ? `kcal (surplus +${nutrition.deficit} kcal)` : 'kcal (održavanje)';
  $('deficitLabel').textContent = defLabel;

  // Makrosi
  $('proteinVal').textContent = nutrition.macro.protein;
  $('carbsVal').textContent   = nutrition.macro.carbs;
  $('fatsVal').textContent    = nutrition.macro.fats;
  const pK = nutrition.macro.protein*4, cK = nutrition.macro.carbs*4, fK = nutrition.macro.fats*9, tot = pK+cK+fK;
  setTimeout(() => {
    $('proteinBar').style.width = `${(pK/tot*100).toFixed(1)}%`;
    $('carbsBar').style.width   = `${(cK/tot*100).toFixed(1)}%`;
    $('fatsBar').style.width    = `${(fK/tot*100).toFixed(1)}%`;
  }, 200);

  // Pravila
  $('rulesList').innerHTML = (keyRules||[]).map(r=>`<li><span class="rule-check">✓</span>${r}</li>`).join('');
  const mpt = $('mealPrepTip');
  if (mealPrepTip) { mpt.innerHTML = `<strong>💡 Meal prep savjet:</strong> ${mealPrepTip}`; mpt.classList.remove('hidden'); }
  else mpt.classList.add('hidden');

  // Sedmični plan s Zamijeni gumbima
  const grid = $('weekGrid');
  grid.innerHTML = '';
  week.forEach(dayObj => {
    const card = document.createElement('div');
    card.className = 'day-card';

    // Day nutrition — use server data if available (tačno), else parse text (procjena)
    let dayKcal=0, dayP=0, dayC=0, dayF=0, dayHasNutr=false, dayIsExact=true;
    Object.values(dayObj.meals).forEach(meal => {
      const mealStr = typeof meal === 'object' ? meal.t : meal;
      const serverData = typeof meal === 'object' ? meal : null;
      const n = serverData || calcMealNutrition(mealStr);
      if (n) {
        dayKcal += serverData ? (n.k||n.kcal||0) : (n.kcal||0);
        dayP    += n.p||0; dayC += n.c||0; dayF += n.f||0;
        dayHasNutr = true;
        if (!serverData) dayIsExact = false;
      }
    });

    const mealsHTML = Object.entries(mealLabels).map(([key, meta]) => {
      const mealData = dayObj.meals[key];
      const mealText = typeof mealData === 'object' ? mealData.t : (mealData || '—');
      const serverNutr = typeof mealData === 'object' ? mealData : null;
      const safeText = mealText.replace(/'/g,"\\'");
      const nutrBadge = mealNutrBadge(mealText, serverNutr);
      return `
      <div class="meal-row" data-day="${dayObj.dayNum}" data-meal="${key}">
        <div class="meal-type-col">
          <span class="meal-icon">${meta.icon}</span>
          <span class="meal-type">${meta.label}</span>
        </div>
        <div class="meal-name-wrap">
          <div class="meal-name-inner">
            <span class="meal-name">${mealText}</span>
            ${nutrBadge}
          </div>
          <button class="btn-swap" onclick="openSubModal('${safeText}', ${dayObj.dayNum}, '${key}', '${safeText}')">↺ Zamijeni</button>
        </div>
      </div>`;
    }).join('');

    const dayTotalHTML = dayHasNutr ? `
      <div class="day-total">
        <span class="day-total-label">${dayIsExact ? 'Ukupno dana:' : 'Procjena dana:'}</span>
        <span class="dt-kcal"><strong>${dayKcal}</strong> kcal</span>
        <span class="dt-sep">·</span><span>P: <strong>${dayP}g</strong></span>
        <span class="dt-sep">·</span><span>UH: <strong>${dayC}g</strong></span>
        <span class="dt-sep">·</span><span>M: <strong>${dayF}g</strong></span>
        ${!dayIsExact ? '<span class="dt-note" title="Neke namirnice nisu u bazi podataka">⚠️ procjena</span>' : ''}
      </div>` : '';

    card.innerHTML = `
      <div class="day-head"><div class="day-num-wrap"><span class="day-num">Dan ${dayObj.dayNum}</span><span class="day-name">${dayObj.day}</span></div></div>
      <div class="day-body">${mealsHTML}${dayObj.tip?`<div class="day-tip">💡 ${dayObj.tip}</div>`:''}${dayTotalHTML}</div>`;
    grid.appendChild(card);
  });

  // Shopping
  const shopGrid = $('shoppingGrid');
  shopGrid.innerHTML = '';
  if (shoppingList) {
    Object.entries(shoppingList).forEach(([cat, items]) => {
      if (!items?.length) return;
      const col = document.createElement('div');
      col.className = 'shop-col';
      col.innerHTML = `<div class="shop-header"><span>${shoppingIcons[cat]||'📦'}</span><span>${shoppingLabels[cat]||cat}</span></div><ul class="shop-list">${items.map(i=>`<li>${i}</li>`).join('')}</ul>`;
      shopGrid.appendChild(col);
    });
  }

  $('results').classList.remove('hidden');
  setTimeout(() => $('results').scrollIntoView({ behavior:'smooth', block:'start' }), 100);
}

// ─── Generate / Regenerate ────────────────────────────────────────────────────
async function generate() {
  const err = validateForm();
  if (err) { showError(err); return; }
  $('formError').classList.add('hidden');
  saveForm();
  calcGoalDuration();

  const useAI = $('useAI').checked;
  setLoading(true, useAI ? '🤖 Grok AI generira plan... (može trajati do 30s na Render free tieru)' : 'Računam nutritivne vrijednosti i generiram sedmični plan...');

  lastForm = {
    age:parseInt($('age').value), height:parseInt($('height').value),
    weight:parseFloat($('weight').value), gender:$('gender').value,
    activity:$('activity').value, goal:$('goal').value, diet:$('diet').value,
    restrictions:$('restrictions').value, healthNotes:$('healthNotes').value, useAI
  };

  // Pass detected restrictions to server for smarter fallback
  const detectedRestrictions = getDetectedRestrictions().map(r => r.id);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000); // 55s timeout for Render cold start

    const res  = await fetch('/plan', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(lastForm),
      signal: controller.signal
    });
    clearTimeout(timeout);

    const rawText = await res.text();
    let data;
    try { data = JSON.parse(rawText); }
    catch(jsonErr) {
      console.error('Server vratio non-JSON:', rawText.substring(0, 300));
      showError(`Server greška (non-JSON odgovor). Status: ${res.status}. Provjeri server logs.`);
      return;
    }
    if (!res.ok) { showError(data.error || `Server greška ${res.status}`); return; }
    renderResults(data);
  } catch(e) {
    console.error('Fetch greška:', e);
    if (e.name === 'AbortError') {
      showError('Server predugo ne odgovara (>55s). Na Render free planu server se budi 30–60s — pokušaj ponovo.');
    } else {
      try {
        const hc = await fetch('/health');
        const hcData = await hc.json();
        if (hc.ok) {
          showError(`Server radi (Node ${hcData.node}) ali /plan nije uspio. Greška: ${e.message}. Provjeri server logs.`);
        } else {
          showError('Server ne odgovara ispravno. Restartaj server ili provjeri Render logs.');
        }
      } catch {
        showError('Ne mogu dosegnuti server. Pokreni lokalno: cd food_app_v2 && npm install && npm start');
      }
    }
  } finally { setLoading(false); }
}

async function regenerate() {
  if (!lastForm) return;
  setLoading(true, 'Generira se novi sedmični plan...');
  try {
    const res  = await fetch('/plan', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(lastForm) });
    const data = await res.json();
    if (res.ok) renderResults(data);
    else showError(data.error);  } catch(e) { showError('Greška mreže.'); }
  finally { setLoading(false); }
}

// ─── Export Excel ─────────────────────────────────────────────────────────────
function downloadExcel() {
  if (!lastResult) return;
  const { nutrition, week, shoppingList } = lastResult;
  const wb = XLSX.utils.book_new();
  const sum = [['FOODMANAGER — PLAN ISHRANE'],[],['NUTRITIVNI CILJEVI'],['BMR',nutrition.bmr,'kcal'],['TDEE',nutrition.tdee,'kcal'],['Dnevni cilj',nutrition.target,'kcal'],[],['MAKRONUTRIJENTI'],['Proteini',nutrition.macro.protein,'g'],['Ugljikohidrati',nutrition.macro.carbs,'g'],['Masti',nutrition.macro.fats,'g']];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sum), 'Sažetak');
  const planData = [['Dan','Naziv','Doručak','Užina','Ručak','Pred-trening','Večera','Savjet']];
  const gmt = m => typeof m === 'object' && m ? m.t : (m || '—');
  week.forEach(d => planData.push([`Dan ${d.dayNum}`,d.day,gmt(d.meals.dorucak),gmt(d.meals.uzina),gmt(d.meals.rucak),gmt(d.meals.predtrening),gmt(d.meals.vecera),d.tip||'']));
  const ps = XLSX.utils.aoa_to_sheet(planData);
  ps['!cols'] = [6,12,35,30,35,30,35,30].map(w=>({wch:w}));
  XLSX.utils.book_append_sheet(wb, ps, 'Jelovnik');
  if (shoppingList) {
    const rows = [['Kategorija','Namirnica']];
    Object.entries(shoppingList).forEach(([cat,items])=>items.forEach((item,i)=>rows.push([i===0?(shoppingLabels[cat]||cat):'',`• ${item}`])));
    const ss = XLSX.utils.aoa_to_sheet(rows); ss['!cols']=[{wch:20},{wch:45}];
    XLSX.utils.book_append_sheet(wb, ss, 'Lista za kupovinu');
  }
  XLSX.writeFile(wb, 'FoodManager_Plan.xlsx');
}

// ─── Export Text ──────────────────────────────────────────────────────────────
function downloadText() {
  if (!lastResult) return;
  const { nutrition, week, shoppingList, keyRules, mealPrepTip } = lastResult;
  let t = '════════════════════════════════════════════\n       FOODMANAGER — PLAN ISHRANE\n════════════════════════════════════════════\n\n';
  t += `BMR: ${nutrition.bmr} kcal  |  TDEE: ${nutrition.tdee} kcal  |  Cilj: ${nutrition.target} kcal\nProteini: ${nutrition.macro.protein}g  |  Ugljikohidrati: ${nutrition.macro.carbs}g  |  Masti: ${nutrition.macro.fats}g\n\n`;
  if (keyRules?.length) { t += 'PRAVILA:\n'; keyRules.forEach((r,i)=>{ t+=`${i+1}. ${r}\n`; }); t+='\n'; }
  t += 'JELOVNIK:\n';
  week.forEach(d => {
    t += `\nDan ${d.dayNum} — ${d.day.toUpperCase()}\n`;
    const gmt2 = m => typeof m === 'object' && m ? m.t : (m || '—');
    t += `  Dorucak:      ${gmt2(d.meals.dorucak)}\n`;
    t += `  Uzina:        ${gmt2(d.meals.uzina)}\n`;
    t += `  Rucak:        ${gmt2(d.meals.rucak)}\n`;
    t += `  Pred-trening: ${gmt2(d.meals.predtrening)}\n`;
    t += `  Vecera:       ${gmt2(d.meals.vecera)}\n`;
    if (d.tip) t += `  Savjet: ${d.tip}\n`;
  });
  if (shoppingList) {
    t += '\n\nLISTA ZA KUPOVINU:\n';
    Object.entries(shoppingList).forEach(([cat,items])=>{ t+=`\n${(shoppingLabels[cat]||cat).toUpperCase()}\n`; items.forEach(i=>{t+=`  - ${i}\n`;}); });
  }
  if (mealPrepTip) t += `\n\nMEAL PREP: ${mealPrepTip}\n`;
  t += '\n════════════════════════════════════════════\nFoodManager · Autor: Alan Catovic\n';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([t],{type:'text/plain;charset=utf-8'}));
  a.download = 'FoodManager_Plan.txt'; a.click(); URL.revokeObjectURL(a.href);
}

// ─── Export HTML (mobile-friendly "PDF") ─────────────────────────────────────
function generateHTMLContent() {
  if (!lastResult) return '';
  const { nutrition, week, shoppingList, keyRules, mealPrepTip, personalAnalysis } = lastResult;
  const goal = lastForm?.goal || 'maintain';
  const goalLabel = { loss:'Mršavljenje', maintain:'Održavanje', gain:'Izgradnja mišića', recomp:'Rekompozicija' }[goal] || goal;
  const dietLabel = { none:'Omnivor', vegetarian:'Vegetarijanac', vegan:'Vegan', lactose_free:'Bez laktoze', gluten_free:'Bez glutena', keto:'Keto', mediterranean:'Mediteranski' }[lastForm?.diet] || '';
  const mealLbl = { dorucak:'Doručak', uzina:'Užina', rucak:'Ručak', predtrening:'Pred-trening', vecera:'Večera' };

  const getMealText = (meal) => typeof meal === 'object' && meal !== null ? meal.t : (meal || '—');

  const weekHTML = week.map(d => `
    <div class="day">
      <div class="day-head">Dan ${d.dayNum} — ${d.day}</div>
      <table>
        ${Object.entries(mealLbl).map(([k,l]) => `
          <tr><td class="meal-lbl">${l}</td><td>${getMealText(d.meals[k])}</td></tr>
        `).join('')}
        ${d.tip ? `<tr class="tip-row"><td colspan="2">💡 ${d.tip}</td></tr>` : ''}
      </table>
    </div>`).join('');

  const shopHTML = shoppingList ? Object.entries(shoppingList).map(([cat, items]) => {
    const lbl = { proteini:'Proteini', ugljikohidrati:'Ugljikohidrati', masti:'Masti i sjemenke', voce:'Voće', povrce:'Povrće', ostalo:'Ostalo' }[cat] || cat;
    return `<div class="shop-cat"><strong>${lbl}</strong><ul>${items.map(i=>`<li>${i}</li>`).join('')}</ul></div>`;
  }).join('') : '';

  const html = `<!DOCTYPE html>
<html lang="bs">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>FoodManager — Plan ishrane</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #111; background: white; padding: 16px; max-width: 800px; margin: auto; }
  .header { background: #0f1117; color: white; padding: 18px 20px; border-radius: 10px; margin-bottom: 20px; }
  .header h1 { font-size: 22px; margin-bottom: 4px; }
  .header p  { color: #9ca3af; font-size: 12px; }
  .section { margin-bottom: 20px; }
  .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 10px; }
  .kcal-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
  .kcal-box { flex: 1; min-width: 100px; background: #f7f8fa; border: 1px solid #e3e6ed; border-radius: 8px; padding: 10px; text-align: center; }
  .kcal-box.target { background: #f0fdf4; border-color: #86efac; }
  .kcal-box .lbl { font-size: 9px; text-transform: uppercase; color: #9ca3af; font-weight: 700; }
  .kcal-box .val { font-size: 22px; font-weight: 700; color: #111; }
  .kcal-box.target .val { color: #16a34a; }
  .kcal-box .sub { font-size: 10px; color: #9ca3af; }
  .macro-row { display: flex; gap: 8px; margin-bottom: 6px; }
  .macro-box { flex: 1; padding: 8px 10px; border-radius: 6px; font-size: 12px; }
  .macro-box.p { background: #f5f3ff; } .macro-box.c { background: #fffbeb; } .macro-box.f { background: #f0fdf4; }
  .macro-box strong { font-size: 16px; }
  .rules { list-style: none; display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
  .rules li::before { content: "✓  "; color: #16a34a; font-weight: 700; }
  .prep-tip { background: #fffbeb; border-left: 3px solid #d97706; padding: 8px 12px; font-size: 12px; border-radius: 0 6px 6px 0; margin-top: 8px; }
  .pa-box { background: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 12px; margin-bottom: 12px; font-size: 12px; line-height: 1.5; }
  .pa-box strong { color: #1d4ed8; display: block; margin-bottom: 4px; }
  .day { margin-bottom: 14px; border: 1px solid #e3e6ed; border-radius: 8px; overflow: hidden; }
  .day-head { background: #1e2230; color: white; padding: 8px 14px; font-weight: 700; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 7px 12px; border-bottom: 1px solid #f0f2f6; font-size: 12px; vertical-align: top; }
  .meal-lbl { font-weight: 700; color: #6b7280; width: 110px; white-space: nowrap; font-size: 11px; }
  .tip-row td { background: #eff6ff; color: #1d4ed8; font-size: 11px; font-style: italic; }
  .shop-grid { display: flex; flex-wrap: wrap; gap: 12px; }
  .shop-cat { flex: 1; min-width: 200px; }
  .shop-cat strong { display: block; font-size: 11px; text-transform: uppercase; color: #6b7280; margin-bottom: 4px; }
  .shop-cat ul { list-style: none; }
  .shop-cat ul li { font-size: 11px; padding: 2px 0; border-bottom: 1px solid #f0f2f6; }
  .shop-cat ul li::before { content: "· "; color: #9ca3af; }
  .footer { text-align: center; color: #9ca3af; font-size: 10px; margin-top: 20px; padding-top: 10px; border-top: 1px solid #e3e6ed; }
  .save-hint { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; font-size: 12px; color: #166534; display: flex; align-items: center; gap: 10px; }
  @media print { .save-hint { display: none; } body { padding: 0; } }
</style>
</head>
<body>
<div class="save-hint">
  📱 <span><strong>Kako sačuvati kao PDF:</strong> Na mobitelu — "Dijeli" → "Sačuvaj kao PDF" ili "Štampaj" → "Spremi kao PDF". Na računaru — Ctrl+P → Spremi kao PDF.</span>
</div>

<div class="header">
  <h1>🥗 FoodManager — Plan ishrane</h1>
  <p>Cilj: ${goalLabel} · Ishrana: ${dietLabel} · Generiran: ${new Date().toLocaleDateString('bs')} · Autor: Alan Catovic</p>
</div>

<div class="section">
  <div class="section-title">Nutritivni ciljevi</div>
  <div class="kcal-row">
    <div class="kcal-box"><div class="lbl">BMR</div><div class="val">${nutrition.bmr.toLocaleString('bs')}</div><div class="sub">kcal bazalno</div></div>
    <div class="kcal-box"><div class="lbl">TDEE</div><div class="val">${nutrition.tdee.toLocaleString('bs')}</div><div class="sub">kcal s aktivnošću</div></div>
    <div class="kcal-box target"><div class="lbl">Dnevni cilj</div><div class="val">${nutrition.target.toLocaleString('bs')}</div><div class="sub">kcal</div></div>
  </div>
  <div class="macro-row">
    <div class="macro-box p"><div class="lbl">Proteini</div><strong>${nutrition.macro.protein}g</strong></div>
    <div class="macro-box c"><div class="lbl">Ugljikohidrati</div><strong>${nutrition.macro.carbs}g</strong></div>
    <div class="macro-box f"><div class="lbl">Masti</div><strong>${nutrition.macro.fats}g</strong></div>
  </div>
</div>

${personalAnalysis ? `
<div class="section">
  <div class="pa-box"><strong>💬 Napomena o posebnim zahtjevima</strong>${personalAnalysis}</div>
</div>` : ''}

${keyRules?.length ? `
<div class="section">
  <div class="section-title">Pravila koja moraju vrijediti</div>
  <ul class="rules">${keyRules.map(r=>`<li>${r}</li>`).join('')}</ul>
  ${mealPrepTip ? `<div class="prep-tip">💡 <strong>Meal prep:</strong> ${mealPrepTip}</div>` : ''}
</div>` : ''}

<div class="section">
  <div class="section-title">Sedmični jelovnik</div>
  ${weekHTML}
</div>

${shopHTML ? `
<div class="section">
  <div class="section-title">Lista za kupovinu (sedmično)</div>
  <div class="shop-grid">${shopHTML}</div>
</div>` : ''}

<div class="footer">FoodManager · Alan Catovic · Mifflin-St Jeor formula</div>
</body></html>`;
  return html;
}

function downloadPDF() {
  const html = generateHTMLContent();
  if (!html) return;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'FoodManager_Plan.html';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─── localStorage form ────────────────────────────────────────────────────────

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTracker();
  loadForm();
  detectRestrictions();
  calcBMILive();
  renderCheatSheet();
  renderTerminology();
  renderHistoryBadge();

  // Hip field: prikaži samo za žene
  const genderSel = $('gender');
  const toggleHip = () => { const hf=$('hipField'); if(hf) hf.style.display = genderSel?.value==='female'?'':'none'; };
  if (genderSel) { toggleHip(); genderSel.addEventListener('change', () => { toggleHip(); calcBMILive(); }); }

  ['age','height','weight'].forEach(id => $(id).addEventListener('keydown', e => { if (e.key==='Enter') generate(); }));
  ['weight','targetWeight','goal'].forEach(id => { const el=$(id); if(el) el.addEventListener('change', calcGoalDuration); });
  document.addEventListener('keydown', e => { if (e.key==='Escape') { closeSubModal(); closeQRModal(); } });
});
