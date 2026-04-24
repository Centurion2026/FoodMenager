require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const https   = require('https');
const app     = express();
const PORT    = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ─── fetch polyfill ───────────────────────────────────────────────────────────
const doFetch = typeof fetch !== 'undefined' ? fetch : (url, opts={}) =>
  new Promise((res, rej) => {
    const u = new URL(url), body = opts.body||null;
    const req = https.request({
      hostname:u.hostname, path:u.pathname+u.search,
      method:opts.method||'GET', headers:opts.headers||{}
    }, r => {
      let d=''; r.on('data',c=>d+=c);
      r.on('end',()=>res({ ok:r.statusCode>=200&&r.statusCode<300, status:r.statusCode,
        json:()=>Promise.resolve(JSON.parse(d)), text:()=>Promise.resolve(d) }));
    });
    req.on('error',rej); if(body)req.write(body); req.end();
  });

// ─── BMR + TDEE ───────────────────────────────────────────────────────────────
function calcNutrition({ weight, height, age, gender, activity, goal, diet }) {
  const bmr = gender==='male' ? 10*weight+6.25*height-5*age+5 : 10*weight+6.25*height-5*age-161;
  const pal = { sedentary:1.2, light:1.375, moderate:1.55, active:1.725, very_active:1.9 };
  const adj = { loss:-400, maintain:0, gain:300, recomp:0 };
  const tdee = Math.round(bmr*(pal[activity]||1.375));
  const target = tdee+(adj[goal]||0);
  const splits = { loss:{p:0.35,c:0.35,f:0.30}, maintain:{p:0.30,c:0.40,f:0.30}, gain:{p:0.30,c:0.45,f:0.25}, recomp:{p:0.40,c:0.35,f:0.25} };
  // Keto override: bez obzira na goal, keto ishrana zahtijeva <5% UH, 65% masti
  const s = diet === 'keto' ? {p:0.30,c:0.05,f:0.65} : (splits[goal]||splits.maintain);
  return { bmr:Math.round(bmr), tdee, target, deficit:adj[goal]||0,
    macro:{ protein:Math.round(target*s.p/4), carbs:Math.round(target*s.c/4), fats:Math.round(target*s.f/9) } };
}

// ─── Validacija ───────────────────────────────────────────────────────────────
const VALID_DIETS = ['none','vegetarian','vegan','lactose_free','gluten_free','keto','mediterranean'];
const VALID_GOALS = ['loss','maintain','gain','recomp'];
function validateInput(d) {
  const e=[];
  if(!d.weight||d.weight<30||d.weight>300) e.push('Težina mora biti između 30 i 300 kg');
  if(!d.height||d.height<100||d.height>250) e.push('Visina mora biti između 100 i 250 cm');
  if(!d.age||d.age<10||d.age>120) e.push('Dob mora biti između 10 i 120');
  if(!['male','female'].includes(d.gender)) e.push('Nevažeći spol');
  if(!['sedentary','light','moderate','active','very_active'].includes(d.activity)) e.push('Nevažeća aktivnost');
  if(!VALID_GOALS.includes(d.goal)) e.push('Nevažeći cilj');
  if(!VALID_DIETS.includes(d.diet)) e.push('Nevažeći tip ishrane');
  return e;
}

// ─── Strukturirana baza obroka s unaprijed izračunatim nutritivnim vrijednostima
// Format: { t: "tekst obroka", k: kcal, p: proteini_g, c: ugljikohidrati_g, f: masti_g }
// Vrijednosti su pri BASELINE 2400 kcal/dan — skaliraju se prema cilju korisnika
const mealDB = {
  none: {
    dorucak: [
      { t:'4 jaja + 2 bjelanceta + 2 kriške integralnog hljeba + 50g sira + paradajz',          k:593, p:50, c:32, f:29 },
      { t:'80g zobenih pahuljica + 300ml mlijeka 1,5% + 30g whey proteina + jabuka',             k:643, p:44, c:91, f:12 },
      { t:'Omlet: 3 jaja + špinat + 40g fete + 2 kriške integralnog hljeba',                    k:529, p:37, c:30, f:29 },
      { t:'Shake: 300ml mlijeka + 40g whey + banana + 40g zobi + kašika kikiriki maslaca',      k:642, p:51, c:75, f:17 },
      { t:'250g domaćeg sira + 2 kriške hljeba + banana + 20g badema',                          k:634, p:41, c:64, f:25 },
      { t:'3 jaja + 100g pilećih prsa + kajgana + 2 kriške hljeba + paradajz',                  k:588, p:61, c:30, f:24 },
      { t:'Palačinke od zobi: 60g zobi + 2 jaja + 30g whey + 200g jogurta + borovnice',        k:682, p:55, c:63, f:21 },
    ],
    uzina: [
      { t:'250g grčkog jogurta 2% + 20g oraha + jabuka',                                        k:357, p:29, c:34, f:14 },
      { t:'3 kuhana jaja + kriška integralnog hljeba + kašika humusa',                           k:356, p:27, c:16, f:20 },
      { t:'200g skyra + 30g whey proteina + kašika meda',                                       k:303, p:45, c:27, f:2  },
      { t:'150g pilećih prsa (dimljenih) + kriška hljeba + paradajz',                           k:347, p:46, c:18, f:10 },
      { t:'Banana + 2 kuhana jaja',                                                             k:279, p:17, c:28, f:12 },
      { t:'200g grčkog jogurta + bobice + kašika meda',                                         k:222, p:21, c:35, f:1  },
      { t:'Jabuka + 20g kikiriki maslaca',                                                      k:196, p:6,  c:25, f:10 },
    ],
    rucak: [
      { t:'250g pilećih prsa + 80g (suhe) bulgura + šopska salata + kašika maslinovog ulja',    k:823, p:88, c:63, f:24 },
      { t:'250g lososa (pećnica) + 300g slatkog krompira + salata s feta sirom + ulje',         k:999, p:61, c:64, f:53 },
      { t:'200g govedine 10% m.m. + 80g (suhe) riže + velika salata + kašika maslinovog ulja', k:862, p:59, c:66, f:39 },
      { t:'Wrap: tortilja + 220g pilećih prsa + salata + paradajz',                             k:541, p:67, c:33, f:16 },
      { t:'250g pilećih bataka (pećnica) + 200g krompira + 200g kelja',                        k:747, p:75, c:58, f:26 },
      { t:'200g tune + 80g (suhe) integralne tjestenine + pesto + tikvice',                    k:695, p:66, c:68, f:16 },
      { t:'250g pilećih prsa + 80g (suhe) riže + brokula + kašika maslinovog ulja',           k:884, p:87, c:75, f:26 },
    ],
    predtrening: [
      { t:'Kriška integralnog hljeba + 100g domaćeg sira',                                      k:179, p:15, c:15, f:6  },
      { t:'Banana + 2 kuhana jaja',                                                             k:279, p:17, c:28, f:12 },
      { t:'200g skyra + 15g oraha',                                                             k:224, p:24, c:10, f:10 },
      { t:'Jabuka + 20g kikiriki maslaca',                                                      k:196, p:6,  c:25, f:10 },
      { t:'200g grčkog jogurta + bobice + kašika meda',                                         k:222, p:21, c:35, f:1  },
      { t:'Jabuka + 30g oraha',                                                                 k:274, p:5,  c:25, f:20 },
      { t:'200g jogurta + voće po izboru',                                                      k:193, p:9,  c:28, f:3  },
    ],
    vecera: [
      { t:'220g ćufti od govedine + 300g krompira + 200g brokule',                             k:802, p:64, c:78, f:28 },
      { t:'200g tune + 80g (suhe) integralne tjestenine + pesto + tikvice',                    k:678, p:66, c:64, f:16 },
      { t:'200g puretine (pećnica) + 250g krompira + konzerva crvenog pasulja',                k:840, p:80, c:94, f:16 },
      { t:'220g ćevapa + lepinjica + kupus salata',                                             k:737, p:55, c:40, f:40 },
      { t:'220g oslića ili brancina + 80g (suhe) riže + 250g mahuna',                         k:554, p:50, c:82, f:5  },
      { t:'200g pilećih prsa + 300g slatkog krompira + pečeno povrće',                        k:628, p:69, c:69, f:8  },
      { t:'250g govedine + 200g krompira + miješano povrće',                                   k:752, p:71, c:49, f:28 },
    ],
  },

  vegetarian: {
    dorucak: [
      { t:'3 jaja + 2 bjelanceta + 60g zobi + 250ml mlijeka + banana + 20g oraha',             k:672, p:37, c:82, f:22 },
      { t:'200g grčkog jogurta + 50g zobi + chia + kašika kikiriki maslaca + jabuka',           k:587, p:28, c:77, f:18 },
      { t:'4 jaja + 2 kriške hljeba + avokado + paradajz + 50g mozarele',                      k:648, p:38, c:32, f:40 },
      { t:'Overnight oats: 60g zobi + 200g grčkog jogurta + chia + bobice',                    k:448, p:23, c:68, f:9  },
      { t:'Omlet: 3 jaja + 3 bjelanceta + špinat + 40g fete + 2 kriške hljeba',               k:543, p:42, c:31, f:28 },
      { t:'3 jaja + 30g svježeg sira + 2 kriške hljeba + paradajz',                            k:464, p:31, c:32, f:22 },
      { t:'Shake: 40g whey + 300ml mlijeka + 50g zobi + banana',                               k:626, p:49, c:82, f:10 },
    ],
    uzina: [
      { t:'200g skyra + bobice + 20g badema + kašika meda',                                    k:288, p:24, c:31, f:8  },
      { t:'Protein shake: 30g whey + 300ml mlijeka + banana + 20g oraha',                      k:511, p:36, c:52, f:17 },
      { t:'2 kuhana jaja + kriška hljeba + 50g humusa + paradajz',                             k:323, p:17, c:27, f:16 },
      { t:'200g skyra + jabuka + 2 kašike kikiriki maslaca',                                   k:361, p:23, c:35, f:12 },
      { t:'150g tempeha + salata s rukolom i avokadom',                                        k:430, p:31, c:15, f:28 },
      { t:'200g grčkog jogurta + bobice + 30g badema + kašika meda',                           k:354, p:22, c:30, f:14 },
      { t:'3 kuhana jaja + kriška hljeba + hummus + krastavac',                                k:356, p:27, c:16, f:20 },
    ],
    rucak: [
      { t:'200g kuhane leće + 80g (suhe) integralne riže + salata + feta',                     k:710, p:39, c:110,f:11 },
      { t:'200g tofua + 100g (suhe) kinoe + pečeno povrće + susam',                           k:629, p:35, c:81, f:22 },
      { t:'200g slanutka curry + 80g (suhe) integralne riže + salata',                        k:742, p:31, c:128,f:8  },
      { t:'150g domaćeg sira + 300g špinat i brokula na tiganju + 80g (suhe) kinoe',          k:598, p:38, c:73, f:18 },
      { t:'80g (suhe) integralne tjestenine + 200g crvenog pasulja + paradajz sos + 40g parmezana', k:734, p:41, c:108,f:14 },
      { t:'200g crvenog graha + 150g (suhog) bulgura + salata od kupusa',                     k:708, p:33, c:125,f:4  },
      { t:'Veggie pizza 2 kriške + salata + 200g cottage cheesea',                            k:680, p:38, c:72, f:24 },
    ],
    predtrening: [
      { t:'200g skyra + 15g oraha',                                                            k:224, p:24, c:10, f:10 },
      { t:'Banana + 2 kuhana jaja',                                                            k:279, p:17, c:28, f:12 },
      { t:'200g grčkog jogurta + voće',                                                        k:193, p:20, c:20, f:0  },
      { t:'150g cottage cheesea + jabuka',                                                     k:225, p:17, c:25, f:6  },
      { t:'Jabuka + 20g kikiriki maslaca',                                                     k:196, p:6,  c:25, f:10 },
      { t:'200g jogurta + bobice + kašika meda',                                               k:222, p:21, c:35, f:1  },
      { t:'30g badema + banana',                                                               k:281, p:7,  c:36, f:15 },
    ],
    vecera: [
      { t:'150g cottage cheesea + 2 kriške hljeba + avokado + paradajz',                       k:476, p:20, c:42, f:22 },
      { t:'Omlet: 4 jaja + 40g fete + špinat + paradajz + kriška hljeba',                     k:530, p:36, c:24, f:32 },
      { t:'150g tofua + 200g mahuna + 150g krompira + maslinovo ulje',                        k:456, p:21, c:47, f:18 },
      { t:'250g cottage cheesea + 30g parmezana + salata + maslinovo ulje',                   k:488, p:33, c:11, f:34 },
      { t:'Pečeni tofu 150g + 200g brokule + 100g slatkog krompira',                          k:348, p:20, c:34, f:12 },
      { t:'200g tempeha + 150g (suhe) heljde + 250g kuhane blitve',                           k:692, p:37, c:106,f:14 },
      { t:'200g tofua + 200g slanutka + 200g brokule + maslinovo ulje',                       k:552, p:28, c:72, f:30 },
    ],
  },

  vegan: {
    dorucak: [
      { t:'80g zobi + 300ml sojinog mlijeka + banana + kašika chia + cimet',                   k:537, p:18, c:91, f:11 },
      { t:'Overnight oats: 50g zobi + 200ml zobenog mlijeka + chia + borovnice',              k:394, p:11, c:67, f:9  },
      { t:'Avocado toast: 2 kriške hljeba + avokado + paradajz + limun',                      k:404, p:8,  c:45, f:22 },
      { t:'Tofu scramble 150g + špinat + paradajz + 2 kriške hljeba',                        k:403, p:21, c:42, f:13 },
      { t:'Granola 50g + kokosov jogurt 150g + borovnice + chia',                             k:482, p:8,  c:65, f:18 },
      { t:'Smoothie bowl: banana + 50g zobi + 300ml sojinog mlijeka + kikiriki maslac',       k:538, p:17, c:80, f:17 },
      { t:'Chia pudding: 40g chia + 300ml sojinog mlijeka + borovnice + med',                 k:471, p:15, c:60, f:18 },
    ],
    uzina: [
      { t:'150g edamame + kriška hljeba',                                                      k:256, p:19, c:31, f:7  },
      { t:'100g humusa + štapići šargarepe i krastavca',                                       k:225, p:9,  c:25, f:10 },
      { t:'Jabuka + 2 kašike kikiriki maslaca + chia',                                        k:282, p:8,  c:36, f:13 },
      { t:'200g sojinog jogurta + sjemenke bundeve + bobice',                                  k:260, p:12, c:28, f:10 },
      { t:'30g oraha + banana',                                                                k:303, p:5,  c:37, f:20 },
      { t:'Mix sjemenki 30g + voće',                                                           k:280, p:9,  c:31, f:15 },
      { t:'2 kašike kikiriki maslaca + kriška hljeba + banana',                               k:370, p:10, c:50, f:17 },
    ],
    rucak: [
      { t:'200g tofua stir-fry + 100g (suhe) riže + brokula + paprika + soja sos',            k:631, p:27, c:91, f:14 },
      { t:'Chickpea curry: 200g slanutka + 80g (suhe) riže + špinat',                        k:750, p:27, c:130,f:8  },
      { t:'150g (suhe) crvene leće čorba + integralni hljeb + salata',                       k:610, p:28, c:106,f:4  },
      { t:'Quinoa bowl: 100g (suhe) kinoe + 100g slanutka + avokado + paradajz',              k:684, p:26, c:92, f:22 },
      { t:'Vegan burrito: tortilja + crni grah + kinoa + avokado + salsa',                    k:648, p:22, c:90, f:20 },
      { t:'Falafel 150g + hummus + salata + raženi hljeb',                                    k:620, p:20, c:82, f:24 },
      { t:'Buddha bowl: tofu 150g + 80g (suhe) kinoe + edamame + pečeno povrće + tahini',    k:685, p:32, c:80, f:26 },
    ],
    predtrening: [
      { t:'Banana + 2 kašike kikiriki maslaca',                                               k:283, p:7,  c:38, f:13 },
      { t:'200g sojinog jogurta + bobice',                                                    k:160, p:9,  c:19, f:4  },
      { t:'30g oraha + jabuka',                                                               k:274, p:5,  c:25, f:20 },
      { t:'Kriška hljeba + avokado',                                                          k:247, p:4,  c:28, f:13 },
      { t:'Smoothie: banana + zobeno mlijeko + chia',                                         k:242, p:5,  c:45, f:5  },
      { t:'3 datule + 20g oraha',                                                             k:278, p:4,  c:46, f:13 },
      { t:'Jabuka + kikiriki maslac + sjemenke bundeve',                                      k:287, p:8,  c:31, f:15 },
    ],
    vecera: [
      { t:'150g tempeha + 80g (suhe) riže + pečeno povrće',                                   k:625, p:28, c:89, f:15 },
      { t:'Lentil bolognese: 150g crvene leće + 80g (suhe) integralne tjestenine + sos',     k:620, p:29, c:109,f:4  },
      { t:'Mushroom risotto: 80g (suhe) riže + 200g pečuraka + špinat',                      k:422, p:11, c:82, f:6  },
      { t:'Sweet potato tacos: 200g slatkog krompira + crni grah + avokado',                 k:482, p:14, c:80, f:15 },
      { t:'Thai peanut noodles: 80g riže rezanci + edamame + kikiriki umak',                 k:574, p:22, c:78, f:20 },
      { t:'200g tofua + 200g slanutka + 200g brokule + maslinovo ulje',                      k:552, p:28, c:72, f:30 },
      { t:'Chickpea stew: 200g slanutka + 150g krompira + kelj + paradajz',                  k:490, p:22, c:82, f:7  },
    ],
  },

  lactose_free: {
    dorucak: [
      { t:'4 jaja + 2 bjelanceta + 2 kriške hljeba + paradajz + maslinovo ulje',              k:554, p:42, c:31, f:28 },
      { t:'80g zobi + 300ml bezlaktoznog mlijeka + banana + 30g whey izolata',               k:643, p:44, c:91, f:12 },
      { t:'Tofu scramble 150g + špinat + paprika + 2 kriške hljeba',                         k:403, p:21, c:42, f:13 },
      { t:'200g bezlaktoznog skyra + 50g zobi + chia + borovnice',                           k:433, p:26, c:66, f:6  },
      { t:'Shake: 40g whey izolata + 300ml sojinog mlijeka + banana + 40g zobi',             k:561, p:47, c:69, f:9  },
      { t:'Palačinke: 60g zobi + 2 jaja + 30g whey izolata + bobice',                       k:498, p:38, c:57, f:12 },
      { t:'Overnight oats: 60g zobi + 200ml sojinog mlijeka + chia + jabuka',                k:446, p:14, c:77, f:10 },
    ],
    uzina: [
      { t:'200g bezlaktoznog grčkog jogurta + 20g oraha + jabuka',                           k:357, p:29, c:34, f:14 },
      { t:'3 kuhana jaja + kriška hljeba + 50g humusa + paradajz',                           k:356, p:27, c:16, f:20 },
      { t:'200g bezlaktoznog skyra + 30g whey izolata + kašika meda',                        k:303, p:45, c:27, f:2  },
      { t:'150g pilećih prsa + kriška hljeba + paradajz',                                    k:318, p:42, c:15, f:8  },
      { t:'Banana + 2 kuhana jaja',                                                          k:279, p:17, c:28, f:12 },
      { t:'Jabuka + 20g badema + kašika meda',                                               k:260, p:5,  c:39, f:11 },
      { t:'150g sardina + krastavac + paradajz',                                             k:288, p:33, c:6,  f:17 },
    ],
    rucak: [
      { t:'250g pilećih prsa + 80g (suhe) riže + brokula + maslinovo ulje',                  k:823, p:88, c:73, f:20 },
      { t:'250g lososa + 300g slatkog krompira + salata + maslinovo ulje',                   k:966, p:57, c:63, f:49 },
      { t:'200g govedine 10% m.m. + 80g (suhe) riže + salata + maslinovo ulje',             k:862, p:59, c:66, f:39 },
      { t:'200g tune + 80g (suhe) integralne tjestenine + tikvice + maslinovo ulje',         k:707, p:64, c:68, f:19 },
      { t:'250g pilećih bataka + 200g krompira + 200g šargarepe i mahuna',                   k:740, p:72, c:60, f:26 },
      { t:'200g lososa + 80g (suhe) kinoe + pečeno povrće',                                  k:810, p:48, c:64, f:32 },
      { t:'250g pilećih prsa + 80g (suhe) heljde + salata s avokadom',                       k:845, p:86, c:70, f:24 },
    ],
    predtrening: [
      { t:'Banana + 2 kuhana jaja',                                                          k:279, p:17, c:28, f:12 },
      { t:'Jabuka + 20g kikiriki maslaca',                                                   k:196, p:6,  c:25, f:10 },
      { t:'200g bezlaktoznog skyra + 15g oraha',                                             k:224, p:24, c:10, f:10 },
      { t:'30g oraha + banana',                                                              k:303, p:5,  c:37, f:20 },
      { t:'Kriška hljeba + sardine 50g',                                                     k:185, p:15, c:13, f:8  },
      { t:'3 datule + 20g badema',                                                           k:280, p:5,  c:46, f:13 },
      { t:'200g bezlaktoznog jogurta + voće',                                                k:193, p:9,  c:28, f:3  },
    ],
    vecera: [
      { t:'220g oslića ili brancina + 80g (suhe) riže + 250g mahuna',                        k:554, p:50, c:82, f:5  },
      { t:'200g puretine + 250g krompira + konzerva crvenog pasulja',                        k:820, p:77, c:93, f:14 },
      { t:'220g pilećih prsa + 300g slatkog krompira + pečeno povrće',                       k:628, p:69, c:69, f:8  },
      { t:'200g sardina + 150g slanutka + salata od kelja',                                  k:620, p:48, c:42, f:27 },
      { t:'220g ćufti od govedine + 200g (suhe) riže + brokula',                            k:896, p:72, c:102,f:22 },
      { t:'200g tempeha + 150g (suhe) riže + 200g šargarepe i tikvice',                     k:636, p:29, c:101,f:14 },
      { t:'250g govedine + 200g krompira + miješano povrće',                                 k:752, p:71, c:49, f:28 },
    ],
  },

  gluten_free: {
    dorucak: [
      { t:'4 jaja + 2 bjelanceta + 150g krompira + paradajz + maslinovo ulje',               k:526, p:38, c:33, f:26 },
      { t:'80g heljdinih pahuljica + 300ml mlijeka + banana + 30g whey',                    k:643, p:44, c:91, f:12 },
      { t:'Omlet: 3 jaja + špinat + 40g fete + 150g krompira',                              k:519, p:34, c:32, f:28 },
      { t:'Shake: 300ml mlijeka + 40g whey + banana + 50g proso pahuljica',                 k:629, p:50, c:77, f:13 },
      { t:'250g grčkog jogurta + 50g proso pahuljica + chia + borovnice',                   k:472, p:27, c:67, f:10 },
      { t:'3 jaja + 100g pilećih prsa + 150g riže + paradajz',                              k:611, p:58, c:50, f:18 },
      { t:'200g skyra + 50g kuhane heljde + jabuka + med',                                  k:362, p:23, c:60, f:2  },
    ],
    uzina: [
      { t:'250g grčkog jogurta + 20g oraha + jabuka',                                        k:357, p:29, c:34, f:14 },
      { t:'3 kuhana jaja + 100g domaćeg sira + paradajz',                                   k:397, p:35, c:4,  f:27 },
      { t:'200g skyra + 30g whey + kašika meda',                                            k:303, p:45, c:27, f:2  },
      { t:'150g pilećih prsa + paradajz + krastavac',                                       k:265, p:47, c:8,  f:5  },
      { t:'Banana + 2 kuhana jaja',                                                         k:279, p:17, c:28, f:12 },
      { t:'200g grčkog jogurta + bobice + kašika meda',                                     k:222, p:21, c:35, f:1  },
      { t:'Jabuka + 20g kikiriki maslaca',                                                  k:196, p:6,  c:25, f:10 },
    ],
    rucak: [
      { t:'250g pilećih prsa + 80g (suhe) riže + šopska salata + maslinovo ulje',           k:823, p:88, c:63, f:24 },
      { t:'250g lososa + 300g slatkog krompira + salata',                                   k:966, p:57, c:63, f:49 },
      { t:'200g govedine 10% m.m. + 80g (suhe) kinoe + salata + maslinovo ulje',           k:862, p:59, c:66, f:39 },
      { t:'250g pilećih prsa + 80g (suhe) heljde + brokula + maslinovo ulje',              k:845, p:86, c:70, f:24 },
      { t:'200g tune + 80g (suhe) riže + tikvice',                                         k:579, p:59, c:67, f:5  },
      { t:'250g pilećih bataka + 200g krompira + salata',                                   k:670, p:74, c:42, f:25 },
      { t:'200g oslića + 80g (suhe) riže + 250g mahuna + maslinovo ulje',                  k:578, p:48, c:72, f:13 },
    ],
    predtrening: [
      { t:'Banana + 2 kuhana jaja',                                                         k:279, p:17, c:28, f:12 },
      { t:'Jabuka + 20g kikiriki maslaca',                                                  k:196, p:6,  c:25, f:10 },
      { t:'200g skyra + 15g oraha',                                                         k:224, p:24, c:10, f:10 },
      { t:'200g grčkog jogurta + bobice',                                                   k:158, p:20, c:15, f:0  },
      { t:'Jabuka + 30g oraha',                                                             k:274, p:5,  c:25, f:20 },
      { t:'Banana + 200g jogurta',                                                          k:196, p:7,  c:35, f:2  },
      { t:'Šaka oraha + banana + kašika meda',                                              k:370, p:6,  c:56, f:20 },
    ],
    vecera: [
      { t:'220g oslića + 80g (suhe) riže + 250g mahuna + maslinovo ulje',                   k:578, p:48, c:82, f:13 },
      { t:'200g puretine + 250g (suhe) riže + konzerva crvenog pasulja',                   k:820, p:77, c:93, f:14 },
      { t:'220g ćufti od govedine (bez kruha) + 300g krompira + brokula',                  k:759, p:62, c:69, f:27 },
      { t:'220g pilećih prsa + 300g slatkog krompira + pečeno povrće',                     k:628, p:69, c:69, f:8  },
      { t:'250g lososa + 80g (suhe) riže + 200g šparoge',                                  k:812, p:55, c:67, f:31 },
      { t:'200g govedine + 150g (suhe) kinoe + miješano povrće',                           k:836, p:60, c:82, f:28 },
      { t:'200g tune + 80g (suhe) heljde + tikvice + maslinovo ulje',                      k:613, p:64, c:65, f:15 },
    ],
  },

  keto: {
    dorucak: [
      { t:'4 jaja + 3 kriške slanine + avokado + paradajz',                                  k:673, p:35, c:8,  f:55 },
      { t:'Keto shake: 250ml kokosovog mlijeka + 30g whey + 30g oraha',                     k:624, p:29, c:11, f:52 },
      { t:'Omlet: 3 jaja + 60g cheddar sira + špinat + 50g slanine',                       k:649, p:44, c:2,  f:51 },
      { t:'4 jaja + 100g dimljenog lososa + avokado',                                       k:626, p:42, c:4,  f:48 },
      { t:'200g svježeg sira + 30g badema + borovnice',                                     k:429, p:28, c:17, f:28 },
      { t:'3 jaja + 100g kobasice bez šećera + avokado + krastavac',                       k:624, p:32, c:5,  f:52 },
      { t:'3 jaja + 80g šampinjona + 50g cheddar sira + špinat',                           k:476, p:34, c:5,  f:35 },
    ],
    uzina: [
      { t:'100g svježeg sira + 30g oraha + krastavac',                                      k:342, p:17, c:7,  f:26 },
      { t:'2 kuhana jaja + 30g cheddar sira + paprika',                                     k:314, p:21, c:4,  f:23 },
      { t:'100g dimljenog lososa + svježi sir + krastavac',                                 k:256, p:22, c:2,  f:17 },
      { t:'50g badema + 30g sira + krastavac',                                              k:387, p:17, c:11, f:31 },
      { t:'100g pečene piletine + avokado',                                                 k:325, p:32, c:4,  f:20 },
      { t:'30g oraha + 30g sira + 3 kriške slanine',                                       k:490, p:22, c:5,  f:42 },
      { t:'200g punomasnog grčkog jogurta + 20g oraha',                                     k:320, p:19, c:10, f:22 },
    ],
    rucak: [
      { t:'250g pilećih prsa + 200g brokule u maslacu + 50g cheddar sira',                  k:616, p:78, c:8,  f:29 },
      { t:'250g lososa + 200g šparoge + 2 kašike maslinovog ulja',                          k:685, p:52, c:6,  f:50 },
      { t:'300g govedine 20% m.m. burger bez kruha + salata + avokado',                     k:738, p:57, c:9,  f:54 },
      { t:'250g pilećih bataka + 200g kelja s maslacem i češnjakom',                        k:648, p:64, c:12, f:38 },
      { t:'250g oslića + 200g karfiola + maslinovo ulje',                                   k:504, p:53, c:14, f:26 },
      { t:'200g govedine + 300g miješane salate + avokado + maslinovo ulje',                k:644, p:49, c:12, f:47 },
      { t:'250g tune + 200g tikvica + 2 jaja + maslinovo ulje',                             k:594, p:67, c:8,  f:31 },
    ],
    predtrening: [
      { t:'2 kuhana jaja + 30g badema',                                                     k:316, p:17, c:6,  f:25 },
      { t:'100g piletine + krastavac + maslinovo ulje',                                     k:237, p:31, c:3,  f:12 },
      { t:'50g oraha + 30g sira',                                                           k:457, p:14, c:8,  f:39 },
      { t:'200g punomasnog grčkog jogurta + 20g oraha',                                     k:320, p:19, c:10, f:22 },
      { t:'2 kuhana jaja + 50g svježeg sira',                                               k:270, p:19, c:3,  f:20 },
      { t:'100g lososa + krastavac',                                                        k:212, p:20, c:2,  f:13 },
      { t:'30g badema + 2 kašike kikiriki maslaca',                                         k:351, p:12, c:11, f:29 },
    ],
    vecera: [
      { t:'250g pilećih prsa + 300g karfiola-riža + maslinovo ulje',                        k:572, p:78, c:14, f:23 },
      { t:'200g lososa + 200g šparoge + 2 kašike maslaca + limun',                         k:613, p:41, c:6,  f:48 },
      { t:'220g ćufti od govedine 20% m.m. + 200g brokule u maslacu',                      k:700, p:53, c:11, f:52 },
      { t:'220g brancina ili oslića + 200g tikvica u maslacu',                             k:424, p:43, c:6,  f:25 },
      { t:'200g puretine + 300g miješane zelene salate + avokado',                         k:536, p:59, c:14, f:27 },
      { t:'250g govedine + 200g šampinjona + 50g cheddar sira + salata',                   k:801, p:65, c:9,  f:56 },
      { t:'200g svinjetine + 200g kelja + maslinovo ulje + češnjak',                       k:458, p:44, c:13, f:25 },
    ],
  },

  mediterranean: {
    dorucak: [
      { t:'3 jaja + 2 kriške hljeba + avokado + rajčica + maslinovo ulje',                  k:557, p:22, c:36, f:35 },
      { t:'200g grčkog jogurta + 50g zobi + kašika meda + orasi + bobice',                  k:525, p:20, c:73, f:16 },
      { t:'Omlet: 3 jaja + špinat + 30g fete + 2 kriške hljeba + maslinovo ulje',          k:565, p:30, c:30, f:33 },
      { t:'80g zobi + 300ml mlijeka + banana + 30g badema + cimet',                         k:678, p:21, c:96, f:18 },
      { t:'3 jaja + 100g sardina + paradajz + maslinovo ulje + peršun',                    k:560, p:40, c:4,  f:41 },
      { t:'200g skyra + 40g zobi + kašika meda + orasi',                                   k:455, p:24, c:60, f:12 },
      { t:'2 jaja + 100g domaćeg sira + rajčice + maslinovo ulje',                         k:404, p:24, c:6,  f:31 },
    ],
    uzina: [
      { t:'150g humusa + svježe povrće: mrkva, paprika, krastavac',                        k:278, p:12, c:32, f:11 },
      { t:'200g grčkog jogurta + šaka badema + kašika meda',                               k:370, p:20, c:34, f:16 },
      { t:'30g badema + jabuka',                                                            k:281, p:7,  c:36, f:15 },
      { t:'100g sardina u maslinovom ulju + 2 kriške hljeba + limun',                      k:393, p:23, c:30, f:18 },
      { t:'150g svježeg sira + bobice + maslinovo ulje',                                   k:260, p:18, c:12, f:15 },
      { t:'3 kuhana jaja + masline + rajčica',                                             k:326, p:22, c:4,  f:24 },
      { t:'150g labneh + povrće + maslinovo ulje',                                         k:310, p:10, c:10, f:24 },
    ],
    rucak: [
      { t:'250g lososa + 300g slatkog krompira + rukola salata + maslinovo ulje',           k:1000,p:54, c:68, f:52 },
      { t:'200g bijele ribe (brancin) + 80g (suhog) bulgura + grilovano povrće',           k:620, p:40, c:74, f:15 },
      { t:'Greek salata: 200g piletine + 100g fete + masline + paradajz + ulje',           k:678, p:53, c:10, f:46 },
      { t:'150g slanutka + 80g (suhe) kinoe + salata s bosiljkom + maslinovo ulje',        k:616, p:26, c:89, f:17 },
      { t:'200g lososa + 80g (suhog) bulgura + kupus salata s mentom',                     k:762, p:44, c:74, f:28 },
      { t:'250g piletine s ružmarinom + 150g krompira + 200g grilovane tikvice',           k:668, p:70, c:44, f:22 },
      { t:'200g tune + 150g kuhane leće + salata od špinat i fete',                       k:598, p:56, c:48, f:14 },
    ],
    predtrening: [
      { t:'Jabuka + 30g badema',                                                            k:281, p:7,  c:36, f:15 },
      { t:'200g grčkog jogurta + kašika meda',                                             k:182, p:20, c:16, f:0  },
      { t:'2 kuhana jaja + masline',                                                       k:193, p:13, c:1,  f:15 },
      { t:'Banana + 20g oraha',                                                            k:238, p:3,  c:33, f:13 },
      { t:'150g humusa + povrće',                                                          k:278, p:12, c:32, f:11 },
      { t:'2 datule + 20g badema + jabuka',                                                k:319, p:5,  c:57, f:11 },
      { t:'200g jogurta + bobice',                                                         k:158, p:7,  c:17, f:2  },
    ],
    vecera: [
      { t:'220g brancina (pećnica, limun) + 80g (suhe) kinoe + rajčice',                   k:568, p:45, c:63, f:12 },
      { t:'200g lososa + 150g krompira + šparoge + maslinovo ulje',                        k:710, p:43, c:36, f:39 },
      { t:'150g slanutka + 150g (suhe) riže + pečeno povrće + maslinovo ulje',            k:808, p:22, c:139,f:14 },
      { t:'200g lignji grilovanih + 80g (suhog) bulgura + salata od rajčice',             k:499, p:36, c:76, f:7  },
      { t:'200g bijele ribe + 80g (suhe) heljde + tikvice + maslinovo ulje',              k:544, p:41, c:69, f:14 },
      { t:'150g pilećeg filea + 200g (suhog) bulgura + tzatziki + salata',               k:694, p:40, c:103,f:10 },
      { t:'200g piletine + 150g slanutka + povrće na maslinovom ulju',                   k:666, p:52, c:60, f:21 },
    ],
  },
};

// ─── Shuffle ─────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

// ─── Skaliranje porcija ───────────────────────────────────────────────────────
const BASELINE_KCAL = 2640; // tačan prosjek kcal iz mealDB (none diet)

function scaleMealText(text, factor) {
  if (!factor || Math.abs(factor-1) < 0.05) return text;
  return text
    .replace(/(\d+)(g\s)/g, (m,n,u) => { const v=parseInt(n); return v<20?m:`${Math.round(v*factor/5)*5}${u}`; })
    .replace(/(\d+)(ml\s)/g,(m,n,u) => { const v=parseInt(n); return v<20?m:`${Math.round(v*factor/50)*50}${u}`; });
}

function scaleMeal(meal, factor) {
  if (!factor || Math.abs(factor-1) < 0.05) return meal;
  return {
    t: scaleMealText(meal.t, factor),
    k: Math.round(meal.k * factor),
    p: Math.round(meal.p * factor),
    c: Math.round(meal.c * factor),
    f: Math.round(meal.f * factor)
  };
}

// ─── Dnevni savjeti ───────────────────────────────────────────────────────────
const dayTips = {
  loss:     ['Protein u svakom obroku osigurava da gubiš mast, a ne mišiće.','Pij čašu vode 20 min prije svakog obroka za bolju sitost.','Povrće je gotovo bez kalorija — jedi ga neograničeno.','Trening snage danas: metabolizam radi 24h nakon vježbanja.','Pred-trening obrok drži energiju stabilnom.','Dan odmora — šetnja 30-40 min je dovoljna.','Vikend slobodan obrok je OK — ne sabotiraj čitav dan!'],
  maintain: ['Konzistentnost je ključ — isti ritam obroka svaki dan.','Hidratacija poboljšava performanse za 15-20%.','Raznolikost hrane = raznolikost nutrijenata.','Trening snage 3x/sedmično čuva mišiće.','Pred-trening ugljikohidrati su gorivo.','Aktivan odmor — bicikl, plivanje, priroda.','Jednom sedmično slobodan obrok je OK.'],
  gain:     ['Kalorijski surplus je obavezan — ne preskači obroke!','Protein odmah nakon treninga je najvažniji obrok.','Ugljikohidrati pune glikogen — gorivo za sutrašnji trening.','Progresivno preopterećenje svake sedmice.','Pred-trening = gorivo; post-trening = oporavak.','Dan odmora nije dan gladovanja.','San 8h je minimum za mišićni rast.'],
  recomp:   ['Rekompozicija zahtijeva strpljenje — promjene su sporije ali trajne.','Vaga se možda neće micati — ali ogledalo hoće.','Visok protein (40% kalorija) je apsolutni prioritet.','Trening snage 3-4x/sedmično je obavezan za rekompoziciju.','Ne preskači ugljikohidrate — gorivo su za trening.','Dan odmora: šetaj, istežeš se, oporavi tijelo.','Vikend: slobodan obrok je OK, ali nemoj pretjerivati.']
};
const dayNames = ['Ponedjeljak','Utorak','Srijeda','Četvrtak','Petak','Subota','Nedjelja'];

function buildPlan(db, goal, factor, mealFilter) {
  const tips = dayTips[goal]||dayTips.maintain;
  return dayNames.map((day,i) => {
    const pick = (list) => {
      const filtered = mealFilter ? list.filter(m => !mealFilter(m.t)) : list;
      const src = filtered.length ? filtered : list;
      return scaleMeal(shuffle(src)[0], factor);
    };
    return {
      day, dayNum:i+1,
      meals: { dorucak:pick(db.dorucak), uzina:pick(db.uzina), rucak:pick(db.rucak), predtrening:pick(db.predtrening), vecera:pick(db.vecera) },
      tip: tips[i]||null
    };
  });
}

function fallbackPlan(diet, goal, targetKcal) {
  const db = mealDB[diet]||mealDB.none;
  const factor = targetKcal ? targetKcal/BASELINE_KCAL : 1;
  return buildPlan(db, goal, factor, null);
}

// ─── Smart fallback s filtriranjem ───────────────────────────────────────────
const RESTRICT_KEYWORDS = {
  lactose:  { keywords:['laktoz','mlijeko','jogurt','skyr','svježi sir','domaći sir','feta','mozarela','parmezan'], dietOverride:'lactose_free' },
  gluten:   { keywords:['hljeb','tjestenin','zobene','bulgur','tortilja','lepinjica','palačink'], dietOverride:'gluten_free' },
  nuts:     { keywords:['orah','badem','lješnj','kešu','pistaći'] },
  seafood:  { keywords:['losos','tuna','oslić','brancin','sardine','skuša','riba','lignje'] },
  egg:      { keywords:['jaje','jaja','bjelance','kajgana','omlet'] },
  migraine: { keywords:['feta','parmezan','gorgonzol','salama','hrenovk','slanina'] },
};
function detectServerRestrictions(restrictions, healthNotes) {
  const text = ((restrictions||'')+' '+(healthNotes||'')).toLowerCase();
  const excludes=[];
  let dietOverride=null;
  for (const [id, rule] of Object.entries(RESTRICT_KEYWORDS)) {
    const mentioned =
      (id==='lactose'  && (text.includes('laktoz')||text.includes('mliječ'))) ||
      (id==='gluten'   && (text.includes('gluten')||text.includes('celijak'))) ||
      (id==='nuts'     && (text.includes('oraš')||text.includes('badem')||text.includes('alerg'))) ||
      (id==='seafood'  && (text.includes('riba')||text.includes('morsk')||text.includes('plodovi mora'))) ||
      (id==='egg'      && text.includes('jaj')) ||
      (id==='migraine' && (text.includes('migren')||text.includes('glavobol')));
    if (mentioned) { excludes.push(...rule.keywords); if(rule.dietOverride&&!dietOverride) dietOverride=rule.dietOverride; }
  }
  return { excludes, dietOverride };
}
function smartFallbackServer(diet, goal, restrictions, healthNotes, targetKcal) {
  const { excludes, dietOverride } = detectServerRestrictions(restrictions, healthNotes);
  const effectiveDiet = dietOverride||diet;
  const db = mealDB[effectiveDiet]||mealDB[diet]||mealDB.none;
  const factor = targetKcal ? targetKcal/BASELINE_KCAL : 1;
  const filter = excludes.length ? (t) => excludes.some(ex => t.toLowerCase().includes(ex.toLowerCase())) : null;
  return buildPlan(db, goal, factor, filter);
}

// ─── Grok AI ──────────────────────────────────────────────────────────────────
async function generateWithGrok(userData, nutrition) {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) return null;
  const dl={ none:'omnivor', vegetarian:'lakto-ovo-vegetarijanac', vegan:'vegan', lactose_free:'bez laktoze', gluten_free:'bez glutena', keto:'keto', mediterranean:'mediteranski' };
  const gl={ loss:'mršavljenje', maintain:'održavanje', gain:'izgradnja mišića', recomp:'rekompozicija tijela' };
  const al={ sedentary:'sjedilački', light:'laka aktivnost 1-3x/sedmično', moderate:'umjerena aktivnost 3-5x/sedmično', active:'visoka aktivnost 6-7x/sedmično', very_active:'jako visoka aktivnost' };
  const prompt = `Nutricionista iz BiH. Personalizirani plan ishrane s lokalno dostupnim namirnicama.
PROFIL: ${userData.gender==='male'?'Muškarac':'Žena'}, ${userData.age}g, ${userData.height}cm, ${userData.weight}kg, ${al[userData.activity]}, Cilj: ${gl[userData.goal]}, Ishrana: ${dl[userData.diet]}
${userData.restrictions?`Ograničenja: ${userData.restrictions}`:''}
${userData.healthNotes?`Zdravlje: ${userData.healthNotes}`:''}
CILJEVI: ${nutrition.target} kcal/dan, P:${nutrition.macro.protein}g, UH:${nutrition.macro.carbs}g, M:${nutrition.macro.fats}g
5 obroka/dan. PAZI: porcije moraju odgovarati ${nutrition.target} kcal cilju. Navedi gramažu za svaku namirnicu.
Vrati SAMO JSON: {"week":[{"day":"Ponedjeljak","dayNum":1,"meals":{"dorucak":"...","uzina":"...","rucak":"...","predtrening":"...","vecera":"..."},"tip":"..."}],"shoppingList":{"proteini":[],"ugljikohidrati":[],"masti":[],"voce":[],"povrce":[],"ostalo":[]},"keyRules":[],"mealPrepTip":"..."}`;
  try {
    const res = await doFetch('https://api.x.ai/v1/chat/completions', {
      method:'POST', headers:{'Authorization':`Bearer ${apiKey}`,'Content-Type':'application/json'},
      body: JSON.stringify({ model:'grok-3-mini', messages:[{role:'user',content:prompt}], temperature:0.7, max_tokens:3500 })
    });
    if (!res.ok) { console.error('Grok:', res.status); return null; }
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content||'';
    return JSON.parse(raw.replace(/```json|```/g,'').trim());
  } catch(err) { console.error('Grok error:', err.message); return null; }
}

function defaultShopping(diet) {
  const p={ none:['Pileća prsa 1,5kg','Puretina 500g','Govedina 10% m.m. 600g','Riba (oslić/losos) 800g','Jaja 20 kom','Grčki jogurt 2% 1kg','Skyr 1kg'], vegetarian:['Jaja 20 kom','Grčki jogurt 2% 1kg','Skyr 1kg','Cottage cheese 500g','Whey protein','Tofu 400g','Leća 500g','Slanutak 3 konz.'], vegan:['Tofu 500g','Tempeh 300g','Leća suha 500g','Slanutak 3 konz.','Edamame smrznuto 400g','Biljni protein prah'], lactose_free:['Pileća prsa 1,5kg','Riba 800g','Jaja 20 kom','Bezlaktozni grčki jogurt 1kg','Bezlaktozni skyr 1kg','Sardine (konz.) 4 kom'], gluten_free:['Pileća prsa 1,5kg','Riba 800g','Jaja 20 kom','Grčki jogurt 1kg','Skyr 1kg','Govedina 600g'], keto:['Pileća prsa 1kg','Losos 800g','Govedina 20% m.m. 600g','Jaja 24 kom','Slanina 400g','Puni svježi sir 500g','Cheddar sir 300g'], mediterranean:['Losos 800g','Sardine (konz.) 4 kom','Brancin/oslić 600g','Pileća prsa 800g','Jaja 16 kom','Grčki jogurt 2% 1kg','Feta sir 300g'] };
  return { proteini:p[diet]||p.none, ugljikohidrati:diet==='keto'?['Avokado (zamjena za UH)','Karfiol (zamjena za rižu)','Tikvice']:['Zobene pahuljice 1kg','Integralna riža 1kg','Heljda 500g','Integralni hljeb','Krompir 2kg','Slatki krompir 1kg'], masti:diet==='keto'?['Maslinovo ulje 500ml','Maslac 250g','Avokado 5 kom','Orasi 300g','Bademi 300g']:['Maslinovo ulje 500ml','Avokado 3-4 kom','Orasi 200g','Bademi 200g','Chia sjemenke 150g'], voce:['Banane 1kg','Jabuke 1kg','Bobice 500g','Limun 3 kom'], povrce:['Brokula 500g','Špinat 300g','Paprika 4 kom','Krastavci 500g','Paradajz 1kg','Tikvice 3 kom','Mahune 400g','Šargarepa 500g','Luk 500g','Bijeli luk 2 gl.'], ostalo:['Med 200g','Začini (kurkuma, cimet, đumbir)','Soja sos','Paradajz pelat 3 konz.'] };
}

function defaultRules(goal, diet) {
  const r={ loss:['Protein u svakom obroku (30g+) — ključ za zadržavanje mišića','Nikad ne preskači obroke — sabotira metabolizam','400-500g povrća dnevno + 2,5L vode','Jednom sedmično slobodan obrok — bolje nego restriktivno pa srušiti sve'], maintain:['Konzistentnost ritma obroka je važnija od savršenih jela','Protein 0,8-1g/kg tjelesne težine svaki dan','Hidratacija: 2-2,5L vode dnevno','Trening snage 3x/sedmično za očuvanje mišića'], gain:['Kalorijski surplus obavezan — ne preskači niti jedan obrok','Protein odmah nakon treninga — anabolički prozor 30-60 min','Ugljikohidrati su gorivo za trening — ne izbjegavaj ih','San 8h je obavezan — 70% mišićnog rasta tokom sna'], recomp:['Proteini 40% kalorija (2g/kg) — apsolutni prioritet','Jedeš na TDEE — nema deficita ni surplusa','Trening snage 3-4x/sedmično je obavezan','Mjeri napredak obimom (struk, bedra) — ne samo vagom'] };
  const extra={ lactose_free:'Svaki mliječni proizvod zamijeni bezlaktoznom verzijom ili sojinim/zobenim mlijekom', gluten_free:'Nikad pšenica, ječam ni raž — koristi rižu, heljdu, kinoa i proso', keto:'Ugljikohidrati max 20-50g/dan — provjeri etikete svega što jedeš', mediterranean:'Maslinovo ulje ekstra djevičansko je tvoje primarno ulje — koristi ga svaki dan' };
  const rules=[...(r[goal]||r.maintain)];
  if(extra[diet]) rules.push(extra[diet]);
  return rules;
}

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req,res) => res.json({ status:'OK', node:process.version, grok:process.env.GROK_API_KEY?'configured':'not configured', uptime:Math.round(process.uptime())+'s' }));

// ─── /plan endpoint ───────────────────────────────────────────────────────────
app.post('/plan', async (req,res) => {
  try {
    const b = req.body;
    if (!b||typeof b!=='object') return res.status(400).json({error:'Neispravan zahtjev'});
    const parsed = { weight:parseFloat(b.weight), height:parseFloat(b.height), age:parseInt(b.age), gender:b.gender, activity:b.activity, goal:b.goal, diet:b.diet, restrictions:b.restrictions||'', healthNotes:b.healthNotes||'', useAI:b.useAI===true||b.useAI==='true' };
    console.log(`📋 Plan: ${parsed.gender}, ${parsed.age}g, ${parsed.weight}kg, goal=${parsed.goal}, diet=${parsed.diet}, AI=${parsed.useAI}`);
    const errors = validateInput(parsed);
    if (errors.length) { console.log('❌ Validacija:', errors); return res.status(400).json({error:errors.join('; ')}); }
    const nutrition = calcNutrition(parsed);
    console.log(`✅ Cilj: ${nutrition.target} kcal, faktor: ${(nutrition.target/BASELINE_KCAL).toFixed(2)}x`);
    let week, shoppingList, keyRules, mealPrepTip, personalAnalysis='', aiGenerated=false;
    if (parsed.useAI) {
      console.log('🤖 Grok AI...');
      const ai = await generateWithGrok(parsed, nutrition);
      if (ai?.week) { ({week,shoppingList,keyRules,mealPrepTip}=ai); aiGenerated=true; personalAnalysis=ai.personalAnalysis||''; console.log('✅ Grok AI ok'); }
      else console.log('⚠️ Grok AI fallback');
    }
    if (!week) {
      const hasRestrictions = parsed.restrictions||parsed.healthNotes;
      week = hasRestrictions
        ? smartFallbackServer(parsed.diet, parsed.goal, parsed.restrictions, parsed.healthNotes, nutrition.target)
        : fallbackPlan(parsed.diet, parsed.goal, nutrition.target);
    }
    if (!shoppingList) shoppingList = defaultShopping(parsed.diet);
    if (!keyRules)     keyRules     = defaultRules(parsed.goal, parsed.diet);
    if (!mealPrepTip)  mealPrepTip  = 'Nedjelja: ispeci 1kg piletine, skuhaj 400g riže, nareži 1kg povrća, skuhaj 10 jaja. Investiraš 1,5h, dobiješ 4 ručka i 4 večere gotovo.';
    if (!personalAnalysis && (parsed.restrictions||parsed.healthNotes)) {
      personalAnalysis = `Ograničenja "${[parsed.restrictions,parsed.healthNotes].filter(Boolean).join(', ')}" su uzeta u obzir. Za potpuno personalizirani jelovnik uključite AI personalizaciju.`;
    }
    console.log('📤 Šaljem odgovor...');
    res.json({ nutrition, week, shoppingList, keyRules, mealPrepTip, personalAnalysis, aiGenerated });
  } catch(err) {
    console.error('❌ /plan greška:', err.message, err.stack);
    res.status(500).json({error:`Server greška: ${err.message}`});
  }
});

app.listen(PORT,'0.0.0.0',()=>{
  console.log(`✅ FoodManager na http://localhost:${PORT}`);
  console.log(`📦 Node: ${process.version} | 🤖 Grok: ${process.env.GROK_API_KEY?'AKTIVAN':'neaktivan'}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
});

app.use((err,req,res,next) => { console.error('Express greška:',err); res.status(500).json({error:err.message}); });
process.on('uncaughtException', err => console.error('Unhandled:', err.message));
process.on('unhandledRejection', r => console.error('Rejection:', r));
