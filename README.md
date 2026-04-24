# 🥗 FoodManager v2

Personalizirani sedmični plan ishrane za korisnike iz BiH i regije — bosanska kuhinja, 5 obroka dnevno, opcijska Grok AI personalizacija.

## Funkcionalnosti

- ✅ **Tačan TDEE** — Mifflin-St Jeor BMR × PAL × goal faktor
- ✅ **5 obroka/dan** — Doručak, Užina, Ručak, Pred-trening, Večera
- ✅ **Bosanska kuhinja** — lokalno dostupne namirnice i recepti
- ✅ **3 tipa ishrane** — Omnivor, Vegetarijanac, Vegan
- ✅ **Posebna ograničenja** — intolerancija na laktozu, alergije, zdravstvene napomene
- ✅ **🤖 Grok AI** — opcijski AI-personalizirani plan s dnevnim savjetima
- ✅ **Lista za kupovinu** — automatski generirana po sedmici
- ✅ **Ključna pravila** — prilagođena cilju (gubitak/održavanje/gain)
- ✅ **Excel export** — realni .xlsx s više sheetova (SheetJS)
- ✅ **Tekst export** — formatiran .txt plan
- ✅ **localStorage** — pamti unose između sesija
- ✅ **Validacija** — frontend + backend
- ✅ **Responsivan** — mobile-friendly

## Pokretanje

```bash
npm install
cp .env.example .env   # dodaj Grok API key ako imaš
npm start
```

Otvori: http://localhost:3000

## Grok AI

Nabavi API key na [console.x.ai](https://console.x.ai/) i dodaj u `.env`:

```
GROK_API_KEY=xai-xxxx...
```

Bez ključa, aplikacija koristi bogatu lokalnu bazu obroka.

## Nutritivna formula

```
BMR  = Mifflin-St Jeor (težina, visina, dob, spol)
TDEE = BMR × PAL faktor (aktivnost)
Cilj = TDEE + deficit/surplus po cilju
```

| Aktivnost | PAL |
|---|---|
| Sjedilački | 1.20 |
| Laka (1–3x/sedmično) | 1.375 |
| Umjerena (3–5x) | 1.55 |
| Visoka (6–7x) | 1.725 |
| Jako visoka | 1.90 |

## Autor

**Alan Catovic** — [dtd.ba](http://dtd.ba)
