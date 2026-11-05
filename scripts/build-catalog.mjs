import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEED_PART_1 } from './seed-part1.mjs';
import { SEED_PART_2 } from './seed-part2.mjs';
import { SEED_PART_3 } from './seed-part3.mjs';
import { SEED_PART_4 } from './seed-part4.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.resolve(__dirname, '../src/data/generatedCatalog.json');
const PUBLIC_CAT_DIR = path.resolve(__dirname, '../public/categories');

const USER_AGENT =
  'TheFloorCatalogBuilder/3.0 (https://github.com/albertorosati/my-floor; educational trivia game)';

const FORBIDDEN_KEYWORDS = [
  '.svg',
  '.ogg',
  '.webm',
  '.ogv',
  '.pdf',
  '.tif',
  '.tiff',
  '.gif',
  'question_book',
  'no_free_image',
  'replace_this_image',
  'disambig',
  'commons-logo',
  'flag_of_',
  '_wordmark',
  '_logo',
  'logo_',
  '_poster',
  'poster_',
  'title_card',
  'intertitle',
  'album_cover',
  'box_art',
  'locandina',
  'stemma',
  'coat_of_arms',
  'signature',
  'autograph',
  'map_of_',
  'locator_map',
];

async function fetchJson(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
      });
      if (res.ok) {
        return await res.json();
      }
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
      }
    } catch {
      await new Promise((r) => setTimeout(r, 600));
    }
  }
  return null;
}

/**
 * Verifica che l'immagine sia una vera fotografia di alta qualità, senza loghi/scritte/poster
 * e con proporzioni equilibrate (0.65 <= width/height <= 2.05).
 */
function isHighQualityPhoto(thumbObj, pageImageName = '') {
  if (!thumbObj || typeof thumbObj.source !== 'string') return false;
  const url = thumbObj.source;
  const combined = `${url} ${pageImageName}`.toLowerCase();

  for (const bad of FORBIDDEN_KEYWORDS) {
    if (combined.includes(bad)) return false;
  }

  const w = thumbObj.width || 0;
  const h = thumbObj.height || 0;
  if (w > 0 && h > 0) {
    if (w < 360 || h < 260) return false;
    const ratio = w / h;
    if (ratio < 0.62 || ratio > 2.15) return false;
  }

  return true;
}

/**
 * Risolve in batch fino a 40 titoli su Wikipedia (EN o IT) usando `pithumbsize=960` (HD Varnish step).
 */
async function resolveWikiBatch(titles, lang = 'en', pilicense = 'free') {
  const resultMap = new Map();
  if (titles.length === 0) return resultMap;

  const batchSize = 40;
  for (let i = 0; i < titles.length; i += batchSize) {
    const chunk = titles.slice(i, i + batchSize);
    const params = new URLSearchParams({
      action: 'query',
      titles: chunk.join('|'),
      prop: 'pageimages',
      piprop: 'thumbnail|name',
      pithumbsize: '960',
      pilicense,
      redirects: '1',
      format: 'json',
    });

    const apiUrl = `https://${lang}.wikipedia.org/w/api.php?${params.toString()}`;
    const data = await fetchJson(apiUrl);
    if (!data?.query) continue;

    const normMap = new Map();
    for (const n of data.query.normalized || []) {
      normMap.set(n.from, n.to);
    }
    const redirMap = new Map();
    for (const r of data.query.redirects || []) {
      redirMap.set(r.from, r.to);
    }

    const pagesByTitle = new Map();
    for (const page of Object.values(data.query.pages || {})) {
      if (page?.title) {
        pagesByTitle.set(page.title, page);
      }
    }

    for (const origTitle of chunk) {
      let cur = normMap.get(origTitle) ?? origTitle;
      let guard = 0;
      while (redirMap.has(cur) && guard < 5) {
        cur = redirMap.get(cur);
        guard++;
      }
      const page = pagesByTitle.get(cur);
      if (isHighQualityPhoto(page?.thumbnail, page?.pageimage)) {
        resultMap.set(origTitle, page.thumbnail.source);
      }
    }
  }
  return resultMap;
}

/**
 * Fallback singolo: cerca su Wikipedia IT/EN oppure su Wikimedia Commons (filetype:bitmap HD 960px)
 * verificando risoluzione e aspect ratio.
 */
async function resolveFallbackSingle(query, answer, pilicense = 'any') {
  for (const lang of ['en', 'it']) {
    const params = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrsearch: query,
      gsrlimit: '6',
      prop: 'pageimages',
      piprop: 'thumbnail|name',
      pithumbsize: '960',
      pilicense,
      format: 'json',
    });
    const data = await fetchJson(
      `https://${lang}.wikipedia.org/w/api.php?${params.toString()}`
    );
    const pages = Object.values(data?.query?.pages || {}).sort(
      (a, b) => (a.index ?? 99) - (b.index ?? 99)
    );
    for (const p of pages) {
      if (isHighQualityPhoto(p?.thumbnail, p?.pageimage)) {
        return p.thumbnail.source;
      }
    }
  }

  const commonsParams = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrnamespace: '6',
    gsrsearch: `filetype:bitmap ${query || answer} -logo -poster -map`,
    gsrlimit: '8',
    prop: 'imageinfo',
    iiprop: 'url|dimensions',
    iiurlwidth: '960',
    format: 'json',
  });
  const cData = await fetchJson(
    `https://commons.wikimedia.org/w/api.php?${commonsParams.toString()}`
  );
  for (const p of Object.values(cData?.query?.pages || {})) {
    const info = p?.imageinfo?.[0];
    if (!info) continue;
    const candidateObj = {
      source: info.thumburl || info.url,
      width: info.thumbwidth || info.width,
      height: info.thumbheight || info.height,
    };
    if (isHighQualityPhoto(candidateObj, p?.title)) {
      return candidateObj.source;
    }
  }
  return null;
}

async function main() {
  const allSeeds = [
    ...SEED_PART_1,
    ...SEED_PART_2,
    ...SEED_PART_3,
    ...SEED_PART_4,
  ];
  const outputCategories = [];
  const manifestCategories = [];
  let totalItems = 0;

  await fs.mkdir(PUBLIC_CAT_DIR, { recursive: true });
  console.log(`Avvio generazione HD di ${allSeeds.length} categorie modulari...`);

  for (const cat of allSeeds) {
    const primaryLang = cat.lang || 'en';
    const secondaryLang = primaryLang === 'en' ? 'it' : 'en';
    const licenseMode = cat.pilicense || 'free';

    const normalizedEntries = cat.entries.map((raw, idx) => {
      if (Array.isArray(raw)) {
        return {
          id: `${cat.id}-${idx + 1}`,
          answer: raw[0].trim(),
          wikiQuery: raw[1].trim(),
          aliases: (raw[2] || []).map((a) => a.trim()).filter(Boolean),
        };
      }
      return {
        id: `${cat.id}-${idx + 1}`,
        answer: raw.answer.trim(),
        wikiQuery: raw.wikiQuery || raw.answer.trim(),
        steamAppId: raw.steamAppId,
        pokeId: raw.pokeId,
        flagCode: raw.flagCode,
        aliases: (raw.aliases || []).map((a) => a.trim()).filter(Boolean),
      };
    });

    const wikiNeeded = normalizedEntries
      .filter((e) => !e.steamAppId && !e.pokeId && !e.flagCode)
      .map((e) => e.wikiQuery);

    const primaryMap = await resolveWikiBatch(
      wikiNeeded,
      primaryLang,
      licenseMode
    );
    const stillMissing = wikiNeeded.filter((q) => !primaryMap.has(q));
    const secondaryMap = await resolveWikiBatch(
      stillMissing,
      secondaryLang,
      licenseMode
    );

    const items = [];
    for (const entry of normalizedEntries) {
      let imageUrl = null;

      if (entry.pokeId) {
        imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${entry.pokeId}.png`;
      } else if (entry.flagCode) {
        imageUrl = `https://flagcdn.com/w640/${entry.flagCode.toLowerCase()}.png`;
      } else if (entry.steamAppId) {
        imageUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${entry.steamAppId}/library_hero.jpg`;
      } else {
        imageUrl =
          primaryMap.get(entry.wikiQuery) ||
          secondaryMap.get(entry.wikiQuery) ||
          (await resolveFallbackSingle(
            entry.wikiQuery,
            entry.answer,
            licenseMode
          ));
      }

      if (imageUrl) {
        items.push({
          id: entry.id,
          answer: entry.answer,
          aliases: entry.aliases,
          imageUrl,
        });
      }
    }

    const coverImage = items[0]?.imageUrl || '';
    const previewImages = items.slice(0, 4).map((i) => i.imageUrl);

    const categoryData = {
      id: cat.id,
      name: cat.name,
      subtitle: cat.subtitle,
      icon: cat.icon,
      themeHex: cat.accent,
      coverImage,
      previewImages,
      items,
    };

    outputCategories.push(categoryData);
    manifestCategories.push({
      id: cat.id,
      name: cat.name,
      subtitle: cat.subtitle,
      icon: cat.icon,
      themeHex: cat.accent,
      coverImage,
      itemCount: items.length,
      dataUrl: `./categories/${cat.id}.json`,
    });

    // Salva il file JSON singolo modulare per questa categoria
    await fs.writeFile(
      path.join(PUBLIC_CAT_DIR, `${cat.id}.json`),
      JSON.stringify(categoryData, null, 2),
      'utf8'
    );

    totalItems += items.length;
    console.log(
      `✓ [${outputCategories.length}/${allSeeds.length}] ${cat.icon} ${cat.name}: ${items.length}/${normalizedEntries.length} foto HD validate`
    );
  }

  // Salva il manifesto index.json in public/categories/index.json
  await fs.writeFile(
    path.join(PUBLIC_CAT_DIR, 'index.json'),
    JSON.stringify({ totalCategories: manifestCategories.length, totalPhotos: totalItems, categories: manifestCategories }, null, 2),
    'utf8'
  );

  // Salva il catalogo aggregato per import sincrono / unit test
  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
  await fs.writeFile(
    OUT_FILE,
    JSON.stringify(outputCategories, null, 2),
    'utf8'
  );

  console.log(
    `\nCOMPLETATO! Salvate ${outputCategories.length} categorie modulari (${totalItems} fotografie HD) in public/categories/*.json e ${OUT_FILE}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
